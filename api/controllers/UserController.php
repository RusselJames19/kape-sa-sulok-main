<?php
declare(strict_types=1);

class UserController
{
    public function index(Request $req): array               { return ['ok' => true, 'todo' => 'Phase 2: list users']; }
    public function store(Request $req): array               { return ['ok' => true, 'todo' => 'Phase 2: create user (admin)']; }
    public function show(Request $req): array                { return ['ok' => true, 'id' => $req->params['id'] ?? null, 'todo' => 'Phase 2']; }
    public function update(Request $req): array              { return ['ok' => true, 'todo' => 'Phase 2: update name/role']; }
    public function resetPassword(Request $req): array       { return ['ok' => true, 'todo' => 'Phase 2: bcrypt new password']; }
    public function activate(Request $req): array            { return ['ok' => true, 'todo' => 'Phase 2: set is_active = 1']; }
    public function deactivate(Request $req): array          { return ['ok' => true, 'todo' => 'Phase 2: set is_active = 0']; }
}
