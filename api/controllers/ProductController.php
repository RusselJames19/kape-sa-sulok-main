<?php
declare(strict_types=1);

class ProductController
{
    /**
     * GET /products
     *   ?available_only=1  → only is_available=1 and active categories (POS use)
     *   ?category_id=X     → filter
     * Returns products with their variants nested.
     */
    public function index(Request $req): array
    {
        $availableOnly = (string)$req->query('available_only', '0') === '1';
        $categoryId    = $req->query('category_id');

        $where = [];
        $params = [];
        if ($availableOnly) {
            $where[] = 'p.is_available = 1';
            $where[] = 'c.is_active = 1';
        }
        if ($categoryId !== null && $categoryId !== '') {
            $where[] = 'p.category_id = ?';
            $params[] = (int)$categoryId;
        }
        $sql = 'SELECT p.id, p.name, p.description, p.category_id, p.image_url,
                       p.is_available, c.name AS category_name
                FROM products p
                JOIN categories c ON c.id = p.category_id';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY c.name, p.name';

        $stmt = Database::pdo()->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll();

        if (!$products) return ['ok' => true, 'products' => []];

        $ids = array_column($products, 'id');
        $variants = $this->fetchVariantsForProducts($ids);

        foreach ($products as &$p) {
            $p['variants'] = $variants[(int)$p['id']] ?? [];
        }
        return ['ok' => true, 'products' => $products];
    }

    /** GET /products/{id} */
    public function show(Request $req): array
    {
        $id = (int)($req->params['id'] ?? 0);
        $stmt = Database::pdo()->prepare(
            'SELECT p.id, p.name, p.description, p.category_id, p.image_url,
                    p.is_available, c.name AS category_name
             FROM products p
             JOIN categories c ON c.id = p.category_id
             WHERE p.id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if (!$product) Response::notFound('Product not found');

        $variants = $this->fetchVariantsForProducts([$id]);
        $product['variants'] = $variants[$id] ?? [];
        return ['ok' => true, 'product' => $product];
    }

    /**
     * POST /products
     * Body: { name, category_id, description?, image_url?, is_available? }
     */
    public function store(Request $req): array
    {
        $b = $req->body();
        $name = trim((string)($b['name'] ?? ''));
        $cid  = (int)($b['category_id'] ?? 0);
        $desc = isset($b['description']) ? trim((string)$b['description']) : null;
        $img  = isset($b['image_url'])   ? trim((string)$b['image_url'])   : null;
        $avail = array_key_exists('is_available', $b) ? (int)(bool)$b['is_available'] : 1;

        if ($name === '') Response::error('invalid_input', 'name is required', 422);
        if ($cid <= 0)    Response::error('invalid_input', 'category_id is required', 422);

        $pdo = Database::pdo();
        $check = $pdo->prepare('SELECT 1 FROM categories WHERE id = ? LIMIT 1');
        $check->execute([$cid]);
        if (!$check->fetchColumn()) Response::error('invalid_input', 'Category not found', 422);

        $ins = $pdo->prepare(
            'INSERT INTO products (name, description, category_id, image_url, is_available)
             VALUES (?, ?, ?, ?, ?)'
        );
        $ins->execute([$name, $desc, $cid, $img, $avail]);
        $id = (int)$pdo->lastInsertId();

        return $this->show(self::syntheticRequest(['id' => (string)$id]));
    }

    /**
     * PUT /products/{id}
     * Body: { name?, category_id?, description?, image_url? }
     */
    public function update(Request $req): array
    {
        $id = (int)($req->params['id'] ?? 0);
        $exists = Database::pdo()->prepare('SELECT 1 FROM products WHERE id = ?');
        $exists->execute([$id]);
        if (!$exists->fetchColumn()) Response::notFound('Product not found');

        $b = $req->body();
        $sets = []; $vals = [];

        if (array_key_exists('name', $b)) {
            $name = trim((string)$b['name']);
            if ($name === '') Response::error('invalid_input', 'name cannot be empty', 422);
            $sets[] = 'name = ?'; $vals[] = $name;
        }
        if (array_key_exists('category_id', $b)) {
            $cid = (int)$b['category_id'];
            $check = Database::pdo()->prepare('SELECT 1 FROM categories WHERE id = ? LIMIT 1');
            $check->execute([$cid]);
            if (!$check->fetchColumn()) Response::error('invalid_input', 'Category not found', 422);
            $sets[] = 'category_id = ?'; $vals[] = $cid;
        }
        if (array_key_exists('description', $b)) {
            $sets[] = 'description = ?';
            $vals[] = $b['description'] === null ? null : trim((string)$b['description']);
        }
        if (array_key_exists('image_url', $b)) {
            $sets[] = 'image_url = ?';
            $vals[] = $b['image_url'] === null ? null : trim((string)$b['image_url']);
        }

        if ($sets) {
            $vals[] = $id;
            $sql = 'UPDATE products SET ' . implode(', ', $sets) . ' WHERE id = ?';
            Database::pdo()->prepare($sql)->execute($vals);
        }
        return $this->show(self::syntheticRequest(['id' => (string)$id]));
    }

    /**
     * POST /products/{id}/availability
     * Body: { available: bool }
     */
    public function setAvailability(Request $req): array
    {
        $id = (int)($req->params['id'] ?? 0);
        $b = $req->body();
        if (!array_key_exists('available', $b)) {
            Response::error('invalid_input', 'available is required', 422);
        }
        $exists = Database::pdo()->prepare('SELECT 1 FROM products WHERE id = ?');
        $exists->execute([$id]);
        if (!$exists->fetchColumn()) Response::notFound('Product not found');

        $val = (int)(bool)$b['available'];
        Database::pdo()->prepare('UPDATE products SET is_available = ? WHERE id = ?')->execute([$val, $id]);
        return $this->show(self::syntheticRequest(['id' => (string)$id]));
    }

    private static function syntheticRequest(array $params): Request
    {
        $r = new Request();
        $r->params = $params;
        return $r;
    }

    /** @param int[] $productIds  @return array<int, array<int,array>> */
    private function fetchVariantsForProducts(array $productIds): array
    {
        if (!$productIds) return [];
        $place = implode(',', array_fill(0, count($productIds), '?'));
        $sql = "SELECT id, product_id, size, price, stock_quantity, low_stock_threshold
                FROM product_variants
                WHERE product_id IN ($place)
                ORDER BY product_id,
                         FIELD(size, 'none','S','M','L')";
        $stmt = Database::pdo()->prepare($sql);
        $stmt->execute(array_map('intval', $productIds));
        $out = [];
        foreach ($stmt->fetchAll() as $v) {
            $v['price']               = (float)$v['price'];
            $v['stock_quantity']      = (int)$v['stock_quantity'];
            $v['low_stock_threshold'] = (int)$v['low_stock_threshold'];
            $out[(int)$v['product_id']][] = $v;
        }
        return $out;
    }
}
