<?php
session_start();

// Настройки БД (твои)
$host = 'localhost';
$dbname = 's92932h2_shop';
$user = 's92932h2_shop';
$pass = 'fvzOvzl3Cv8%';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die('Ошибка подключения к БД: ' . $e->getMessage());
}

// Если уже авторизован — на дашборд
if (isset($_SESSION['user_id']) && isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    header('Location: /dashboard.php');
    exit;
}

// CSRF-токен
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $csrf = $_POST['csrf_token'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'], $csrf)) {
        $error = 'Неверный CSRF-токен. Обновите страницу.';
    } else {
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        if ($username === '' || $password === '') {
            $error = 'Заполните все поля.';
        } else {
            // Ищем пользователя по логину или email
            $stmt = $pdo->prepare("SELECT id, username, email, password_hash, role FROM users WHERE username = ? OR email = ?");
            $stmt->execute([$username, $username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user && password_verify($password, $user['password_hash'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['role'] = $user['role'];
                $_SESSION['logged_in'] = true;
                session_regenerate_id(true);
                header('Location: /dashboard.php');
                exit;
            } else {
                $error = 'Неверный логин или пароль.';
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
    <title>DNA Editor Pro — Вход</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%);min-height:100vh;}
        .container{max-width:1280px;margin:0 auto;padding:40px 20px;}
        .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:60px;flex-wrap:wrap;gap:20px;}
        .logo h1{font-size:1.8rem;background:linear-gradient(135deg,#8b5cf6,#c084fc);-webkit-background-clip:text;background-clip:text;color:transparent;}
        .logo span{font-size:0.8rem;color:#94a3b8;}
        .two-columns{display:flex;flex-wrap:wrap;gap:40px;align-items:center;}
        .features-col{flex:1.2;min-width:280px;}
        .login-col{flex:0.8;min-width:320px;}
        .features-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px;}
        .feature-card{background:rgba(30,30,46,0.5);backdrop-filter:blur(8px);border-radius:24px;padding:24px;border:1px solid rgba(139,92,246,0.2);transition:0.2s;}
        .feature-card:hover{transform:translateY(-4px);border-color:#8b5cf6;background:rgba(30,30,46,0.7);}
        .feature-icon{font-size:2.2rem;color:#8b5cf6;margin-bottom:16px;}
        .feature-title{font-size:1.2rem;font-weight:600;color:#e2e8f0;margin-bottom:8px;}
        .feature-desc{color:#94a3b8;line-height:1.4;}
        .login-card{background:rgba(30,30,46,0.9);backdrop-filter:blur(10px);border-radius:32px;padding:40px;border:1px solid rgba(139,92,246,0.3);}
        .login-card h2{color:#e2e8f0;margin-bottom:8px;font-size:1.8rem;}
        .login-card p{color:#94a3b8;margin-bottom:32px;}
        .form-group{margin-bottom:24px;}
        .form-group label{display:block;margin-bottom:8px;color:#cbd5e1;font-size:0.85rem;}
        .form-group input{width:100%;padding:14px 16px;background:#1e1e2e;border:1px solid #2a2a3e;border-radius:16px;font-size:1rem;color:#e2e8f0;}
        .form-group input:focus{outline:none;border-color:#8b5cf6;}
        .btn-login{width:100%;padding:14px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);border:none;border-radius:16px;font-size:1rem;font-weight:600;color:white;cursor:pointer;transition:0.2s;}
        .btn-login:hover{transform:translateY(-2px);}
        .error{background:rgba(239,68,68,0.2);border:1px solid #ef4444;border-radius:16px;padding:12px;margin-bottom:24px;color:#f87171;text-align:center;}
        .footer-note{text-align:center;margin-top:60px;color:#64748b;font-size:0.8rem;}
        @media (max-width: 900px){.two-columns{flex-direction:column;}.login-col{width:100%;}}
body, .login-card, .login-card *,
.feature-card, .feature-card *,
.project-item, .project-item *,
.page-card, .page-card *,
.stat-card, .stat-card *,
.controls-bar, .controls-bar *,
.modal-content, .modal-content *,
.btn-edit, .btn-duplicate, .btn-toggle-status, .btn-delete,
.btn-logout, .create-project-btn, .btn-create-page {
    color: #ffffff !important;
}
input, textarea, select, button, .btn, .btn-primary, .btn-logout, .btn-edit {
    color: #ffffff !important;
    background: #1e1e2e !important; 
    border-color: #8b5cf6 !important;
}
button, .btn-create-page, .create-project-btn, .btn-logout {
    background: linear-gradient(135deg, #8b5cf6, #6d28d9) !important;
    color: white !important;
}
a {
    color: #a78bfa !important;
}
a:hover {
    color: #c084fc !important;
}
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <div class="logo">
            <h1><i class="fas fa-dna"></i> DNA Editor Pro</h1>
            <span>Создавайте сайты как профессионал</span>
        </div>
    </div>
    
    <div class="two-columns">
        <div class="features-col">
            <div class="features-grid">
                <!-- те же карточки преимуществ, можно оставить как было -->
                <div class="feature-card"><div class="feature-icon"><i class="fas fa-magic"></i></div><div class="feature-title">Интуитивный интерфейс</div><div class="feature-desc">Drag & Drop, умный тулбар, визуальные подсказки.</div></div>
                <div class="feature-card"><div class="feature-icon"><i class="fas fa-film"></i></div><div class="feature-title">Анимации одним кликом</div><div class="feature-desc">Fade, слайд, масштаб — без кода.</div></div>
                <div class="feature-card"><div class="feature-icon"><i class="fas fa-palette"></i></div><div class="feature-title">Библиотека шаблонов</div><div class="feature-desc">Сохраняйте блоки и композиции.</div></div>
                <div class="feature-card"><div class="feature-icon"><i class="fas fa-mobile-alt"></i></div><div class="feature-title">Адаптивный дизайн</div><div class="feature-desc">Превью для всех устройств.</div></div>
                <div class="feature-card"><div class="feature-icon"><i class="fas fa-history"></i></div><div class="feature-title">Отмена/Повтор действий</div><div class="feature-desc">Command Pattern — отменяйте любые изменения.</div></div>
                <div class="feature-card"><div class="feature-icon"><i class="fas fa-rocket"></i></div><div class="feature-title">Высокая производительность</div><div class="feature-desc">Кэширование, виртуализация.</div></div>
                <div class="feature-card"><div class="feature-icon"><i class="fas fa-shield-alt"></i></div><div class="feature-title">Безопасность</div><div class="feature-desc">CSRF, хеширование паролей.</div></div>
                <div class="feature-card"><div class="feature-icon"><i class="fas fa-brain"></i></div><div class="feature-title">AI-помощник</div><div class="feature-desc">Умные подсказки и диагностика.</div></div>
            </div>
        </div>
        
        <div class="login-col">
            <div class="login-card">
                <h2>Добро пожаловать</h2>
                <p>Войдите в визуальный редактор</p>
                <?php if ($error): ?>
                    <div class="error"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>
                <form method="POST" action="">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token']) ?>">
                    <div class="form-group">
                        <label>Логин или Email</label>
                        <input type="text" name="username" value="<?= htmlspecialchars($_POST['username'] ?? '') ?>" autofocus>
                    </div>
                    <div class="form-group">
                        <label>Пароль</label>
                        <input type="password" name="password">
                    </div>
                    <button type="submit" name="login" class="btn-login">Войти в редактор</button>
                </form>
                <div style="margin-top:24px; text-align:center;">
                    Нет аккаунта? <a href="/register.php" style="color:#8b5cf6; text-decoration:none;">Зарегистрироваться</a>
                </div>
            </div>
        </div>
    </div>
    
    <div class="footer-note">
        <i class="fas fa-dna"></i> DNA Editor Pro — профессиональный конструктор страниц
    </div>
</div>
</body>
</html>