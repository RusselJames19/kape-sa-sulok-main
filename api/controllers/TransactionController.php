<?php
declare(strict_types=1);

class TransactionController
{
    public function index(Request $req): array { return ['ok' => true, 'todo' => 'Phase 3: list transactions']; }
    public function show(Request $req): array  { return ['ok' => true, 'id' => $req->params['id'] ?? null]; }
    public function store(Request $req): array { return ['ok' => true, 'todo' => 'Phase 3: atomic insert + items + stock deduct']; }
}
