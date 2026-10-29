<?php
session_start();

// Подключаем БД
require_once __DIR__ . '/views/editor/core/config.php';
require_once __DIR__ . '/views/editor/core/functions.php';

// Если уже авторизован — перенаправляем на дашборд
if (isset($_SESSION['user_id']) && $_SESSION['logged_in'] === true) {
    header('Location: /dashboard.php');
    exit;
}

// Генерация CSRF-токена
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['register'])) {
    $csrf = $_POST['csrf_token'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'], $csrf)) {
        $error = 'Неверный CSRF токен. Обновите страницу.';
    } else {
        $username = trim($_POST['username'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $password_confirm = $_POST['password_confirm'] ?? '';
        
        // Валидация
        if (empty($username)) {
            $error = 'Введите имя пользователя';
        } elseif (strlen($username) < 3) {
            $error = 'Имя пользователя должно содержать не менее 3 символов';
        } elseif (strlen($username) > 50) {
            $error = 'Имя пользователя не должно превышать 50 символов';
        } elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
            $error = 'Имя пользователя может содержать только латинские буквы, цифры и знак подчёркивания';
        } elseif (empty($email)) {
            $error = 'Введите email';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = 'Введите корректный email';
        } elseif (empty($password)) {
            $error = 'Введите пароль';
        } elseif (strlen($password) < 6) {
            $error = 'Пароль должен содержать не менее 6 символов';
        } elseif ($password !== $password_confirm) {
            $error = 'Пароли не совпадают';
        } else {
            $db = getDB();
            
            // Проверка на существование пользователя
            $stmt = $db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
            $stmt->execute([$username, $email]);
            if ($stmt->fetch()) {
                $error = 'Пользователь с таким логином или email уже существует';
            } else {
                // Создаём пользователя
                $password_hash = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $db->prepare("INSERT INTO users (username, email, password_hash, role, is_active, created_at) 
                                      VALUES (?, ?, ?, 'editor', 1, NOW())");
                $stmt->execute([$username, $email, $password_hash]);
                $userId = $db->lastInsertId();
                
                // Создаём дефолтный проект
                $slug = 'my-pages-' . $userId;
                $stmt = $db->prepare("INSERT INTO projects (user_id, name, slug, created_at) VALUES (?, 'Мои страницы', ?, NOW())");
                $stmt->execute([$userId, $slug]);
                $projectId = $db->lastInsertId();
                
                // Создаём демо-страницу для нового пользователя
                $default_data = json_encode([
                    'blocks' => [
                        ['id' => 'demo1', 'type' => 'hero', 
                         'content' => ['title' => 'Добро пожаловать!', 'subtitle' => 'Создайте свою первую страницу', 'button_text' => 'Начать', 'button_link' => '#'], 
                         'styles' => ['padding' => '60px', 'bg_color' => '#1a1a2e', 'alignment' => 'center']]
                    ],
                    'global' => ['font_family' => 'Inter, sans-serif', 'accent_color' => '#8b5cf6', 
                                 'body_bg' => '#0f0f1a', 'container_width' => '1280px'],
                    'templates' => []
                ]);
                
                $stmt = $db->prepare("INSERT INTO pages (project_id, title, slug, is_active, sort_order, created_at) 
                                      VALUES (?, 'Главная', 'home', 1, 1, NOW())");
                $stmt->execute([$projectId]);
                $pageId = $db->lastInsertId();
                
                $stmt = $db->prepare("INSERT INTO page_layout (page_id, data, created_at) VALUES (?, ?, NOW())");
                $stmt->execute([$pageId, $default_data]);
                
                // Автоматически логиним пользователя
                $_SESSION['user_id'] = $userId;
                $_SESSION['username'] = $username;
                $_SESSION['role'] = 'editor';
                $_SESSION['logged_in'] = true;
                session_regenerate_id(true);
                
                $success = true;
                header('Location: /dashboard.php');
                exit;
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DNA Editor Pro — Регистрация</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
        .register-container{max-width:450px;width:100%;}
        .logo{text-align:center;margin-bottom:32px;}
        .logo h1{font-size:2rem;background:linear-gradient(135deg,#8b5cf6,#c084fc);-webkit-background-clip:text;background-clip:text;color:transparent;}
        .card{background:rgba(30,30,46,0.9);backdrop-filter:blur(10px);border-radius:32px;padding:40px;border:1px solid rgba(139,92,246,0.3);}
        .card h2{color:#e2e8f0;margin-bottom:8px;font-size:1.8rem;}
        .card p{color:#94a3b8;margin-bottom:32px;}
        .form-group{margin-bottom:24px;}
        .form-group label{display:block;margin-bottom:8px;color:#cbd5e1;font-size:0.85rem;}
        .form-group input{width:100%;padding:14px 16px;background:#1e1e2e;border:1px solid #2a2a3e;border-radius:16px;font-size:1rem;color:#e2e8f0;}
        .form-group input:focus{outline:none;border-color:#8b5cf6;}
        .btn-register{width:100%;padding:14px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);border:none;border-radius:16px;font-size:1rem;font-weight:600;color:white;cursor:pointer;transition:0.2s;}
        .btn-register:hover{transform:translateY(-2px);}
        .error{background:rgba(239,68,68,0.2);border:1px solid #ef4444;border-radius:16px;padding:12px;margin-bottom:24px;color:#f87171;text-align:center;}
        .footer{text-align:center;margin-top:24px;color:#64748b;font-size:0.8rem;}
        .login-link{color:#8b5cf6;text-decoration:none;}
        .login-link:hover{text-decoration:underline;}
    </style>
</head>
<body>
<div class="register-container">
    <div class="logo"><h1><i class="fas fa-dna"></i> DNA Editor Pro</h1></div>
    <div class="card">
        <h2>Создать аккаунт</h2>
        <p>Зарегистрируйтесь, чтобы начать создавать сайты</p>
        <?php if (!empty($error)): ?>
            <div class="error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>
        <form method="POST" action="">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token']) ?>">
            <div class="form-group">
                <label><i class="fas fa-user"></i> Имя пользователя</label>
                <input type="text" name="username" value="<?= htmlspecialchars($_POST['username'] ?? '') ?>" placeholder="например: john_doe" required autofocus>
                <small style="color:#64748b; font-size:0.7rem;">Только латинские буквы, цифры и _</small>
            </div>
            <div class="form-group">
                <label><i class="fas fa-envelope"></i> Email</label>
                <input type="email" name="email" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" placeholder="ваш@email.ru" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-lock"></i> Пароль</label>
                <input type="password" name="password" placeholder="минимум 6 символов" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-lock"></i> Повторите пароль</label>
                <input type="password" name="password_confirm" placeholder="повторите пароль" required>
            </div>
            <button type="submit" name="register" class="btn-register">Зарегистрироваться</button>
        </form>
        <div class="footer">
            Уже есть аккаунт? <a href="/index.php" class="login-link">Войти</a>
        </div>
    </div>
    <div class="footer">
        <i class="fas fa-dna"></i> DNA Editor Pro — профессиональный конструктор страниц
    </div>
</div>
</body>
</html>