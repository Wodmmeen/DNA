<?php
namespace App\Services;

class AuthService
{
    public function isLoggedIn() {
        return isset($_SESSION['user_id']) && $_SESSION['logged_in'] === true;
    }

    public function check() {
        return $this->isLoggedIn();
    }

    public function attempt($username, $password) {
        // Реализация через БД
        return false;
    }

    public function logout() {
        $_SESSION = [];
        session_destroy();
    }

    public function getUser() {
        if (!$this->isLoggedIn()) return null;
        return [
            'id' => $_SESSION['user_id'] ?? null,
            'name' => $_SESSION['username'] ?? null,
            'role' => $_SESSION['role'] ?? 'user'
        ];
    }

    public function hasRole($role) {
        $user = $this->getUser();
        return $user && $user['role'] === $role;
    }

    public function can($permission) {
        return true;
    }

    public function login($user) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'] ?? 'user';
        $_SESSION['logged_in'] = true;
        session_regenerate_id(true);
        return true;
    }
}