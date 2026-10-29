<?php
/**
 * bootstrap/app.php — минимальная версия для работы редактора
 */

// ===== АВТОЗАГРУЗКА КЛАССОВ =====
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

// ===== ЗАГРУЗКА ХЕЛПЕРОВ =====
require_once __DIR__ . '/../app/Helpers/functions.php';

// ===== КОНФИГУРАЦИЯ =====
// Используем прямое подключение к БД (без .env)
$config = [
    'database' => [
        'host' => 'localhost',
        'name' => 's92932h2_shop',
        'user' => 's92932h2_shop',
        'pass' => 'fvzOvzl3Cv8%',
        'charset' => 'utf8mb4'
    ],
    'app' => [
        'name' => 'DNA Editor Pro',
        'env' => 'production',
        'debug' => true,
    ]
];

// ===== КОНТЕЙНЕР =====
$container = [];

$container['config'] = $config;

$container['db'] = function() use ($config) {
    return new \App\Models\Database($config['database']);
};

// Проверяем, существует ли класс AuthService
if (class_exists('App\Services\AuthService')) {
    $container['auth'] = new \App\Services\AuthService();
} else {
    // Создаём минимальную заглушку для AuthService
    $container['auth'] = new class() {
        public function isLoggedIn() {
            return isset($_SESSION['user_id']) && $_SESSION['logged_in'] === true;
        }
        public function check() {
            return $this->isLoggedIn();
        }
        public function attempt($username, $password) {
            // Заглушка — всегда false
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
            return true; // Заглушка
        }
        public function login($user) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'] ?? 'user';
            $_SESSION['logged_in'] = true;
            session_regenerate_id(true);
            return true;
        }
    };
}

$container['logger'] = new \App\Services\Logger();
$container['validator'] = new \App\Core\Validator();

return $container;