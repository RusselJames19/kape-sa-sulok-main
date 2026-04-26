<?php
// Simple DB-backed rate limiter for login attempts.
declare(strict_types=1);

class RateLimiter
{
    /**
     * Returns true if the (username, ip) pair is currently locked out.
     * Default: 5 failed attempts within 15 minutes.
     */
    public static function isLocked(string $username, string $ip, int $maxAttempts = 5, int $windowSeconds = 900): bool
    {
        $stmt = Database::pdo()->prepare(
            'SELECT COUNT(*) AS n FROM login_attempts
             WHERE username = ? AND ip_address = ?
               AND success = 0
               AND attempted_at >= (NOW() - INTERVAL ? SECOND)'
        );
        $stmt->execute([$username, $ip, $windowSeconds]);
        $row = $stmt->fetch();
        return ((int)($row['n'] ?? 0)) >= $maxAttempts;
    }

    public static function record(string $username, string $ip, bool $success): void
    {
        $stmt = Database::pdo()->prepare(
            'INSERT INTO login_attempts (username, ip_address, success) VALUES (?, ?, ?)'
        );
        $stmt->execute([$username, $ip, $success ? 1 : 0]);
    }
}
