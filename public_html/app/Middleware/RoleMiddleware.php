<?php
namespace App\Middleware;

class RoleMiddleware
{
    private $container;
    private $requiredRole;

    public function __construct($container, $requiredRole = null)
    {
        $this->container = $container;
        $this->requiredRole = $requiredRole;
    }

    public function handle()
    {
        $auth = $this->container['auth'];
        if (!$auth->check()) {
            redirect('/login');
            return false;
        }
        if ($this->requiredRole && !$auth->hasRole($this->requiredRole)) {
            http_response_code(403);
            echo "Доступ запрещён. Требуется роль: " . $this->requiredRole;
            return false;
        }
        return true;
    }
}