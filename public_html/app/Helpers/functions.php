<?php
function dd(...$vars) {
    foreach ($vars as $var) {
        var_dump($var);
    }
    die();
}

function env($key, $default = null) {
    $value = getenv($key);
    if ($value === false) {
        return $default;
    }
    return $value;
}

function redirect($url) {
    header("Location: $url");
    exit;
}

function csrf_field() {
    $token = $_SESSION[env('CSRF_TOKEN_NAME')] ?? '';
    return '<input type="hidden" name="' . env('CSRF_TOKEN_NAME') . '" value="' . htmlspecialchars($token) . '">';
}

function csrf_token() {
    return $_SESSION[env('CSRF_TOKEN_NAME')] ?? '';
}

function old($key, $default = '') {
    return $_SESSION['_old'][$key] ?? $default;
}

function view($view, $data = []) {
    extract($data);
    $viewFile = __DIR__ . "/../../views/$view.php";
    if (file_exists($viewFile)) {
        require $viewFile;
    } else {
        throw new Exception("View $view not found");
    }
}