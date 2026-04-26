<?php
declare(strict_types=1);

class StockController
{
    /**
     * POST /variants/{id}/stock
     * Body: { mode: 'set'|'add', quantity: int, low_stock_threshold?: int }
     * 'set'  → stock_quantity = quantity        (quantity >= 0)
     * 'add'  → stock_quantity = stock + delta   (delta can be negative; result must stay >= 0)
     */
    public function update(Request $req): array
    {
        $vid = (int)($req->params['id'] ?? 0);
        $b = $req->body();
        $mode = (string)($b['mode'] ?? '');
        if (!in_array($mode, ['set', 'add'], true)) {
            Response::error('invalid_input', "mode must be 'set' or 'add'", 422);
        }
        if (!array_key_exists('quantity', $b) || !is_numeric($b['quantity'])) {
            Response::error('invalid_input', 'quantity is required (integer)', 422);
        }
        $qty = (int)$b['quantity'];

        $pdo = Database::pdo();
        $pdo->beginTransaction();
        try {
            $sel = $pdo->prepare(
                'SELECT id, product_id, size, price, stock_quantity, low_stock_threshold
                 FROM product_variants WHERE id = ? FOR UPDATE'
            );
            $sel->execute([$vid]);
            $v = $sel->fetch();
            if (!$v) {
                $pdo->rollBack();
                Response::notFound('Variant not found');
            }

            if ($mode === 'set') {
                if ($qty < 0) {
                    $pdo->rollBack();
                    Response::error('invalid_input', 'Quantity cannot be negative', 422);
                }
                $newQty = $qty;
            } else {
                $newQty = (int)$v['stock_quantity'] + $qty;
                if ($newQty < 0) {
                    $pdo->rollBack();
                    Response::error('invalid_input',
                        'Resulting stock would be negative', 422,
                        ['current' => (int)$v['stock_quantity'], 'delta' => $qty]
                    );
                }
            }

            $updates = ['stock_quantity = ?'];
            $params  = [$newQty];

            if (array_key_exists('low_stock_threshold', $b)) {
                $thr = (int)$b['low_stock_threshold'];
                if ($thr < 0) {
                    $pdo->rollBack();
                    Response::error('invalid_input', 'low_stock_threshold cannot be negative', 422);
                }
                $updates[] = 'low_stock_threshold = ?';
                $params[]  = $thr;
            }
            $params[] = $vid;

            $sql = 'UPDATE product_variants SET ' . implode(', ', $updates) . ' WHERE id = ?';
            $pdo->prepare($sql)->execute($params);
            $pdo->commit();

            return ['ok' => true, 'variant' => $this->fetchVariant($vid)];
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }

    /** GET /inventory/low-stock — variants with stock <= low_stock_threshold. */
    public function lowStock(Request $req): array
    {
        $stmt = Database::pdo()->query(
            "SELECT pv.id, pv.product_id, pv.size, pv.price,
                    pv.stock_quantity, pv.low_stock_threshold,
                    p.name AS product_name, p.is_available,
                    c.id AS category_id, c.name AS category_name
             FROM product_variants pv
             JOIN products   p ON p.id = pv.product_id
             JOIN categories c ON c.id = p.category_id
             WHERE pv.stock_quantity <= pv.low_stock_threshold
             ORDER BY (pv.stock_quantity = 0) DESC,
                      (pv.low_stock_threshold - pv.stock_quantity) DESC,
                      p.name"
        );
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['price']               = (float)$r['price'];
            $r['stock_quantity']      = (int)$r['stock_quantity'];
            $r['low_stock_threshold'] = (int)$r['low_stock_threshold'];
            $r['is_available']        = (int)$r['is_available'];
        }
        return ['ok' => true, 'variants' => $rows];
    }

    private function fetchVariant(int $id): ?array
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
