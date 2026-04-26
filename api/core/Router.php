<?php
declare(strict_types=1);

class Router
{
    /** @var array<int, array{method:string, pattern:string, regex:string, params:array, handler:callable, middleware:array}> */
    private array $routes = [];

    public function get(string $path, callable $handler, array $middleware = []): void    { $this->add('GET', $path, $handler, $middleware); }
    public function post(string $path, callable $handler, array $middleware = []): void   { $this->add('POST', $path, $handler, $middleware); }
    public function put(string $path, callable $handler, array $middleware = []): void    { $this->add('PUT', $path, $handler, $middleware); }
    public function delete(string $path, callable $handler, array $middleware = []): void { $this->add('DELETE', $path, $handler, $middleware); }

    private function add(string $method, string $path, callable $handler, array $middleware): void
    {
        $params = [];
        $regex = preg_replace_callback('#\{([a-zA-Z_]+)\}#', function ($m) use (&$params) {
            $params[] = $m[1];
            return '([^/]+)';
        }, $path);

        $this->routes[] = [
            'method'     => $method,
            'pattern'    => $path,
            'regex'      => '#^' . $regex . '/?$#',
            'params'     => $params,
            'handler'    => $handler,
            'middleware' => $middleware,
        ];
    }

    public function dispatch(string $method, string $uri): void
    {
        // Strip /api prefix if present (so route paths can be declared without it)
        if (strpos($uri, '/api') === 0) {
            $uri = substr($uri, 4);
        }
        if ($uri === '' || $uri === false) $uri = '/';

        $method = strtoupper($method);

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) continue;
            if (!preg_match($route['regex'], $uri, $matches)) continue;

            $req = new Request();
            array_shift($matches);
            foreach ($route['params'] as $i => $name) {
                $req->params[$name] = $matches[$i] ?? null;
            }

            // Run middleware (each may halt with Response::*)
            foreach ($route['middleware'] as $mw) {
                $mw($req);
            }

            // Execute handler
            $result = ($route['handler'])($req);
            if ($result !== null) {
                Response::json($result);
            }
            return;
        }

        Response::notFound('Route not found: ' . $method . ' ' . $uri);
    }
}
