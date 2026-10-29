<?php
$container = require __DIR__ . '/../bootstrap/app.php';
$router = new App\Core\Router($container);

// Public routes
$router->get('/login', 'AuthController@showLogin', [App\Middleware\GuestMiddleware::class]);
$router->post('/login', 'AuthController@login', [App\Middleware\GuestMiddleware::class]);
$router->get('/logout', 'AuthController@logout', [App\Middleware\AuthMiddleware::class]);

// Admin routes (защищены)
$router->get('/admin', 'EditorController@index', [App\Middleware\AuthMiddleware::class]);
$router->get('/admin/visual-editor.php', 'EditorController@index', [App\Middleware\AuthMiddleware::class]);

// API routes (для редактора)
$router->post('/admin/editor-api.php', function() use ($container) {
    $api = new App\Controllers\ApiController($container);
    $action = $_POST['action'] ?? '';
    
    switch ($action) {
        case 'get_pages':
            $api->getPages();
            break;
        case 'load_page':
            $api->loadPage();
            break;
        case 'save_layout':
            $api->saveLayout();
            break;
        case 'publish_page':
            $api->publishPage();
            break;
        case 'upload_image':
            $api->uploadImage();
            break;
        default:
            $api->json(['success' => false, 'error' => 'Unknown action'], 400);
    }
}, [App\Middleware\AuthMiddleware::class]);

// Redirect root to login or admin
$router->get('/', function() {
    redirect('/login');
});
// Экспорт
$router->get('/api/export', function() use ($container) {
    $api = new App\Controllers\ApiController($container);
    $api->exportPage();
}, [App\Middleware\AuthMiddleware::class]);

// Превью
$router->get('/preview/{page_id}', function($page_id) use ($container) {
    $controller = new App\Controllers\PreviewController($container);
    $controller->show($page_id);
}, [App\Middleware\AuthMiddleware::class]);
return $router;
