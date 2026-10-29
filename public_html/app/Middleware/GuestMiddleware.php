<?php
namespace App\Middleware;

class GuestMiddleware
{
    private $container;

    public function __construct($container)
    {
        $this->container = $container;
    }

    public function handle()
    {
        $auth = $this->container['auth'];
        if ($auth->isLoggedIn()) {
            redirect('/admin');
            return false;
        }
        return true;
    }
}