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

    public function store(Request $req): array        { return ['ok' => true, 'todo' => 'Phase 4: create product']; }
    public function update(Request $req): array       { return ['ok' => true, 'todo' => 'Phase 4: update product']; }
    public function setAvailability(Request $req): array { return ['ok' => true, 'todo' => 'Phase 4: toggle is_available']; }

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
