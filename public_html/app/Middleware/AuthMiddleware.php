<?php
namespace App\Middleware;

class AuthMiddleware
{
    private $container;

    public function __construct($container)
    {
        $this->container = $container;
    }

    public function handle()
    {
        $auth = $this->container['auth'];
        if (!$auth->isLoggedIn()) {
            redirect('/login?redirect=' . urlencode($_SERVER['REQUEST_URI']));
            return false;
        }
        return true;
    }
}