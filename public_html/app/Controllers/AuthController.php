<?php
namespace App\Controllers;

use App\Core\CSRF;
use App\Core\Validator;

class AuthController
{
    private $container;

    public function __construct($container)
    {
        $this->container = $container;
    }

    public function showLogin()
    {
        CSRF::generate();
        view('auth/login', [
            'error' => $_SESSION['_flash_error'] ?? '',
            'success' => $_SESSION['_flash_success'] ?? '',
            'old' => $_SESSION['_old'] ?? []
        ]);
        $this->clearFlash();
    }

    public function login()
    {
        CSRF::generate();
        $token = $_POST[env('CSRF_TOKEN_NAME')] ?? '';
        if (!CSRF::verify($token)) {
            $_SESSION['_flash_error'] = 'Неверный CSRF токен';
            redirect('/login');
            return;
        }

        $validator = new Validator();
        $data = [
            'username' => $_POST['username'] ?? '',
            'password' => $_POST['password'] ?? ''
        ];

        if (!$validator->validate($data, [
            'username' => 'required',
            'password' => 'required'
        ])) {
            $_SESSION['_flash_error'] = 'Заполните все поля';
            $_SESSION['_old'] = $data;
            redirect('/login');
            return;
        }

        $auth = $this->container['auth'];
        if ($auth->attempt($data['username'], $data['password'])) {
            redirect('/admin');
        } else {
            $_SESSION['_flash_error'] = 'Неверный логин или пароль';
            $_SESSION['_old'] = ['username' => $data['username']];
            redirect('/login');
        }
    }

    public function logout()
    {
        $this->container['auth']->logout();
        redirect('/login');
    }

    private function clearFlash()
    {
        unset($_SESSION['_flash_error']);
        unset($_SESSION['_flash_success']);
        unset($_SESSION['_old']);
    }
}