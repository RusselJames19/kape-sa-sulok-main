<?php
declare(strict_types=1);

class TransactionController
{
    /**
     * GET /transactions
     *   ?limit (default 50, max 200)
     *   Cashiers only see their own; managers/admin/owner see all.
     */
    public function index(Request $req): array
    {
        $limit = (int)$req->query('limit', '50');
        if ($limit < 1)   $limit = 50;
        if ($limit > 200) $limit = 200;

        $role     = (string)($req->user['role'] ?? '');
        $callerId = (int)($req->user['sub'] ?? 0);

        $sql = 'SELECT t.id, t.cashier_user_id, t.total_amount, t.amount_tendered,
                       t.change_given, t.created_at, u.name AS cashier_name
                FROM transactions t
                JOIN users u ON u.id = t.cashier_user_id';
        $params = [];
        if ($role === 'cashier') {
            $sql .= ' WHERE t.cashier_user_id = ?';
            $params[] = $callerId;
        }
        $sql .= ' ORDER BY t.created_at DESC LIMIT ' . $limit;

        $stmt = Database::pdo()->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['total_amount']    = (float)$r['total_amount'];
            $r['amount_tendered'] = (float)$r['amount_tendered'];
            $r['change_given']    = (float)$r['change_given'];
        }
        return ['ok' => true, 'transactions' => $rows];
    }

    /** GET /transactions/{id} — with items. Cashier scoped. */
    public function show(Request $req): array
    {
        $id = (int)($req->params['id'] ?? 0);
        $tx = $this->fetchTx($id);
        if (!$tx) Response::notFound('Transaction not found');

        $role     = (string)($req->user['role'] ?? '');
        $callerId = (int)($req->user['sub'] ?? 0);
        if ($role === 'cashier' && (int)$tx['cashier_user_id'] !== $callerId) {
            Response::forbidden('You can only view your own transactions');
        }

        $stmt = Database::pdo()->prepare(
            "SELECT ti.id, ti.product_variant_id, ti.quantity, ti.unit_price_at_sale,
                    p.name AS product_name, pv.size
             FROM transaction_items ti
             JOIN product_variants pv ON pv.id = ti.product_variant_id
             JOIN products p          ON p.id = pv.product_id
             WHERE ti.transaction_id = ?
             ORDER BY ti.id"
        );
        $stmt->execute([$id]);
        $items = $stmt->fetchAll();
        foreach ($items as &$it) {
            $it['quantity']           = (int)$it['quantity'];
            $it['unit_price_at_sale'] = (float)$it['unit_price_at_sale'];
        }
        $tx['items'] = $items;
        return ['ok' => true, 'transaction' => $tx];
    }

    /**
     * POST /transactions
     * Body: { items: [{ variant_id, quantity }], amount_tendered }
     * Atomic: validates stock + price, inserts header + items, deducts stock,
     * all in a single PDO transaction with row-level locks (SELECT ... FOR UPDATE).
     */
    public function store(Request $req): array
    {
        $body = $req->body();
        $items = $body['items'] ?? [];
        $tendered = isset($body['amount_tendered']) ? (float)$body['amount_tendered'] : -1.0;

        if (!is_array($items) || count($items) === 0) {
            Response::error('invalid_input', 'At least one item is required', 422);
        }
        if (count($items) > 200) {
            Response::error('invalid_input', 'Too many items', 422);
        }
        if ($tendered < 0) {
            Response::error('invalid_input', 'amount_tendered is required', 422);
        }

        // Normalize + dedupe by variant_id (sum quantities)
        $byVariant = [];
        foreach ($items as $it) {
            $vid = (int)($it['variant_id'] ?? 0);
            $qty = (int)($it['quantity']   ?? 0);
            if ($vid <= 0 || $qty <= 0) {
                Response::error('invalid_input', 'Each item needs a positive variant_id and quantity', 422);
            }
            $byVariant[$vid] = ($byVariant[$vid] ?? 0) + $qty;
        }

        $pdo = Database::pdo();
        $callerId = (int)($req->user['sub'] ?? 0);

        $pdo->beginTransaction();
        try {
            // Lock the involved variant rows
            $ids = array_keys($byVariant);
            $place = implode(',', array_fill(0, count($ids), '?'));
            $sel = $pdo->prepare(
                "SELECT pv.id, pv.product_id, pv.size, pv.price, pv.stock_quantity,
                        p.name AS product_name, p.is_available
                 FROM product_variants pv
                 JOIN products p ON p.id = pv.product_id
                 WHERE pv.id IN ($place)
                 FOR UPDATE"
            );
            $sel->execute($ids);
            $variants = $sel->fetchAll();
            $found = [];
            foreach ($variants as $v) $found[(int)$v['id']] = $v;

            // Validate every requested variant
            $total = 0.0;
            $lines = []; // [{ variant_id, quantity, price }]
            foreach ($byVariant as $vid => $qty) {
                if (!isset($found[$vid])) {
                    $pdo->rollBack();
                    Response::error('variant_not_found', "Variant $vid not found", 422);
                }
                $v = $found[$vid];
                if ((int)$v['is_available'] !== 1) {
                    $pdo->rollBack();
                    Response::error('product_unavailable', "{$v['product_name']} is not available", 409);
                }
                if ((int)$v['stock_quantity'] < $qty) {
                    $pdo->rollBack();
                    Response::error('insufficient_stock',
                        "Not enough stock for {$v['product_name']} ({$v['size']}). Available: {$v['stock_quantity']}, requested: $qty",
                        409,
                        ['variant_id' => $vid, 'available' => (int)$v['stock_quantity']]
                    );
                }
                $price = (float)$v['price'];
                $total += $price * $qty;
                $lines[] = ['variant_id' => $vid, 'quantity' => $qty, 'price' => $price];
            }

            // Round to 2dp to match DECIMAL(10,2)
            $total = round($total, 2);
            $tendered = round($tendered, 2);

            if ($tendered + 0.0001 < $total) {
                $pdo->rollBack();
                Response::error('insufficient_payment',
                    'Amount tendered is less than the total', 422,
                    ['total' => $total, 'tendered' => $tendered]
                );
            }
            $change = round($tendered - $total, 2);

            // Insert header
            $insTx = $pdo->prepare(
                'INSERT INTO transactions (cashier_user_id, total_amount, amount_tendered, change_given)
                 VALUES (?, ?, ?, ?)'
            );
            $insTx->execute([$callerId, $total, $tendered, $change]);
            $txId = (int)$pdo->lastInsertId();

            // Insert items + deduct stock
            $insItem = $pdo->prepare(
                'INSERT INTO transaction_items (transaction_id, product_variant_id, quantity, unit_price_at_sale)
                 VALUES (?, ?, ?, ?)'
            );
            $deduct = $pdo->prepare(
                'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?'
            );
            foreach ($lines as $ln) {
                $insItem->execute([$txId, $ln['variant_id'], $ln['quantity'], $ln['price']]);
                $deduct->execute([$ln['quantity'], $ln['variant_id']]);
            }

            $pdo->commit();

            // Re-read full transaction with items
            return $this->show(self::syntheticRequest($req, $txId));
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }

    // ----- helpers -----

    private function fetchTx(int $id): ?array
    {
        $stmt = Database::pdo()->prepare(
            'SELECT t.id, t.cashier_user_id, t.total_amount, t.amount_tendered,
                    t.change_given, t.created_at, u.name AS cashier_name
             FROM transactions t
             JOIN users u ON u.id = t.cashier_user_id
             WHERE t.id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) return null;
        $row['total_amount']    = (float)$row['total_amount'];
        $row['amount_tendered'] = (float)$row['amount_tendered'];
        $row['change_given']    = (float)$row['change_given'];
        return $row;
    }

    /** Build a Request that show() can use to return the just-created tx. */
    private static function syntheticRequest(Request $original, int $txId): Request
    {
        $r = new Request();
        $r->user = $original->user;
        $r->params = ['id' => (string)$txId];
        return $r;
    }
}
