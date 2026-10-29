<?php
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['logged_in'] !== true) {
    header('Location: /index.php');
    exit;
}
// Подключение к БД для получения pageData (упрощённо, можно заглушкой)
$page_id = isset($_GET['page_id']) ? (int)$_GET['page_id'] : 0;
$project_id = isset($_GET['project_id']) ? (int)$_GET['project_id'] : 0;
// Здесь должна быть логика загрузки pageData из БД, но для теста можно пустой макет
$page_data = ['blocks' => [], 'global' => [], 'templates' => []];
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DNA Editor Pro — Тестовый редактор</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js"></script>
    <style>
        /* Минимальные стили для демонстрации */
        body { margin: 0; font-family: 'Inter', sans-serif; background: #0f0f1a; color: #e2e8f0; }
        .ve-toolbar { background: #1a1a2e; padding: 10px 20px; display: flex; gap: 10px; border-bottom: 1px solid #2a2a3e; }
        .ve-btn { background: transparent; border: none; color: #94a3b8; padding: 6px 12px; border-radius: 8px; cursor: pointer; }
        .ve-btn-primary { background: #8b5cf6; color: white; }
        .ve-editor { padding: 20px; }
        .ve-canvas { background: #ffffff; min-height: 500px; border-radius: 16px; padding: 20px; }
        /* Модалка конструктора */
        .ve-modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; }
        .ve-modal-content { background: #1e1e2e; width: 90%; height: 90%; margin: 5% auto; border-radius: 24px; display: flex; flex-direction: column; }
        .ve-modal-header { padding: 16px; border-bottom: 1px solid #2a2a3e; display: flex; justify-content: space-between; }
        .ve-modal-body { flex: 1; display: flex; }
        .composite-left-panel { width: 280px; border-right: 1px solid #2a2a3e; padding: 16px; }
        .composite-shapes-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; margin-bottom: 20px; }
        .shape-btn { background: #2a2a3e; border: none; padding: 10px; border-radius: 8px; color: white; cursor: pointer; }
        .composite-canvas-area { flex: 1; position: relative; background: #e2e8f0; overflow: auto; }
        #compositeCanvas { position: relative; width: 1200px; height: 800px; background: white; margin: 20px auto; transform-origin: 0 0; }
        .composite-block { position: absolute; cursor: move; border: 2px solid transparent; }
        .composite-block.selected { border-color: #8b5cf6; }
        .resize-handle { position: absolute; width: 8px; height: 8px; background: #8b5cf6; border-radius: 50%; }
        .composite-layer-item { padding: 8px; background: #2a2a3e; margin-bottom: 4px; border-radius: 6px; cursor: pointer; }
        .prop-group { margin-bottom: 12px; }
        .prop-group label { display: block; font-size: 12px; margin-bottom: 4px; }
        .prop-group input { width: 100%; padding: 6px; background: #1e1e2e; border: 1px solid #2a2a3e; border-radius: 6px; color: white; }
    </style>
</head>
<body>
<div class="ve-toolbar">
    <button class="ve-btn" id="saveBtn">Сохранить</button>
    <button class="ve-btn ve-btn-primary" id="createCompositeBtn">Создать составной блок</button>
</div>
<div class="ve-editor">
    <div class="ve-canvas" id="veCanvas"></div>
</div>

<!-- Модалка конструктора -->
<div id="compositeModal" class="ve-modal">
    <div class="ve-modal-content">
        <div class="ve-modal-header">
            <h3>Конструктор составных блоков</h3>
            <button id="closeCompositeModalBtn">&times;</button>
        </div>
        <div class="ve-modal-body">
            <div class="composite-left-panel">
                <div class="composite-shapes-grid" id="compositeShapesGrid">
                    <button data-shape="square" class="shape-btn">Квадрат</button>
                    <button data-shape="circle" class="shape-btn">Круг</button>
                    <button data-shape="triangle" class="shape-btn">Треугольник</button>
                    <button data-shape="diamond" class="shape-btn">Ромб</button>
                </div>
                <button id="compositeAddTextBtn" class="shape-btn" style="width:100%; margin-bottom:8px;">Текст</button>
                <button id="compositeAddImageBtn" class="shape-btn" style="width:100%;">Изображение</button>
                <hr>
                <div id="compositeLayersList"></div>
            </div>
            <div class="composite-canvas-area">
                <div id="compositeCanvas" style="position:relative; background:#ffffff; width:100%; height:100%; overflow:auto;"></div>
            </div>
            <div style="width:260px; padding:16px; border-left:1px solid #2a2a3e;" id="compositePropertiesPanel">
                <div>Выберите элемент</div>
            </div>
        </div>
        <div class="ve-modal-footer" style="padding:16px; text-align:right;">
            <button id="cancelCompositeBtn">Отмена</button>
            <button id="saveCompositeBtn">Сохранить как шаблон</button>
        </div>
    </div>
</div>

<script src="/views/editor/composite_advanced.js"></script>
<script>
    // Глобальные переменные для простоты
    let pageData = <?= json_encode($page_data) ?>;
    // Если нет composite_advanced.js, подгружаем базовые функции
    if (typeof window.CompositeBuilder === 'undefined') {
        console.warn('composite_advanced.js не загружен, создаём заглушку');
        window.CompositeBuilder = { open: function() { alert('Загрузите composite_advanced.js'); } };
    }
    document.getElementById('createCompositeBtn').onclick = () => {
        if (window.CompositeBuilder && CompositeBuilder.open) CompositeBuilder.open();
        else alert('Ошибка: CompositeBuilder не определён');
    };
    document.getElementById('closeCompositeModalBtn').onclick = () => {
        if (window.CompositeBuilder && CompositeBuilder.close) CompositeBuilder.close();
    };
    document.getElementById('cancelCompositeBtn').onclick = () => {
        if (window.CompositeBuilder && CompositeBuilder.close) CompositeBuilder.close();
    };
    document.getElementById('saveCompositeBtn').onclick = () => {
        if (window.CompositeBuilder && CompositeBuilder.saveTemplate) CompositeBuilder.saveTemplate();
        else alert('saveTemplate не определён');
    };
    // Простой рендер основной страницы (заглушка)
    document.getElementById('veCanvas').innerHTML = '<div style="padding:40px; text-align:center;">Редактор работает. Нажмите "Создать составной блок" для теста конструктора.</div>';
</script>
</body>
</html>