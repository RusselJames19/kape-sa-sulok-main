<?php
declare(strict_types=1);

class Response
{
    public static function json($data, int $status = 200): void
    {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $code, string $message, int $status = 400, array $extra = []): void
    {
        self::json(array_merge(['error' => $code, 'message' => $message], $extra), $status);
    }

    public static function notFound(string $message = 'Not found'): void
    {
        self::error('not_found', $message, 404);
    }

    public static function unauthorized(string $message = 'Unauthorized'): void
    {
        self::error('unauthorized', $message, 401);
    }

    public static function forbidden(string $message = 'Forbidden'): void
    {
        self::error('forbidden', $message, 403);
    }
}
