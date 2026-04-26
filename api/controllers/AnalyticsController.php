<?php
declare(strict_types=1);

class AnalyticsController
{
    public function summary(Request $req): array     { return ['ok' => true, 'todo' => 'Phase 5: today totals + top product + low-stock count']; }
    public function sales(Request $req): array       { return ['ok' => true, 'todo' => 'Phase 5: time-series with date range']; }
    public function topProducts(Request $req): array { return ['ok' => true, 'todo' => 'Phase 5: top by qty / revenue']; }
    public function peakHours(Request $req): array   { return ['ok' => true, 'todo' => 'Phase 5: hour x weekday heatmap']; }
}
