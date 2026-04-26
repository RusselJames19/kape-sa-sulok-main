<?php
declare(strict_types=1);

class AnalyticsController
{
    /**
     * GET /analytics/summary
     * Today's totals + top product (last 7d) + low-stock count.
     */
    public function summary(Request $req): array
    {
        $pdo = Database::pdo();

        $today = $pdo->query(
            "SELECT
               COUNT(*)                       AS tx_count,
               COALESCE(SUM(total_amount), 0) AS revenue
             FROM transactions
             WHERE DATE(created_at) = CURDATE()"
        )->fetch();

        $itemsToday = $pdo->query(
            "SELECT COALESCE(SUM(ti.quantity), 0) AS items_sold
             FROM transaction_items ti
             JOIN transactions t ON t.id = ti.transaction_id
             WHERE DATE(t.created_at) = CURDATE()"
        )->fetch();

        $top = $pdo->query(
            "SELECT p.id, p.name, SUM(ti.quantity) AS qty,
                    SUM(ti.quantity * ti.unit_price_at_sale) AS revenue
             FROM transaction_items ti
             JOIN transactions t       ON t.id  = ti.transaction_id
             JOIN product_variants pv  ON pv.id = ti.product_variant_id
             JOIN products p           ON p.id  = pv.product_id
             WHERE t.created_at >= (NOW() - INTERVAL 7 DAY)
             GROUP BY p.id, p.name
             ORDER BY qty DESC
             LIMIT 1"
        )->fetch();

        $lowCount = (int)$pdo->query(
            "SELECT COUNT(*) FROM product_variants
             WHERE stock_quantity <= low_stock_threshold"
        )->fetchColumn();

        return [
            'ok' => true,
            'today' => [
                'tx_count'   => (int)($today['tx_count'] ?? 0),
                'revenue'    => (float)($today['revenue'] ?? 0),
                'items_sold' => (int)($itemsToday['items_sold'] ?? 0),
            ],
            'top_product_7d' => $top ? [
                'id'      => (int)$top['id'],
                'name'    => $top['name'],
                'qty'     => (int)$top['qty'],
                'revenue' => (float)$top['revenue'],
            ] : null,
            'low_stock_count' => $lowCount,
        ];
    }

    /**
     * GET /analytics/sales?from=YYYY-MM-DD&to=YYYY-MM-DD&granularity=day|hour
     * Time-series of revenue + tx_count.
     */
    public function sales(Request $req): array
    {
        [$from, $to, $granularity] = $this->parseRange($req);

        $pdo = Database::pdo();
        if ($granularity === 'hour') {
            $bucket = "DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')";
        } else {
            $bucket = "DATE(created_at)";
            $granularity = 'day';
        }

        $stmt = $pdo->prepare(
            "SELECT $bucket AS bucket,
                    COUNT(*)                       AS tx_count,
                    COALESCE(SUM(total_amount), 0) AS revenue
             FROM transactions
             WHERE created_at >= ? AND created_at < ?
             GROUP BY bucket
             ORDER BY bucket"
        );
        $stmt->execute([$from, $to]);
        $rows = $stmt->fetchAll();

        $series = array_map(function ($r) {
            return [
                'bucket'   => $r['bucket'],
                'tx_count' => (int)$r['tx_count'],
                'revenue'  => (float)$r['revenue'],
            ];
        }, $rows);

        return [
            'ok' => true,
            'from' => $from, 'to' => $to, 'granularity' => $granularity,
            'series' => $series,
        ];
    }

    /**
     * GET /analytics/top-products?from=&to=&by=revenue|qty&limit=
     */
    public function topProducts(Request $req): array
    {
        [$from, $to] = $this->parseRange($req);
        $by = (string)$req->query('by', 'revenue');
        if (!in_array($by, ['revenue', 'qty'], true)) $by = 'revenue';
        $limit = (int)$req->query('limit', '10');
        if ($limit < 1)  $limit = 10;
        if ($limit > 50) $limit = 50;

        $orderBy = $by === 'qty' ? 'qty DESC' : 'revenue DESC';

        $stmt = Database::pdo()->prepare(
            "SELECT p.id, p.name,
                    c.name AS category_name,
                    SUM(ti.quantity)                              AS qty,
                    SUM(ti.quantity * ti.unit_price_at_sale)      AS revenue
             FROM transaction_items ti
             JOIN transactions t      ON t.id  = ti.transaction_id
             JOIN product_variants pv ON pv.id = ti.product_variant_id
             JOIN products p          ON p.id  = pv.product_id
             JOIN categories c        ON c.id  = p.category_id
             WHERE t.created_at >= ? AND t.created_at < ?
             GROUP BY p.id, p.name, c.name
             ORDER BY $orderBy
             LIMIT $limit"
        );
        $stmt->execute([$from, $to]);
        $rows = array_map(function ($r) {
            return [
                'id'            => (int)$r['id'],
                'name'          => $r['name'],
                'category_name' => $r['category_name'],
                'qty'           => (int)$r['qty'],
                'revenue'       => (float)$r['revenue'],
            ];
        }, $stmt->fetchAll());

        return ['ok' => true, 'from' => $from, 'to' => $to, 'by' => $by, 'products' => $rows];
    }

    /**
     * GET /analytics/peak-hours?from=&to=
     * Hour (0-23) × weekday (1=Sun..7=Sat — MySQL DAYOFWEEK) heatmap of tx_count + revenue.
     */
    public function peakHours(Request $req): array
    {
        [$from, $to] = $this->parseRange($req);

        $stmt = Database::pdo()->prepare(
            "SELECT DAYOFWEEK(created_at) AS dow,
                    HOUR(created_at)      AS hour,
                    COUNT(*)              AS tx_count,
                    COALESCE(SUM(total_amount), 0) AS revenue
             FROM transactions
             WHERE created_at >= ? AND created_at < ?
             GROUP BY dow, hour
             ORDER BY dow, hour"
        );
        $stmt->execute([$from, $to]);

        $cells = array_map(function ($r) {
            return [
                'dow'      => (int)$r['dow'],   // 1=Sun .. 7=Sat
                'hour'     => (int)$r['hour'],  // 0..23
                'tx_count' => (int)$r['tx_count'],
                'revenue'  => (float)$r['revenue'],
            ];
        }, $stmt->fetchAll());

        return ['ok' => true, 'from' => $from, 'to' => $to, 'cells' => $cells];
    }

    // ----- helpers -----

    /** Returns [fromDateTime, toDateTime, granularity] (to is exclusive). */
    private function parseRange(Request $req): array
    {
        $from = (string)$req->query('from', '');
        $to   = (string)$req->query('to', '');
        $g    = (string)$req->query('granularity', 'day');

        if (!$this->isValidDate($from)) {
            $from = date('Y-m-d', strtotime('-6 days')); // last 7 days inclusive
        }
        if (!$this->isValidDate($to)) {
            $to = date('Y-m-d');
        }
        // 'to' is inclusive in the URL; convert to exclusive next-day boundary.
        $fromDt = $from . ' 00:00:00';
        $toDt   = date('Y-m-d 00:00:00', strtotime($to . ' +1 day'));

        return [$fromDt, $toDt, $g];
    }

    private function isValidDate(string $s): bool
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $s)) return false;
        $t = strtotime($s);
        return $t !== false;
    }
}
