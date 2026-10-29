<?php
namespace App\Controllers;

use App\Models\PageLayout;

class EditorController
{
    private $container;

    public function __construct($container)
    {
        $this->container = $container;
    }

    public function index()
    {
        $pageId = $_GET['page_id'] ?? 0;
        $pageLayout = new PageLayout($this->container['db']);
        $pages = $pageLayout->getPagesList();
        
        // Данные для редактора (ваш существующий visual-editor.php будет использовать эти переменные)
        // Но поскольку visual-editor.php у нас уже самодостаточный, мы просто подключаем его
        
        // Передаём данные в глобальную область для visual-editor.php
        global $db, $page_data, $current_page, $page_id;
        $db = $this->container['db']->getConnection();
        
        // Загрузка данных страницы
        $stmt = $db->prepare("SELECT data FROM page_layout WHERE page_id = ?");
        $stmt->execute([$pageId]);
        $layout = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$layout) {
            $default_data = json_encode([
                'blocks' => [],
                'global' => ['font_family' => 'Inter, sans-serif', 'accent_color' => '#8b5cf6', 'body_bg' => '#0f0f1a', 'container_width' => '1280px'],
                'templates' => []
            ]);
            $page_data = json_decode($default_data, true);
        } else {
            $page_data = json_decode($layout['data'], true);
        }
        
        $stmt = $db->prepare("SELECT title, slug FROM pages WHERE id = ?");
        $stmt->execute([$pageId]);
        $current_page = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$current_page) $current_page = ['title' => 'Страница', 'slug' => ''];
        $page_id = $pageId;
        
        // Подключаем визуальный редактор
        require_once __DIR__ . '/../../views/editor/index.php';
    }
}