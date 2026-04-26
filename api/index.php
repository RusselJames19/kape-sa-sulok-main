<?php
// Single entry point for the Kape sa Sulok REST API.
// All requests are dispatched through the Router.

declare(strict_types=1);

// ---------------- CORS ----------------
$cors = require __DIR__ . '/config/cors.php';
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = $cors['allowed_origins'] ?? [];
$maxAge  = (int)($cors['max_age'] ?? 600);

if (in_array('*', $allowed, true)) {
    header('Access-Control-Allow-Origin: *');
} elseif ($origin !== '' && in_array($origin, $allowed, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With');
header('Access-Control-Max-Age: ' . $maxAge);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Frame-Options: DENY');

// Autoload (simple, no Composer required)
spl_autoload_register(function (string $class): void {
    $paths = [
        __DIR__ . '/core/'        . $class . '.php',
        __DIR__ . '/controllers/' . $class . '.php',
    ];
    foreach ($paths as $p) {
        if (is_file($p)) { require_once $p; return; }
    }
});

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/jwt.php';
require_once __DIR__ . '/routes.php';

try {
    $router = registerRoutes(new Router());
    $router->dispatch(
        $_SERVER['REQUEST_METHOD'] ?? 'GET',
        parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/'
    );
} catch (Throwable $e) {
    http_response_code(500);
    // Don't leak internals — only the message in dev. In production swap for a generic line.
    echo json_encode([
        'error'   => 'server_error',
        'message' => $e->getMessage(),
    ]);
}
