<?php
namespace App\Core;

class Router
{
    private array $routes = [];
    private array $middlewares = [];
    private $container;

    public function __construct($container)
    {
        $this->container = $container;
    }

    public function add($method, $uri, $action, $middlewares = [])
    {
        $this->routes[] = [
            'method' => strtoupper($method),
            'uri' => $uri,
            'action' => $action,
            'middlewares' => $middlewares
        ];
    }

    public function get($uri, $action, $middlewares = [])
    {
        $this->add('GET', $uri, $action, $middlewares);
    }

    public function post($uri, $action, $middlewares = [])
    {
        $this->add('POST', $uri, $action, $middlewares);
    }

    public function dispatch($method, $uri)
    {
        $uri = parse_url($uri, PHP_URL_PATH);
        foreach ($this->routes as $route) {
            if ($route['method'] === $method && $this->matchUri($route['uri'], $uri, $params)) {
                // Выполнить middleware
                foreach ($route['middlewares'] as $middlewareClass) {
                    $middleware = new $middlewareClass($this->container);
                    if (!$middleware->handle()) {
                        return;
                    }
                }
                // Вызвать action
                if (is_callable($route['action'])) {
                    call_user_func_array($route['action'], $params);
                } elseif (is_string($route['action'])) {
                    $parts = explode('@', $route['action']);
                    $controllerClass = "App\\Controllers\\{$parts[0]}";
                    $method = $parts[1];
                    $controller = new $controllerClass($this->container);
                    call_user_func_array([$controller, $method], $params);
                }
                return;
            }
        }
        http_response_code(404);
        echo "404 Not Found";
    }

    private function matchUri($routeUri, $requestUri, &$params)
    {
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $routeUri);
        $pattern = '#^' . $pattern . '$#';
        if (preg_match($pattern, $requestUri, $matches)) {
            $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
            return true;
        }
        return false;
    }
}