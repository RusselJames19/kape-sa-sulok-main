<?php
// Authentication + role-guard middleware factories.
declare(strict_types=1);

class Auth
{
    /** Require any authenticated user. Sets $req->user. */
    public static function requireAuth(): callable
    {
        return function (Request $req): void {
            $token = $req->bearerToken();
            if (!$token) Response::unauthorized('Missing bearer token');
            try {
                $payload = JWT::decode($token);
            } catch (Throwable $e) {
                Response::unauthorized('Invalid token: ' . $e->getMessage());
            }
            $req->user = $payload;
        };
    }

    /** Require any of the given roles. */
    public static function requireRole(string ...$roles): callable
    {
        $auth = self::requireAuth();
        return function (Request $req) use ($auth, $roles): void {
            $auth($req);
            $role = $req->user['role'] ?? null;
            if (!$role || !in_array($role, $roles, true)) {
                Response::forbidden('Role not permitted: ' . ($role ?? 'none'));
            }
        };
    }
}
