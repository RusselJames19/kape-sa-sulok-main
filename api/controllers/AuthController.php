<?php
declare(strict_types=1);

class AuthController
{
    /** POST /auth/login   { username, password } */
    public function login(Request $req): array
    {
        $body = $req->body();
        $username = trim((string)($body['username'] ?? ''));
        $password = (string)($body['password'] ?? '');
        $ip = $req->clientIp();

        if ($username === '' || $password === '') {
            Response::error('invalid_input', 'Username and password are required', 422);
        }

        if (RateLimiter::isLocked($username, $ip)) {
            Response::error('rate_limited', 'Too many failed attempts. Try again later.', 429);
        }

        $stmt = Database::pdo()->prepare(
            'SELECT id, name, username, password_hash, role, is_active
             FROM users WHERE username = ? LIMIT 1'
        );
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            RateLimiter::record($username, $ip, false);
            Response::error('invalid_credentials', 'Invalid username or password', 401);
        }

        if ((int)$user['is_active'] !== 1) {
            RateLimiter::record($username, $ip, false);
            Response::error('account_disabled', 'Account is deactivated', 403);
        }

        RateLimiter::record($username, $ip, true);

        // Update last_login
        $u = Database::pdo()->prepare('UPDATE users SET last_login = NOW() WHERE id = ?');
        $u->execute([(int)$user['id']]);

        return $this->issueTokens((int)$user['id'], $user['username'], $user['role'], $user['name']);
    }

    /** POST /auth/refresh   { refreshToken } */
    public function refresh(Request $req): array
    {
        $body = $req->body();
        $refresh = (string)($body['refreshToken'] ?? '');
        if ($refresh === '') {
            Response::error('invalid_input', 'refreshToken is required', 422);
        }

        $hash = hash('sha256', $refresh);
        $pdo = Database::pdo();

        $stmt = $pdo->prepare(
            'SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at,
                    u.username, u.role, u.name, u.is_active
             FROM refresh_tokens rt
             JOIN users u ON u.id = rt.user_id
             WHERE rt.token_hash = ? LIMIT 1'
        );
        $stmt->execute([$hash]);
        $row = $stmt->fetch();

        if (!$row || $row['revoked_at'] !== null || strtotime($row['expires_at']) < time()) {
            Response::error('invalid_refresh', 'Refresh token invalid or expired', 401);
        }
        if ((int)$row['is_active'] !== 1) {
            Response::error('account_disabled', 'Account is deactivated', 403);
        }

        // Rotate: revoke old, issue new pair
        $rev = $pdo->prepare('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?');
        $rev->execute([(int)$row['id']]);

        return $this->issueTokens((int)$row['user_id'], $row['username'], $row['role'], $row['name']);
    }

    /** POST /auth/logout — requires auth, revokes provided refresh token. */
    public function logout(Request $req): array
    {
        $body = $req->body();
        $refresh = (string)($body['refreshToken'] ?? '');
        if ($refresh !== '') {
            $hash = hash('sha256', $refresh);
            $stmt = Database::pdo()->prepare(
                'UPDATE refresh_tokens SET revoked_at = NOW()
                 WHERE token_hash = ? AND revoked_at IS NULL'
            );
            $stmt->execute([$hash]);
        }
        return ['ok' => true];
    }

    /** GET /auth/me — hydrate full profile from DB. */
    public function me(Request $req): array
    {
        $uid = (int)($req->user['sub'] ?? 0);
        $stmt = Database::pdo()->prepare(
            'SELECT id, name, username, role, is_active, last_login, created_at
             FROM users WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$uid]);
        $user = $stmt->fetch();
        if (!$user) Response::unauthorized('User not found');
        if ((int)$user['is_active'] !== 1) Response::forbidden('Account is deactivated');

        return ['ok' => true, 'user' => $user];
    }

    // ----- helpers -----

    private function issueTokens(int $userId, string $username, string $role, string $name): array
    {
        $cfg = require __DIR__ . '/../config/jwt.php';
        $now = time();

        $access = JWT::encode([
            'sub'      => $userId,
            'username' => $username,
            'role'     => $role,
            'name'     => $name,
            'iat'      => $now,
            'exp'      => $now + (int)$cfg['access_ttl_seconds'],
        ]);

        // Refresh token: random opaque string; store sha256 hash only.
        $refresh = bin2hex(random_bytes(32));
        $refreshHash = hash('sha256', $refresh);
        $expiresAt = date('Y-m-d H:i:s', $now + (int)$cfg['refresh_ttl_seconds']);

        $ins = Database::pdo()->prepare(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
             VALUES (?, ?, ?)'
        );
        $ins->execute([$userId, $refreshHash, $expiresAt]);

        return [
            'ok'           => true,
            'accessToken'  => $access,
            'refreshToken' => $refresh,
            'expiresIn'    => (int)$cfg['access_ttl_seconds'],
            'user'         => [
                'id'       => $userId,
                'name'     => $name,
                'username' => $username,
                'role'     => $role,
            ],
        ];
    }
}
