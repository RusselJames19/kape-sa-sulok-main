<?php
declare(strict_types=1);

class VariantController
{
    public function store(Request $req): array       { return ['ok' => true, 'todo' => 'Phase 2: create variant']; }
    public function update(Request $req): array      { return ['ok' => true, 'todo' => 'Phase 2: update variant']; }
    public function destroy(Request $req): array     { return ['ok' => true, 'todo' => 'Phase 2: delete variant']; }
}
