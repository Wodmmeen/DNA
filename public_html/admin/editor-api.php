<?php
session_start();
header('Content-Type: application/json');

// Прямое подключение к БД (как в твоём монолите)
$host = 'localhost';
$dbname = 's92932h2_shop';
$user = 's92932h2_shop';
$pass = 'fvzOvzl3Cv8%';

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Ошибка БД']);
    exit;
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'get_pages':
        // Для монолита — возвращаем все страницы
        $stmt = $db->query("SELECT id, title, slug, is_active FROM pages ORDER BY sort_order");
        $pages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'pages' => $pages]);
        break;
        
    case 'load_page':
        $pageId = (int)($_POST['page_id'] ?? 0);
        $stmt = $db->prepare("SELECT data FROM page_layout WHERE page_id = ?");
        $stmt->execute([$pageId]);
        $layout = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $layout['data'] ?? '{}']);
        break;
        
    case 'save_layout':
        $pageId = (int)($_POST['page_id'] ?? 0);
        $data = $_POST['data'] ?? '';
        if ($pageId && $data) {
            $stmt = $db->prepare("UPDATE page_layout SET data = ?, updated_at = NOW() WHERE page_id = ?");
            $stmt->execute([$data, $pageId]);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Нет данных']);
        }
        break;
        
    case 'publish_page':
        $pageId = (int)($_POST['page_id'] ?? 0);
        $data = $_POST['data'] ?? '';
        if ($pageId && $data) {
            $stmt = $db->prepare("UPDATE page_layout SET data = ?, updated_at = NOW() WHERE page_id = ?");
            $stmt->execute([$data, $pageId]);
            $stmt = $db->prepare("UPDATE pages SET is_published = 1, published_at = NOW() WHERE id = ?");
            $stmt->execute([$pageId]);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Нет данных']);
        }
        break;
        
    case 'upload_image':
        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/uploads/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            $ext = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
            $filename = 'img_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
            $targetPath = $uploadDir . $filename;
            if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
                echo json_encode(['success' => true, 'url' => '/uploads/' . $filename]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Ошибка сохранения']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'Файл не загружен']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Неизвестное действие: ' . $action]);
}
?>