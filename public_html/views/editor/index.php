<?php
ob_start();
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();

// Проверка авторизации
if (!isset($_SESSION['user_id']) || $_SESSION['logged_in'] !== true) {
    header('Location: /index.php');
    exit;
}

// Подключение ядра приложения
require_once __DIR__ . '/../../bootstrap/app.php';
$container = require __DIR__ . '/../../bootstrap/app.php';
$db = $container['db']()->getConnection();

// Получение параметров
$page_id = isset($_GET['page_id']) ? (int)$_GET['page_id'] : 0;
$project_id = isset($_GET['project_id']) ? (int)$_GET['project_id'] : 0;

// Если page_id не указан, берём первую страницу проекта
if (!$page_id && $project_id) {
    $stmt = $db->prepare("SELECT id FROM pages WHERE project_id = ? AND is_active = 1 ORDER BY sort_order LIMIT 1");
    $stmt->execute([$project_id]);
    $page_id = $stmt->fetchColumn() ?: 0;
}

// Если всё равно нет страницы — создаём новую
if (!$page_id) {
    $stmt = $db->prepare("INSERT INTO pages (project_id, title, slug, is_active, sort_order) VALUES (?, ?, ?, 1, 1)");
    $stmt->execute([$project_id, 'Новая страница', 'new-page-' . time()]);
    $page_id = $db->lastInsertId();
}

// Загрузка данных страницы
$stmt = $db->prepare("SELECT data FROM page_layout WHERE page_id = ?");
$stmt->execute([$page_id]);
$layout = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$layout) {
    $default_data = [
        'blocks' => [
            [
                'id' => 'demo_' . uniqid(),
                'type' => 'hero',
                'content' => [
                    'title' => 'Добро пожаловать в DNA Editor Pro',
                    'subtitle' => 'Начните создавать свой сайт прямо сейчас',
                    'button_text' => 'Начать',
                    'button_link' => '#'
                ],
                'styles' => [
                    'padding' => '60px',
                    'bg_color' => 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
                    'alignment' => 'center',
                    'text_color' => '#ffffff'
                ]
            ],
            [
                'id' => 'demo_' . uniqid(),
                'type' => 'text',
                'content' => [
                    'text' => 'Дважды кликните по этому тексту, чтобы отредактировать его.'
                ],
                'styles' => [
                    'padding' => '40px',
                    'bg_color' => 'transparent',
                    'alignment' => 'left',
                    'color' => '#e2e8f0',
                    'font_size' => '16px'
                ]
            ]
        ],
        'global' => [
            'font_family' => 'Inter, sans-serif',
            'accent_color' => '#8b5cf6',
            'body_bg' => '#0f0f1a',
            'container_width' => '1280px',
            'primary_color' => '#8b5cf6',
            'secondary_color' => '#64748b'
        ],
        'templates' => [],
        'hasUnsaved' => false
    ];
    $json_data = json_encode($default_data, JSON_UNESCAPED_UNICODE);
    $stmt = $db->prepare("INSERT INTO page_layout (page_id, data) VALUES (?, ?)");
    $stmt->execute([$page_id, $json_data]);
    $page_data = $default_data;
} else {
    $page_data = json_decode($layout['data'], true);
    if (!is_array($page_data)) {
        $page_data = ['blocks' => [], 'global' => [], 'templates' => []];
    }
}

// Заголовок страницы
$stmt = $db->prepare("SELECT title FROM pages WHERE id = ?");
$stmt->execute([$page_id]);
$page_title = $stmt->fetchColumn() ?: 'Редактор';

// Информация о проекте
$stmt = $db->prepare("SELECT name FROM projects WHERE id = ?");
$stmt->execute([$project_id]);
$project_name = $stmt->fetchColumn() ?: 'Проект';

// Подготовка данных для передачи в JS
$page_data['pageId'] = $page_id;
$page_data['projectId'] = $project_id;
$page_data['projectName'] = $project_name;
$page_data['pageTitle'] = $page_title;
$page_data['hasUnsaved'] = false;

ob_end_clean();
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DNA Editor Pro — <?= htmlspecialchars($page_title) ?></title>
    
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/assets/css/editor.css">
    
    <style id="composite-styles">
        .composite-block { cursor: move; user-select: none; }
        .composite-block:hover { outline: 2px solid #8b5cf6; }
        .composite-block.selected { outline: 2px solid #8b5cf6; box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2); }
        .resize-handle { position: absolute; width: 10px; height: 10px; background: #8b5cf6; border: 2px solid white; border-radius: 50%; z-index: 100; cursor: pointer; }
        .resize-handle:hover { transform: scale(1.3); }
        .resize-handle.nw { top: -5px; left: -5px; cursor: nw-resize; }
        .resize-handle.n { top: -5px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
        .resize-handle.ne { top: -5px; right: -5px; cursor: ne-resize; }
        .resize-handle.e { top: 50%; right: -5px; transform: translateY(-50%); cursor: e-resize; }
        .resize-handle.se { bottom: -5px; right: -5px; cursor: se-resize; }
        .resize-handle.s { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
        .resize-handle.sw { bottom: -5px; left: -5px; cursor: sw-resize; }
        .resize-handle.w { top: 50%; left: -5px; transform: translateY(-50%); cursor: w-resize; }
        .rotate-handle { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); background: #f59e0b; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 100; }
        .rotate-handle i { font-size: 8px; color: white; }
        .composite-layer-item { padding: 8px 12px; background: #2a2a3e; margin-bottom: 6px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .composite-layer-item:hover { background: #3a3a4e; }
        .composite-layer-item.selected { background: #8b5cf6; }
        .composite-layer-item .delete-layer { color: #ef4444; cursor: pointer; margin-left: auto; }
        .composite-tab { padding: 12px; text-align: center; cursor: pointer; transition: 0.2s; color: #94a3b8; }
        .composite-tab:hover { background: #2a2a3e; color: #fff; }
        .composite-tab.active { color: #8b5cf6; border-bottom: 2px solid #8b5cf6; }
        .composite-tab-content { display: none; padding: 16px; }
        .composite-tab-content.active { display: block; }
        .shape-btn { background: #2a2a3e; border: 1px solid #3a3a4e; padding: 10px; border-radius: 8px; cursor: pointer; color: #e2e8f0; transition: 0.2s; display: flex; align-items: center; gap: 8px; margin-bottom: 8px; width: 100%; }
        .shape-btn:hover { background: #8b5cf6; border-color: #8b5cf6; }
        .composite-section-title { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 0 10px; }
        .composite-shapes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    </style>
</head>
<body>
    <!-- Тулбар -->
    <div id="veToolbar" class="ve-toolbar">
        <div class="ve-toolbar-group">
            <button class="ve-btn" id="saveBtn" title="Сохранить (Ctrl+S)">
                <i class="fas fa-save"></i>
                <span>Сохранить</span>
            </button>
            <button class="ve-btn ve-btn-primary" id="publishBtn" title="Опубликовать">
                <i class="fas fa-globe"></i>
                <span>Опубликовать</span>
            </button>
            <button class="ve-btn" id="previewBtn" title="Открыть превью">
                <i class="fas fa-eye"></i>
                <span>Превью</span>
            </button>
            
            <div class="ve-toolbar-divider"></div>
            
            <button class="ve-btn" id="undoBtn" title="Отменить (Ctrl+Z)">
                <i class="fas fa-undo"></i>
            </button>
            <button class="ve-btn" id="redoBtn" title="Повторить (Ctrl+Y)">
                <i class="fas fa-redo"></i>
            </button>
            
            <div class="ve-toolbar-divider"></div>
            
            <button class="ve-btn" id="exportHtmlBtn" title="Экспорт HTML">
                <i class="fas fa-file-code"></i>
                <span>Экспорт</span>
            </button>
            <button class="ve-btn" id="exportJsonBtn" title="Экспорт JSON">
                <i class="fas fa-download"></i>
                <span>JSON</span>
            </button>
        </div>
        <div class="ve-toolbar-group">
            <span class="ve-project-name"><?= htmlspecialchars($project_name) ?></span>
            <span class="ve-page-name" id="pageNameDisplay"><?= htmlspecialchars($page_title) ?></span>
            <div id="autoSaveIndicator" class="auto-save-indicator">
                <i class="fas fa-check"></i>
                <span>Сохранено</span>
            </div>
        </div>
    </div>

    <!-- Сайдбар -->
    <div id="veSidebar" class="ve-sidebar">
        <div class="ve-sidebar-section">
            <div class="ve-sidebar-title">
                <span><i class="fas fa-cubes"></i> Блоки</span>
                <span id="blocksCount">(0)</span>
            </div>
            <input type="text" id="blockSearch" class="ve-search" placeholder="Поиск блоков...">
            <div class="ve-block-list" id="blocksList"></div>
        </div>
        <div class="ve-sidebar-section">
            <div class="ve-sidebar-title">
                <span><i class="fas fa-layer-group"></i> Слои</span>
            </div>
            <div class="ve-layers-list" id="layersList"></div>
        </div>
        <div class="ve-sidebar-section">
            <div class="ve-sidebar-title">
                <span><i class="fas fa-star"></i> Шаблоны</span>
            </div>
            <div class="ve-templates-list" id="templatesList"></div>
            <button id="createCompositeBtn" class="ve-btn ve-btn-primary" style="width:100%; margin-top:16px;">
                <i class="fas fa-puzzle-piece"></i> Составной блок
            </button>
        </div>
    </div>
    
    <!-- Кнопка открытия/закрытия сайдбара -->
    <div class="ve-sidebar-toggle" id="sidebarToggle">
        <i class="fas fa-chevron-right"></i>
    </div>

    <!-- Холст редактора -->
    <div id="veEditor" class="ve-editor">
        <div id="veCanvas" class="ve-canvas"></div>
    </div>

    <!-- ===== ПАНЕЛЬ СВОЙСТВ (ДОБАВЛЕНО) ===== -->
    <div id="veProperties" class="ve-properties">
        <div class="ve-properties-header">
            <h3><i class="fas fa-sliders-h"></i> Свойства блока</h3>
            <button class="ve-properties-close" id="closePropertiesBtn">&times;</button>
        </div>
        <div class="ve-properties-content" id="propertiesContent"></div>
    </div>

    <!-- Модальное окно подтверждения -->
    <div id="confirmModal" class="ve-modal">
        <div class="ve-modal-content">
            <div class="ve-modal-header">
                <h3>Подтверждение</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="ve-modal-body" id="confirmMessage">Вы уверены?</div>
            <div class="ve-modal-footer">
                <button class="ve-btn" id="confirmCancel">Отмена</button>
                <button class="ve-btn ve-btn-primary" id="confirmOk">Подтвердить</button>
            </div>
        </div>
    </div>

<!-- Модальное окно кастомного блока -->
<div id="customBlockModal" class="ve-modal">
    <div class="ve-modal-content" style="max-width:700px;">
        <div class="ve-modal-header">
            <h3><i class="fas fa-code"></i> Создать кастомный блок</h3>
            <button class="close-modal" id="closeCustomBlockModal">&times;</button>
        </div>
        <div class="ve-modal-body">
            <div class="ve-property">
                <label class="ve-property-label">Название блока</label>
                <input class="ve-property-input" id="customBlockName" placeholder="Мой блок">
            </div>
            <div class="ve-property">
                <label class="ve-property-label">HTML</label>
                <textarea class="ve-property-input" id="customBlockHTML" rows="6" placeholder="<div>Ваш HTML</div>"></textarea>
            </div>
            <div class="ve-property">
                <label class="ve-property-label">CSS</label>
                <textarea class="ve-property-input" id="customBlockCSS" rows="4" placeholder=".my-block { color: red; }"></textarea>
            </div>
            <div class="ve-property">
                <label class="ve-property-label">JavaScript</label>
                <textarea class="ve-property-input" id="customBlockJS" rows="4" placeholder="console.log('Hello!');"></textarea>
            </div>
        </div>
        <div class="ve-modal-footer">
            <button class="ve-btn" id="cancelCustomBlockBtn">Отмена</button>
            <button class="ve-btn ve-btn-primary" id="saveCustomBlockBtn">💾 Сохранить блок</button>
        </div>
    </div>
</div>

    <!-- Передача данных в JavaScript -->
    <script>
        window.pageData = <?= json_encode($page_data, JSON_HEX_TAG | JSON_UNESCAPED_UNICODE) ?>;
        window.projectId = <?= (int)$project_id ?>;
        window.pageId = <?= (int)$page_id ?>;
        window.apiUrl = '/api/editor';
    </script>

    <!-- Основной JavaScript -->
    <script type="module" src="/assets/js/editor.js"></script>
    
    <!-- Composite Builder -->
    <script src="/views/editor/composite_advanced.js"></script>
    
    <!-- Инициализация -->
    <script type="module">
        import { initEditor } from '/assets/js/editor.js';
        
        const app = initEditor(window.pageData);
        window.__editor = app;
        
        console.log('✅ DNA Editor Pro инициализирован');
        console.log(`📄 Страница: ${window.pageData.pageTitle} (ID: ${window.pageData.pageId})`);
        console.log(`📦 Блоков: ${window.pageData.blocks.length}`);
    </script>
</body>
</html>