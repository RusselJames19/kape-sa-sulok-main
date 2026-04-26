<?php
declare(strict_types=1);

class VariantController
{
    private const SIZES = ['none', 'S', 'M', 'L'];

    /**
     * POST /variants
     * Body: { product_id, size, price, stock_quantity?, low_stock_threshold? }
     */
    public function store(Request $req): array
    {
        $b = $req->body();
        $pid   = (int)($b['product_id'] ?? 0);
        $size  = (string)($b['size'] ?? 'none');
        $price = isset($b['price']) ? (float)$b['price'] : -1.0;
        $stock = isset($b['stock_quantity']) ? (int)$b['stock_quantity'] : 0;
        $thr   = isset($b['low_stock_threshold']) ? (int)$b['low_stock_threshold'] : 10;

        if ($pid <= 0)                              Response::error('invalid_input', 'product_id is required', 422);
        if (!in_array($size, self::SIZES, true))    Response::error('invalid_input', 'size must be none/S/M/L', 422);
        if ($price < 0)                             Response::error('invalid_input', 'price must be >= 0', 422);
        if ($stock < 0)                             Response::error('invalid_input', 'stock_quantity must be >= 0', 422);
        if ($thr < 0)                               Response::error('invalid_input', 'low_stock_threshold must be >= 0', 422);

        $pdo = Database::pdo();
        $check = $pdo->prepare('SELECT 1 FROM products WHERE id = ? LIMIT 1');
        $check->execute([$pid]);
        if (!$check->fetchColumn()) Response::notFound('Product not found');

        $dup = $pdo->prepare('SELECT 1 FROM product_variants WHERE product_id = ? AND size = ? LIMIT 1');
        $dup->execute([$pid, $size]);
        if ($dup->fetchColumn()) Response::error('duplicate_variant', 'A variant with that size already exists for this product', 409);

        $ins = $pdo->prepare(
            'INSERT INTO product_variants (product_id, size, price, stock_quantity, low_stock_threshold)
             VALUES (?, ?, ?, ?, ?)'
        );
        $ins->execute([$pid, $size, $price, $stock, $thr]);
        $id = (int)$pdo->lastInsertId();
        return ['ok' => true, 'variant' => $this->fetch($id)];
    }

    /**
     * PUT /variants/{id}
     * Body: { size?, price?, low_stock_threshold? }
     * Stock changes go through StockController to keep audit-friendly semantics.
     */
    public function update(Request $req): array
    {
        $id = (int)($req->params['id'] ?? 0);
        $existing = $this->fetch($id);
        if (!$existing) Response::notFound('Variant not found');

        $b = $req->body();
        $sets = []; $vals = [];

        if (array_key_exists('size', $b)) {
            $size = (string)$b['size'];
            if (!in_array($size, self::SIZES, true)) {
                Response::error('invalid_input', 'size must be none/S/M/L', 422);
            }
            // Uniqueness on (product_id, size) — only check if changing
            if ($size !== $existing['size']) {
                $dup = Database::pdo()->prepare(
                    'SELECT 1 FROM product_variants WHERE product_id = ? AND size = ? AND id <> ? LIMIT 1'
                );
                $dup->execute([(int)$existing['product_id'], $size, $id]);
                if ($dup->fetchColumn()) {
                    Response::error('duplicate_variant', 'A variant with that size already exists for this product', 409);
                }
            }
            $sets[] = 'size = ?';  $vals[] = $size;
        }
        if (array_key_exists('price', $b)) {
            $price = (float)$b['price'];
            if ($price < 0) Response::error('invalid_input', 'price must be >= 0', 422);
            $sets[] = 'price = ?'; $vals[] = $price;
        }
        if (array_key_exists('low_stock_threshold', $b)) {
            $thr = (int)$b['low_stock_threshold'];
            if ($thr < 0) Response::error('invalid_input', 'low_stock_threshold must be >= 0', 422);
            $sets[] = 'low_stock_threshold = ?'; $vals[] = $thr;
        }

        if (!$sets) return ['ok' => true, 'variant' => $existing];

        $vals[] = $id;
        $sql = 'UPDATE product_variants SET ' . implode(', ', $sets) . ' WHERE id = ?';
        Database::pdo()->prepare($sql)->execute($vals);
        return ['ok' => true, 'variant' => $this->fetch($id)];
    }

    /**
     * DELETE /variants/{id}
     * Refuses if the variant has been used in any transaction (FK RESTRICT).
     */
    public function destroy(Request $req): array
    {
        $id = (int)($req->params['id'] ?? 0);
        $existing = $this->fetch($id);
        if (!$existing) Response::notFound('Variant not found');

        $sold = Database::pdo()->prepare('SELECT 1 FROM transaction_items WHERE product_variant_id = ? LIMIT 1');
        $sold->execute([$id]);
        if ($sold->fetchColumn()) {
            Response::error('variant_in_use',
                'Cannot delete: this variant has sales history. Set its stock to 0 instead.', 409);
        }
        Database::pdo()->prepare('DELETE FROM product_variants WHERE id = ?')->execute([$id]);
        return ['ok' => true];
    }

    private function fetch(int $id): ?array
    {
        $stmt = Database::pdo()->prepare(
            'SELECT id, product_id, size, price, stock_quantity, low_stock_threshold
             FROM product_variants WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $v = $stmt->fetch();
        if (!$v) return null;
        $v['price']               = (float)$v['price'];
        $v['stock_quantity']      = (int)$v['stock_quantity'];
        $v['low_stock_threshold'] = (int)$v['low_stock_threshold'];
        return $v;
    }
}
