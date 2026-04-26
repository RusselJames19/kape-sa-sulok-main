<?php
declare(strict_types=1);

class Request
{
    /** Route params injected by Router (e.g. {id}). */
    public array $params = [];

    /** Authenticated user payload set by Auth middleware. */
    public ?array $user = null;

    public function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public function path(): string
    {
        return parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
    }

    public function query(string $key, $default = null)
    {
        return $_GET[$key] ?? $default;
    }

    public function body(): array
    {
        $raw = file_get_contents('php://input') ?: '';
        if ($raw === '') return [];
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    public function header(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        if (isset($_SERVER[$key])) return $_SERVER[$key];
        if ($name === 'Authorization' && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        }
        return null;
    }

    public function bearerToken(): ?string
    {
        $h = $this->header('Authorization');
        if (!$h) return null;
        if (stripos($h, 'Bearer ') === 0) {
            return trim(substr($h, 7));
        }
        return null;
    }

    public function clientIp(): string
    {
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}
