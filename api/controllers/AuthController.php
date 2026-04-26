<?php
declare(strict_types=1);

class AuthController
{
    public function login(Request $req): array    { return ['ok' => true, 'todo' => 'Phase 2: validate credentials, issue JWT']; }
    public function refresh(Request $req): array  { return ['ok' => true, 'todo' => 'Phase 2: rotate refresh token, issue new access JWT']; }
    public function logout(Request $req): array   { return ['ok' => true, 'todo' => 'Phase 2: revoke refresh token']; }
    public function me(Request $req): array       { return ['ok' => true, 'user' => $req->user, 'todo' => 'Phase 2: hydrate from DB']; }
}
