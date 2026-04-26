<?php
declare(strict_types=1);

class StockController
{
    public function update(Request $req): array   { return ['ok' => true, 'todo' => 'Phase 2: set or add stock (mode in body)']; }
    public function lowStock(Request $req): array { return ['ok' => true, 'todo' => 'Phase 2: variants below threshold']; }
}
