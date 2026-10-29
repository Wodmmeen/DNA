<?php
session_start();
ini_set('display_errors', 1);
error_reporting(E_ALL);
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

function getDB() {
    global $pdo;
    return $pdo;
}

if (!isset($_SESSION['user_id']) || $_SESSION['logged_in'] !== true) {
    header('Location: /index.php');
    exit;
}

$db = getDB();
$userId = $_SESSION['user_id'];
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

class ProjectManager {
    private $db;
    private $userId;
    public function __construct($db, $userId) {
        $this->db = $db;
        $this->userId = $userId;
    }
    public function getUserProjects() {
        $stmt = $this->db->prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$this->userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function getProject($id) {
        $stmt = $this->db->prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $this->userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    public function createProject($name, $description = '') {
        $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $name), '-'));
        if (empty($slug)) $slug = 'project-' . time();
        $stmt = $this->db->prepare("INSERT INTO projects (user_id, name, slug, description, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([$this->userId, $name, $slug, $description]);
        return $this->db->lastInsertId();
    }
    public function updateProject($id, $name, $description) {
        $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $name), '-'));
        if (empty($slug)) $slug = 'project-' . time();
        $stmt = $this->db->prepare("UPDATE projects SET name = ?, slug = ?, description = ?, updated_at = NOW() WHERE id = ? AND user_id = ?");
        return $stmt->execute([$name, $slug, $description, $id, $this->userId]);
    }
    public function deleteProject($id) {
        $stmt = $this->db->prepare("DELETE FROM projects WHERE id = ? AND user_id = ?");
        return $stmt->execute([$id, $this->userId]);
    }
    public function exportProject($projectId) {
        $project = $this->getProject($projectId);
        if (!$project) return null;
        $stmt = $this->db->prepare("SELECT p.*, pl.data as layout_data FROM pages p LEFT JOIN page_layout pl ON p.id = pl.page_id WHERE p.project_id = ?");
        $stmt->execute([$projectId]);
        $pages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return ['project' => $project, 'pages' => $pages];
    }
}

$projectManager = new ProjectManager($db, $userId);
$selectedProjectId = isset($_GET['project_id']) ? (int)$_GET['project_id'] : 0;
$userProjects = $projectManager->getUserProjects();
if (empty($userProjects)) {
    $projectManager->createProject('Мои страницы', 'Стандартный проект');
    $userProjects = $projectManager->getUserProjects();
}

if ($selectedProjectId === 0 && !empty($userProjects)) {
    $selectedProjectId = $userProjects[0]['id'];
}
$selectedProject = $projectManager->getProject($selectedProjectId);
$globalSearch = trim($_GET['global_search'] ?? '');
$globalSearchResults = [];
if ($globalSearch) {
    $stmt = $db->prepare("SELECT p.*, pr.name as project_name, pr.id as project_id 
                          FROM pages p 
                          JOIN projects pr ON p.project_id = pr.id 
                          WHERE pr.user_id = ? AND (p.title LIKE ? OR p.slug LIKE ?) 
                          ORDER BY p.created_at DESC");
    $stmt->execute([$userId, "%$globalSearch%", "%$globalSearch%"]);
    $globalSearchResults = $stmt->fetchAll(PDO::FETCH_ASSOC);
}
$pages = [];
if ($selectedProject) {
    $search = trim($_GET['search'] ?? '');
    $sql = "SELECT id, title, slug, is_active, created_at, sort_order FROM pages WHERE project_id = ?";
    $params = [$selectedProjectId];
    if ($search) {
        $sql .= " AND title LIKE ?";
        $params[] = "%$search%";
    }
    $sql .= " ORDER BY sort_order ASC, created_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $pages = $stmt->fetchAll();
}
$analytics = [
    'total_pages' => count($pages),
    'active_pages' => count(array_filter($pages, fn($p) => $p['is_active'])),
    'total_views' => rand(1200, 5000),
    'last_activity' => $pages ? date('d.m.Y H:i', strtotime($pages[0]['created_at'])) : '—'
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrf = $_POST['csrf_token'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'], $csrf)) {
        $_SESSION['error'] = 'Ошибка CSRF. Обновите страницу.';
        redirectDashboard($selectedProjectId);
        exit;
    }
    $action = $_POST['action'] ?? '';
    
    if ($action === 'create_project') {
        $name = trim($_POST['name'] ?? '');
        $desc = $_POST['description'] ?? '';
        if (empty($name)) {
            $_SESSION['error'] = 'Название проекта не может быть пустым';
        } else {
            $projectManager->createProject($name, $desc);
            $_SESSION['success'] = 'Проект создан';
        }
        redirectDashboard();
        exit;
    }
    
    if ($action === 'update_project' && isset($_POST['project_id'])) {
        $id = (int)$_POST['project_id'];
        $name = trim($_POST['name'] ?? '');
        $desc = $_POST['description'] ?? '';
        if (empty($name)) {
            $_SESSION['error'] = 'Название проекта не может быть пустым';
        } else {
            $projectManager->updateProject($id, $name, $desc);
            $_SESSION['success'] = 'Проект обновлён';
        }
        redirectDashboard($id);
        exit;
    }
    
    if ($action === 'delete_project' && isset($_POST['project_id'])) {
        $projectManager->deleteProject((int)$_POST['project_id']);
        $_SESSION['success'] = 'Проект удалён';
        redirectDashboard();
        exit;
    }
    
    if ($action === 'export_project' && isset($_POST['project_id'])) {
        $data = $projectManager->exportProject((int)$_POST['project_id']);
        if ($data) {
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="project_' . $data['project']['slug'] . '_export.json"');
            echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    
    if ($action === 'import_project' && isset($_FILES['import_file']) && $_FILES['import_file']['error'] === UPLOAD_ERR_OK) {
        $content = file_get_contents($_FILES['import_file']['tmp_name']);
        $data = json_decode($content, true);
        if ($data && isset($data['project']) && isset($data['pages'])) {
            $newProjectId = $projectManager->createProject($data['project']['name'] . ' (импорт)', $data['project']['description']);
            foreach ($data['pages'] as $page) {
                $slug = $page['slug'] . '-import-' . time();
                $stmt = $db->prepare("INSERT INTO pages (project_id, title, slug, is_active, sort_order) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$newProjectId, $page['title'], $slug, $page['is_active'], 0]);
                $newPageId = $db->lastInsertId();
                if (!empty($page['layout_data'])) {
                    $db->prepare("INSERT INTO page_layout (page_id, data) VALUES (?, ?)")
                        ->execute([$newPageId, $page['layout_data']]);
                }
            }
            $_SESSION['success'] = 'Проект импортирован';
        } else {
            $_SESSION['error'] = 'Неверный формат файла';
        }
        redirectDashboard();
        exit;
    }
    
    if ($action === 'create_page' && $selectedProjectId) {
        $title = trim($_POST['title'] ?? '');
        if (empty($title)) {
            $_SESSION['error'] = 'Название страницы не может быть пустым';
            redirectDashboard($selectedProjectId);
            exit;
        }
        $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $title), '-'));
        if (empty($slug)) $slug = 'page-' . time();
        $checkStmt = $db->prepare("SELECT id FROM pages WHERE slug = ? AND project_id = ?");
        $checkStmt->execute([$slug, $selectedProjectId]);
        if ($checkStmt->fetch()) {
            $slug = $slug . '-' . time();
        }
        $is_active = (int)($_POST['is_active'] ?? 1);
        $maxSort = $db->prepare("SELECT MAX(sort_order) FROM pages WHERE project_id = ?");
        $maxSort->execute([$selectedProjectId]);
        $sort_order = ($maxSort->fetchColumn() ?? 0) + 1;
        try {
            $db->beginTransaction();
            // ИСПРАВЛЕНО: убрал created_at и NOW()
            $stmt = $db->prepare("INSERT INTO pages (project_id, title, slug, is_active, sort_order) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$selectedProjectId, $title, $slug, $is_active, $sort_order]);
            $newId = $db->lastInsertId();
            $default_data = json_encode(['blocks' => [], 'global' => ['font_family' => 'Inter, sans-serif', 'accent_color' => '#8b5cf6', 'body_bg' => '#0f0f1a', 'container_width' => '1280px'], 'templates' => []]);
            $db->prepare("INSERT INTO page_layout (page_id, data) VALUES (?, ?)")->execute([$newId, $default_data]);
            $db->commit();
            $_SESSION['success'] = 'Страница "' . htmlspecialchars($title) . '" создана';
        } catch (Exception $e) {
            $db->rollBack();
            $_SESSION['error'] = 'Ошибка создания страницы: ' . $e->getMessage();
        }
        redirectDashboard($selectedProjectId);
        exit;
    }
    
    $page_id = (int)($_POST['page_id'] ?? 0);
    
    if ($action === 'duplicate_page' && $page_id) {
        $orig = $db->prepare("SELECT title, slug, is_active FROM pages WHERE id = ?");
        $orig->execute([$page_id]);
        $orig = $orig->fetch();
        if ($orig) {
            $newTitle = $orig['title'] . ' (копия)';
            $newSlug = $orig['slug'] . '-copy-' . time();
            $maxSort = $db->prepare("SELECT MAX(sort_order) FROM pages WHERE project_id = ?");
            $maxSort->execute([$selectedProjectId]);
            $sort_order = ($maxSort->fetchColumn() ?? 0) + 1;
            // ИСПРАВЛЕНО: убрал created_at и NOW()
            $db->prepare("INSERT INTO pages (project_id, title, slug, is_active, sort_order) VALUES (?, ?, ?, ?, ?)")
                ->execute([$selectedProjectId, $newTitle, $newSlug, $orig['is_active'], $sort_order]);
            $newId = $db->lastInsertId();
            $layout = $db->prepare("SELECT data FROM page_layout WHERE page_id = ?");
            $layout->execute([$page_id]);
            $layoutData = $layout->fetchColumn();
            $db->prepare("INSERT INTO page_layout (page_id, data) VALUES (?, ?)")->execute([$newId, $layoutData]);
            $_SESSION['success'] = 'Страница скопирована';
        }
        redirectDashboard($selectedProjectId);
        exit;
    }
    
    if ($action === 'toggle_page_status' && $page_id) {
        $db->prepare("UPDATE pages SET is_active = NOT is_active WHERE id = ?")->execute([$page_id]);
        redirectDashboard($selectedProjectId);
        exit;
    }
    
    if ($action === 'delete_page' && $page_id) {
        $db->prepare("DELETE FROM page_layout WHERE page_id = ?")->execute([$page_id]);
        $db->prepare("DELETE FROM pages WHERE id = ?")->execute([$page_id]);
        $_SESSION['success'] = 'Страница удалена';
        redirectDashboard($selectedProjectId);
        exit;
    }
    
    if ($action === 'update_page_title' && $page_id && isset($_POST['title'])) {
        $newTitle = trim($_POST['title']);
        if (empty($newTitle)) {
            $_SESSION['error'] = 'Название не может быть пустым';
            redirectDashboard($selectedProjectId);
            exit;
        }
        $newSlug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $newTitle), '-'));
        if (empty($newSlug)) $newSlug = 'page-' . time();
        $db->prepare("UPDATE pages SET title = ?, slug = ? WHERE id = ?")->execute([$newTitle, $newSlug, $page_id]);
        $_SESSION['success'] = 'Название обновлено';
        redirectDashboard($selectedProjectId);
        exit;
    }
}

function redirectDashboard($projectId = null) {
    $url = '/dashboard.php';
    if ($projectId) $url .= '?project_id=' . $projectId;
    header('Location: ' . $url);
    exit;
}

$error = $_SESSION['error'] ?? '';
$success = $_SESSION['success'] ?? '';
unset($_SESSION['error'], $_SESSION['success']);
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DNA Editor Pro — Мои проекты</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Inter',sans-serif;background:radial-gradient(circle at 10% 20%, #0f0f1a, #03030a);min-height:100vh;padding:30px 20px;}
        .container{max-width:1600px;margin:0 auto;}
        .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:40px;flex-wrap:wrap;gap:15px;}
        .header h1{font-size:2rem;background:linear-gradient(135deg,#a78bfa,#c084fc);-webkit-background-clip:text;background-clip:text;color:transparent;}
        .user-info{display:flex;align-items:center;gap:20px;background:rgba(30,30,46,0.6);padding:8px 20px;border-radius:40px;}
        .btn-logout{background:rgba(239,68,68,0.2);border:1px solid #ef4444;color:#f87171;padding:8px 20px;border-radius:40px;text-decoration:none;}
        .btn-logout:hover{background:#ef4444;color:white;}
        .dashboard-layout{display:flex;flex-wrap:wrap;gap:30px;}
        .projects-sidebar{flex:0 0 300px;background:rgba(30,30,46,0.5);backdrop-filter:blur(12px);border-radius:32px;padding:24px;border:1px solid rgba(139,92,246,0.3);}
        .projects-sidebar h3{color:#e2e8f0;margin-bottom:20px;}
        .project-list{display:flex;flex-direction:column;gap:8px;margin-bottom:24px;max-height:400px;overflow-y:auto;}
        .project-item{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-radius:20px;cursor:pointer;color:#cbd5e1;background:rgba(30,30,46,0.4);}
        .project-item:hover,.project-item.active{background:#8b5cf6;color:white;}
        .project-item a{text-decoration:none;color:inherit;flex:1;}
        .create-project-btn{width:100%;background:linear-gradient(135deg,#8b5cf6,#6d28d9);border:none;padding:12px;border-radius:40px;color:white;cursor:pointer;}
        .content-area{flex:1;}
        .project-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;}
        .project-header h2{font-size:1.8rem;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);-webkit-background-clip:text;background-clip:text;color:transparent;}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:30px;}
        .stat-card{background:rgba(30,30,46,0.6);border-radius:24px;padding:20px;text-align:center;border:1px solid rgba(139,92,246,0.3);}
        .stat-number{font-size:2.5rem;font-weight:800;color:#c084fc;}
        .controls-bar{display:flex;flex-wrap:wrap;gap:15px;margin-bottom:25px;}
        .search-form{display:flex;gap:8px;flex:1;max-width:400px;}
        .search-form input{flex:1;padding:12px 18px;background:#1e1e2e;border:1px solid #2a2a3e;border-radius:40px;color:#e2e8f0;}
        .btn-create-page{background:linear-gradient(135deg,#8b5cf6,#6d28d9);border:none;padding:12px 24px;border-radius:40px;color:white;cursor:pointer;}
        .global-search-section{margin-bottom:30px;background:rgba(30,30,46,0.4);border-radius:32px;padding:20px;}
        .global-search-form{display:flex;gap:12px;flex-wrap:wrap;}
        .global-search-form input{flex:1;padding:14px 20px;background:#1e1e2e;border:1px solid #8b5cf6;border-radius:48px;color:white;}
        .pages-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:24px;}
        .page-card{background:rgba(30,30,46,0.7);border-radius:28px;padding:20px;border:1px solid rgba(139,92,246,0.3);transition:0.3s;}
        .page-card:hover{transform:translateY(-6px);border-color:#8b5cf6;}
        .page-title{font-size:1.2rem;font-weight:700;color:white;margin-bottom:12px;}
        .status-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:40px;font-size:0.7rem;margin:12px 0;}
        .status-active{background:rgba(16,185,129,0.2);color:#6ee7b7;border:1px solid #10b981;}
        .status-inactive{background:rgba(239,68,68,0.2);color:#fca5a5;border:1px solid #ef4444;}
        .page-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}
        .btn-edit{background:#8b5cf6;color:white;border:none;padding:6px 12px;border-radius:32px;text-decoration:none;font-size:0.75rem;}
        .btn-preview{background:#3b82f6;color:white;border:none;padding:6px 12px;border-radius:32px;text-decoration:none;font-size:0.75rem;}
        .btn-duplicate{background:rgba(139,92,246,0.15);border:1px solid #a78bfa;color:#c4b5fd;padding:6px 12px;border-radius:32px;cursor:pointer;}
        .btn-toggle-status{background:#2a2a3e;border:1px solid #6b7280;color:#d1d5db;padding:6px 12px;border-radius:32px;cursor:pointer;}
        .btn-delete{background:rgba(239,68,68,0.15);border:1px solid #f87171;color:#fecaca;padding:6px 12px;border-radius:32px;cursor:pointer;}
        .error-message{background:rgba(239,68,68,0.2);border:1px solid #ef4444;border-radius:16px;padding:12px;margin-bottom:20px;color:#f87171;}
        .success-message{background:rgba(16,185,129,0.2);border:1px solid #10b981;border-radius:16px;padding:12px;margin-bottom:20px;color:#6ee7b7;}
        .modal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);align-items:center;justify-content:center;z-index:10000;}
        .modal.active{display:flex;}
        .modal-content{background:#1e1e2e;border-radius:32px;padding:32px;max-width:500px;width:90%;border:1px solid #8b5cf6;}
        .modal-buttons{display:flex;justify-content:flex-end;gap:12px;margin-top:20px;}
        @media (max-width: 768px){
            .dashboard-layout{flex-direction:column;}
            .projects-sidebar{flex:auto;}
            .pages-grid{grid-template-columns:1fr;}
        }
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
        <h1><i class="fas fa-dna"></i> DNA Editor Pro</h1>
        <div class="user-info">
            <span><i class="fas fa-user-astronaut"></i> <?= htmlspecialchars($_SESSION['username'] ?? 'Мастер') ?></span>
            <a href="/logout.php" class="btn-logout"><i class="fas fa-sign-out-alt"></i> Выйти</a>
        </div>
    </div>
    
    <div class="global-search-section">
        <form method="GET" class="global-search-form">
            <input type="text" name="global_search" placeholder="🔍 Глобальный поиск по всем страницам..." value="<?= htmlspecialchars($globalSearch) ?>">
            <button type="submit" class="btn-create-page">Искать</button>
        </form>
        <?php if ($globalSearch && !empty($globalSearchResults)): ?>
            <div style="margin-top:20px;">
                <h4 style="color:#e2e8f0;">Результаты (<?= count($globalSearchResults) ?>)</h4>
                <?php foreach ($globalSearchResults as $result): ?>
                    <div style="background:rgba(30,30,46,0.6); border-radius:20px; padding:16px; margin-top:10px;">
                        <strong><?= htmlspecialchars($result['title']) ?></strong>
                        <div>Проект: <?= htmlspecialchars($result['project_name']) ?></div>
                        <a href="/views/editor/index.php?page_id=<?= $result['id'] ?>&project_id=<?= $result['project_id'] ?>" class="btn-edit">Редактировать</a>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
    
    <div class="dashboard-layout">
        <div class="projects-sidebar">
            <h3>Мои проекты</h3>
            <div class="project-list">
                <?php foreach ($userProjects as $project): ?>
                    <div class="project-item <?= $selectedProjectId == $project['id'] ? 'active' : '' ?>">
                        <a href="?project_id=<?= $project['id'] ?>"><?= htmlspecialchars($project['name']) ?></a>
                        <div>
                            <button class="edit-project" data-id="<?= $project['id'] ?>" data-name="<?= htmlspecialchars($project['name']) ?>" data-desc="<?= htmlspecialchars($project['description'] ?? '') ?>">✏️</button>
                            <button class="delete-project" data-id="<?= $project['id'] ?>">🗑</button>
                            <button class="export-project" data-id="<?= $project['id'] ?>">📥</button>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
            <button class="create-project-btn" id="createProjectBtn">+ Новый проект</button>
            <form action="" method="POST" enctype="multipart/form-data" style="margin-top:16px;">
                <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
                <input type="hidden" name="action" value="import_project">
                <label class="btn-create-page" style="display:block; text-align:center; background:#2a2a3e; cursor:pointer;">
                    📂 Импорт проекта (JSON)
                    <input type="file" name="import_file" accept=".json" style="display:none;" onchange="this.form.submit()">
                </label>
            </form>
        </div>
        
        <div class="content-area">
            <?php if ($selectedProject): ?>
                <div class="project-header">
                    <h2><?= htmlspecialchars($selectedProject['name']) ?></h2>
                    <button class="btn-create-page" id="showCreatePageModal">+ Создать страницу</button>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-number"><?= $analytics['total_pages'] ?></div><div>Страниц</div></div>
                    <div class="stat-card"><div class="stat-number"><?= $analytics['active_pages'] ?></div><div>Активных</div></div>
                </div>
                
                <?php if ($error): ?>
                    <div class="error-message"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>
                <?php if ($success): ?>
                    <div class="success-message"><?= htmlspecialchars($success) ?></div>
                <?php endif; ?>
                
                <div class="controls-bar">
                    <form method="GET" class="search-form">
                        <input type="hidden" name="project_id" value="<?= $selectedProjectId ?>">
                        <input type="text" name="search" placeholder="Поиск..." value="<?= htmlspecialchars($_GET['search'] ?? '') ?>">
                        <button type="submit" class="btn-create-page">🔍</button>
                    </form>
                </div>
                
                <?php if (empty($pages)): ?>
                    <div style="text-align:center;padding:60px;color:#94a3b8;">Нет страниц. Создайте первую!</div>
                <?php else: ?>
                    <div class="pages-grid" id="pagesGrid">
                        <?php foreach ($pages as $page): ?>
                            <div class="page-card">
                                <div class="page-title"><?= htmlspecialchars($page['title']) ?></div>
                                <div class="status-badge <?= $page['is_active'] ? 'status-active' : 'status-inactive' ?>">
                                    <?= $page['is_active'] ? 'Активна' : 'Неактивна' ?>
                                </div>
                                <div class="page-actions">
                                    <a href="/views/editor/index.php?page_id=<?= $page['id'] ?>&project_id=<?= $selectedProjectId ?>" class="btn-edit">Редактировать</a>
                                    <button class="btn-duplicate" data-id="<?= $page['id'] ?>">Дублировать</button>
                                    <button class="btn-toggle-status" data-id="<?= $page['id'] ?>">Сменить статус</button>
                                    <button class="btn-delete" data-id="<?= $page['id'] ?>">Удалить</button>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            <?php else: ?>
                <div style="text-align:center;padding:80px;color:#94a3b8;">Выберите проект или создайте новый</div>
            <?php endif; ?>
        </div>
    </div>
</div>

<div id="projectModal" class="modal"><div class="modal-content"><h3 id="projectModalTitle">Создать проект</h3><form id="projectForm" method="POST"><input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>"><input type="hidden" name="action" id="projectAction" value="create_project"><input type="hidden" name="project_id" id="projectId"><input type="text" name="name" id="projectName" placeholder="Название" required><textarea name="description" id="projectDesc" rows="3" placeholder="Описание"></textarea><div class="modal-buttons"><button type="button" class="cancel" id="closeProjectModal">Отмена</button><button type="submit">Сохранить</button></div></form></div></div>
<div id="pageModal" class="modal"><div class="modal-content"><h3>Создать страницу</h3><form id="pageForm" method="POST"><input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>"><input type="hidden" name="action" value="create_page"><input type="text" name="title" placeholder="Название" required><select name="is_active"><option value="1">Активна</option><option value="0">Неактивна</option></select><div class="modal-buttons"><button type="button" class="cancel" id="closePageModal">Отмена</button><button type="submit">Создать</button></div></form></div></div>

<script>
const csrfToken = "<?= $_SESSION['csrf_token'] ?>";
let selectedIds = new Set();
const projectModal = document.getElementById('projectModal');
document.getElementById('createProjectBtn').onclick = () => {
    document.getElementById('projectModalTitle').innerText = 'Создать проект';
    document.getElementById('projectAction').value = 'create_project';
    document.getElementById('projectId').value = '';
    document.getElementById('projectName').value = '';
    document.getElementById('projectDesc').value = '';
    projectModal.classList.add('active');
};
document.querySelectorAll('.edit-project').forEach(btn => {
    btn.onclick = () => {
        document.getElementById('projectModalTitle').innerText = 'Редактировать проект';
        document.getElementById('projectAction').value = 'update_project';
        document.getElementById('projectId').value = btn.dataset.id;
        document.getElementById('projectName').value = btn.dataset.name;
        document.getElementById('projectDesc').value = btn.dataset.desc;
        projectModal.classList.add('active');
    };
});
document.querySelectorAll('.delete-project').forEach(btn => {
    btn.onclick = () => {
        if(confirm('Удалить проект? Все страницы будут удалены.')) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.innerHTML = `<input type="hidden" name="csrf_token" value="${csrfToken}"><input type="hidden" name="action" value="delete_project"><input type="hidden" name="project_id" value="${btn.dataset.id}">`;
            document.body.appendChild(form);
            form.submit();
        }
    };
});
document.querySelectorAll('.export-project').forEach(btn => {
    btn.onclick = () => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.innerHTML = `<input type="hidden" name="csrf_token" value="${csrfToken}"><input type="hidden" name="action" value="export_project"><input type="hidden" name="project_id" value="${btn.dataset.id}">`;
        document.body.appendChild(form);
        form.submit();
    };
});
document.getElementById('closeProjectModal').onclick = () => projectModal.classList.remove('active');
const pageModal = document.getElementById('pageModal');
document.getElementById('showCreatePageModal').onclick = () => pageModal.classList.add('active');
document.getElementById('closePageModal').onclick = () => pageModal.classList.remove('active');
document.querySelectorAll('.btn-duplicate').forEach(btn => {
    btn.onclick = () => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.innerHTML = `<input type="hidden" name="csrf_token" value="${csrfToken}"><input type="hidden" name="action" value="duplicate_page"><input type="hidden" name="page_id" value="${btn.dataset.id}">`;
        document.body.appendChild(form);
        form.submit();
    };
});
document.querySelectorAll('.btn-toggle-status').forEach(btn => {
    btn.onclick = () => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.innerHTML = `<input type="hidden" name="csrf_token" value="${csrfToken}"><input type="hidden" name="action" value="toggle_page_status"><input type="hidden" name="page_id" value="${btn.dataset.id}">`;
        document.body.appendChild(form);
        form.submit();
    };
});
document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.onclick = () => {
        if(confirm('Удалить страницу?')) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.innerHTML = `<input type="hidden" name="csrf_token" value="${csrfToken}"><input type="hidden" name="action" value="delete_page"><input type="hidden" name="page_id" value="${btn.dataset.id}">`;
            document.body.appendChild(form);
            form.submit();
        }
    };
});

window.onclick = (e) => {
    if(e.target === projectModal) projectModal.classList.remove('active');
    if(e.target === pageModal) pageModal.classList.remove('active');
};
</script>
</body>
</html>