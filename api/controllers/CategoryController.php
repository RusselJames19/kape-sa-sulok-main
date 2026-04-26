<?php
declare(strict_types=1);

class CategoryController
{
    public function index(Request $req): array      { return ['ok' => true, 'todo' => 'Phase 2: list categories']; }
    public function store(Request $req): array      { return ['ok' => true, 'todo' => 'Phase 2: create category']; }
    public function update(Request $req): array     { return ['ok' => true, 'todo' => 'Phase 2: rename']; }
    public function deactivate(Request $req): array { return ['ok' => true, 'todo' => 'Phase 2: soft-disable']; }
}
