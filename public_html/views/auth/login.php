<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DNA Editor Pro — Вход</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .login-container {
            max-width: 450px;
            width: 100%;
        }
        .logo {
            text-align: center;
            margin-bottom: 32px;
        }
        .logo h1 {
            font-size: 2rem;
            background: linear-gradient(135deg, #8b5cf6, #c084fc);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }
        .card {
            background: rgba(30, 30, 46, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 32px;
            padding: 40px;
            border: 1px solid rgba(139, 92, 246, 0.3);
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        .card h2 {
            color: #e2e8f0;
            margin-bottom: 8px;
            font-size: 1.8rem;
        }
        .card p {
            color: #94a3b8;
            margin-bottom: 32px;
        }
        .form-group {
            margin-bottom: 24px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #cbd5e1;
            font-size: 0.85rem;
            font-weight: 500;
        }
        .form-group input {
            width: 100%;
            padding: 14px 16px;
            background: #1e1e2e;
            border: 1px solid #2a2a3e;
            border-radius: 16px;
            font-size: 1rem;
            color: #e2e8f0;
            transition: all 0.2s;
        }
        .form-group input:focus {
            outline: none;
            border-color: #8b5cf6;
            box-shadow: 0 0 0 3px rgba(139,92,246,0.2);
        }
        .btn-login {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #8b5cf6, #6d28d9);
            border: none;
            border-radius: 16px;
            font-size: 1rem;
            font-weight: 600;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(139,92,246,0.4);
        }
        .error {
            background: rgba(239,68,68,0.2);
            border: 1px solid #ef4444;
            border-radius: 16px;
            padding: 12px;
            margin-bottom: 24px;
            color: #f87171;
            font-size: 0.85rem;
            text-align: center;
        }
        .success {
            background: rgba(34,197,94,0.2);
            border: 1px solid #22c55e;
            border-radius: 16px;
            padding: 12px;
            margin-bottom: 24px;
            color: #4ade80;
            text-align: center;
        }
        .footer {
            text-align: center;
            margin-top: 24px;
            color: #64748b;
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1><i class="fas fa-dna"></i> DNA Editor Pro</h1>
        </div>
        <div class="card">
            <h2>Добро пожаловать</h2>
            <p>Войдите в свой аккаунт</p>
            
            <?php if (!empty($error)): ?>
                <div class="error"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>
            
            <form method="POST" action="/login">
                <?= csrf_field() ?>
                <div class="form-group">
                    <label><i class="fas fa-user"></i> Логин или Email</label>
                    <input type="text" name="username" value="<?= htmlspecialchars($old['username'] ?? '') ?>" required>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-lock"></i> Пароль</label>
                    <input type="password" name="password" required>
                </div>
                <button type="submit" class="btn-login">Войти в редактор</button>
            </form>
        </div>
        <div class="footer">
            DNA Editor Pro — профессиональный конструктор страниц
        </div>
    </div>
</body>
</html>