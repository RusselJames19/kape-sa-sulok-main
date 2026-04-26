<?php
declare(strict_types=1);

class ProductController
{
    public function index(Request $req): array        { return ['ok' => true, 'todo' => 'Phase 2: list products with variants']; }
    public function show(Request $req): array         { return ['ok' => true, 'id' => $req->params['id'] ?? null]; }
    public function store(Request $req): array        { return ['ok' => true, 'todo' => 'Phase 2: create product']; }
    public function update(Request $req): array       { return ['ok' => true, 'todo' => 'Phase 2: update product']; }
    public function setAvailability(Request $req): array { return ['ok' => true, 'todo' => 'Phase 2: toggle is_available']; }
}
