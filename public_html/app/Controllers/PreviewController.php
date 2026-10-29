<?php
namespace App\Controllers;

use App\Models\PageLayout;
use App\Services\HtmlExporter;

class PreviewController
{
    private $container;

    public function __construct($container)
    {
        $this->container = $container;
    }

    public function show($pageId)
    {
        // Проверка авторизации
        $auth = $this->container['auth'];
        if (!$auth->isLoggedIn()) {
            redirect('/login');
            return;
        }

        $pageLayout = new PageLayout($this->container['db']);
        $layout = $pageLayout->getByPageId($pageId);
        if (!$layout) {
            http_response_code(404);
            echo 'Страница не найдена';
            return;
        }

        $pageData = json_decode($layout['data'], true) ?: ['blocks' => []];
        
        // Получаем название страницы
        $stmt = $this->container['db']->getConnection()->prepare("SELECT title FROM pages WHERE id = ?");
        $stmt->execute([$pageId]);
        $pageTitle = $stmt->fetchColumn() ?: 'Превью';

        // Генерируем HTML через экспортёр
        $exporter = new HtmlExporter($pageData, $pageTitle);
        $html = $exporter->generate();

        // Добавляем метку "Превью" вверху
        $html = str_replace(
            '<body>',
            '<body><div style="background:#8b5cf6;color:white;padding:8px 16px;text-align:center;font-size:13px;position:sticky;top:0;z-index:1000;">📎 РЕЖИМ ПРЕВЬЮ — <a href="/dashboard" style="color:white;text-decoration:underline;">Вернуться в редактор</a></div>',
            $html
        );

        echo $html;
    }
}