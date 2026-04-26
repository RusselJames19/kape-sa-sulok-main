<?php
declare(strict_types=1);

class UserController
{
    private const ROLES = ['admin', 'owner', 'manager', 'cashier'];

    /** GET /users */
    public function index(Request $req): array
    {
        $stmt = Database::pdo()->query(
            'SELECT id, name, username, role, is_active, last_login, created_at
             FROM users ORDER BY created_at DESC'
        );
        return ['ok' => true, 'users' => $stmt->fetchAll()];
    }

    /** POST /users   { name, username, password, role } */
    public function store(Request $req): array
    {
        $b = $req->body();
        $name     = trim((string)($b['name'] ?? ''));
        $username = trim((string)($b['username'] ?? ''));
        $password = (string)($b['password'] ?? '');
        $role     = (string)($b['role'] ?? '');

        if ($name === '' || $username === '' || $password === '' || $role === '') {
            Response::error('invalid_input', 'name, username, password, role are required', 422);
        }
        if (!in_array($role, self::ROLES, true)) {
            Response::error('invalid_role', 'Invalid role', 422);
        }
        if (strlen($password) < 8) {
            Response::error('weak_password', 'Password must be at least 8 characters', 422);
        }
        if (!preg_match('/^[A-Za-z0-9_.-]{3,50}$/', $username)) {
            Response::error('invalid_username', 'Username must be 3-50 chars (letters, numbers, _.-)', 422);
        }

        $pdo = Database::pdo();
        $check = $pdo->prepare('SELECT 1 FROM users WHERE username = ? LIMIT 1');
        $check->execute([$username]);
        if ($check->fetchColumn()) {
            Response::error('username_taken', 'Username is already in use', 409);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $ins = $pdo->prepare(
            'INSERT INTO users (name, username, password_hash, role, is_active)
             VALUES (?, ?, ?, ?, 1)'
        );
        $ins->execute([$name, $username, $hash, $role]);
        $id = (int)$pdo->lastInsertId();

        return ['ok' => true, 'user' => $this->fetchUser($id)];
    }

    /** GET /users/{id} */
    public function show(Request $req): array
    {
        $id = (int)($req->params['id'] ?? 0);
        $user = $this->fetchUser($id);
        if (!$user) Response::notFound('User not found');
        return ['ok' => true, 'user' => $user];
    }

    /** PUT /users/{id}   { name?, role? } */
    public function update(Request $req): array
    {
        $id = (int)($req->params['id'] ?? 0);
        $existing = $this->fetchUser($id);
        if (!$existing) Response::notFound('User not found');

        $b = $req->body();
        $sets = [];
        $vals = [];

        if (array_key_exists('name', $b)) {
            $name = trim((string)$b['name']);
            if ($name === '') Response::error('invalid_input', 'Name cannot be empty', 422);
            $sets[] = 'name = ?'; $vals[] = $name;
        }
        if (array_key_exists('role', $b)) {
            $role = (string)$b['role'];
            if (!in_array($role, self::ROLES, true)) {
                Response::error('invalid_role', 'Invalid role', 422);
            }
            // Prevent demoting the last active admin
            if ($existing['role'] === 'admin' && $role !== 'admin') {
                $this->guardLastAdmin($id);
            }
            $sets[] = 'role = ?'; $vals[] = $role;
        }

        if (!$sets) return ['ok' => true, 'user' => $existing];

        $vals[] = $id;
        $sql = 'UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?';
        $stmt = Database::pdo()->prepare($sql);
        $stmt->execute($vals);

        return ['ok' => true, 'user' => $this->fetchUser($id)];
    }

    /** POST /users/{id}/password   { password } */
    public function resetPassword(Request $req): array
    {
        $id = (int)($req->params['id'] ?? 0);
        $existing = $this->fetchUser($id);
        if (!$existing) Response::notFound('User not found');

        $b = $req->body();
        $pw = (string)($b['password'] ?? '');
        if (strlen($pw) < 8) {
            Response::error('weak_password', 'Password must be at least 8 characters', 422);
        }

        $hash = password_hash($pw, PASSWORD_BCRYPT);
        $pdo = Database::pdo();
        $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $id]);
        // Revoke all refresh tokens so other sessions are kicked.
        $pdo->prepare('UPDATE refresh_tokens SET revoked_at = NOW()
                       WHERE user_id = ? AND revoked_at IS NULL')->execute([$id]);

        return ['ok' => true];
    }

    /** POST /users/{id}/activate */
    public function activate(Request $req): array
    {
        $id = (int)($req->params['id'] ?? 0);
        if (!$this->fetchUser($id)) Response::notFound('User not found');
        Database::pdo()->prepare('UPDATE users SET is_active = 1 WHERE id = ?')->execute([$id]);
        return ['ok' => true, 'user' => $this->fetchUser($id)];
    }

    /** POST /users/{id}/deactivate */
    public function deactivate(Request $req): array
    {
        $id = (int)($req->params['id'] ?? 0);
        $u = $this->fetchUser($id);
        if (!$u) Response::notFound('User not found');

        // Prevent admin deactivating themselves or the last active admin.
        $callerId = (int)($req->user['sub'] ?? 0);
        if ($callerId === $id) {
            Response::error('self_deactivate', 'You cannot deactivate your own account', 409);
        }
        if ($u['role'] === 'admin') {
            $this->guardLastAdmin($id);
        }

        $pdo = Database::pdo();
        $pdo->prepare('UPDATE users SET is_active = 0 WHERE id = ?')->execute([$id]);
        // Kick all sessions for this user.
        $pdo->prepare('UPDATE refresh_tokens SET revoked_at = NOW()
                       WHERE user_id = ? AND revoked_at IS NULL')->execute([$id]);

        return ['ok' => true, 'user' => $this->fetchUser($id)];
    }

    // ----- helpers -----

    private function fetchUser(int $id): ?array
    {
        $stmt = Database::pdo()->prepare(
            'SELECT id, name, username, role, is_active, last_login, created_at
             FROM users WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /** Halts with 409 if removing/demoting this user would leave zero active admins. */
    private function guardLastAdmin(int $excludingId): void
    {
        $stmt = Database::pdo()->prepare(
            "SELECT COUNT(*) FROM users
             WHERE role = 'admin' AND is_active = 1 AND id <> ?"
        );
        $stmt->execute([$excludingId]);
        if ((int)$stmt->fetchColumn() === 0) {
            Response::error('last_admin', 'Cannot remove the last active admin', 409);
        }
    }
}
