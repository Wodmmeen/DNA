/**
 * Экспорт страницы в HTML + ZIP
 */
public function exportPage()
{
    $this->requireAuth();
    $pageId = (int)($_GET['page_id'] ?? 0);
    if (!$pageId) {
        $this->json(['success' => false, 'error' => 'Page ID required'], 400);
        return;
    }

    $pageLayout = new \App\Models\PageLayout($this->container['db']);
    $layout = $pageLayout->getByPageId($pageId);
    if (!$layout) {
        $this->json(['success' => false, 'error' => 'Page not found'], 404);
        return;
    }

    $pageData = json_decode($layout['data'], true) ?: ['blocks' => []];
    
    // Получаем название страницы
    $stmt = $this->container['db']->getConnection()->prepare("SELECT title FROM pages WHERE id = ?");
    $stmt->execute([$pageId]);
    $pageTitle = $stmt->fetchColumn() ?: 'Страница';

    // Генерируем HTML
    $exporter = new \App\Services\HtmlExporter($pageData, $pageTitle);
    $html = $exporter->generate();

    // Создаём ZIP-архив
    $zip = new \ZipArchive();
    $zipName = tempnam(sys_get_temp_dir(), 'export_') . '.zip';
    if ($zip->open($zipName, \ZipArchive::CREATE) !== true) {
        $this->json(['success' => false, 'error' => 'Cannot create ZIP'], 500);
        return;
    }

    $zip->addFromString('index.html', $html);
    $zip->addFromString('style.css', $this->generateExportCSS($pageData));
    $zip->addFromString('script.js', $this->generateExportJS($pageData));
    $zip->close();

    // Отдаём файл
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="page_' . $pageId . '_export.zip"');
    header('Content-Length: ' . filesize($zipName));
    readfile($zipName);
    unlink($zipName);
    exit;
}

/**
 * Генерация CSS для экспорта
 */
private function generateExportCSS(array $pageData): string
{
    $global = $pageData['global'] ?? [];
    $accent = $global['accent_color'] ?? '#8b5cf6';
    $font = $global['font_family'] ?? 'Inter, sans-serif';
    $bg = $global['body_bg'] ?? '#0f0f1a';
    $width = $global['container_width'] ?? '1280px';

    return <<<CSS
/* ===== ГЛОБАЛЬНЫЕ СТИЛИ ===== */
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: {$font};
    background: {$bg};
    color: #e2e8f0;
    padding: 20px;
}
.container {
    max-width: {$width};
    margin: 0 auto;
}
.ve-block { margin-bottom: 20px; border-radius: 12px; }
.ve-block-hero .ve-hero-title { font-size: 48px; font-weight: 800; margin-bottom: 20px; }
.ve-block-hero .ve-hero-subtitle { font-size: 18px; opacity: 0.8; margin-bottom: 30px; }
.ve-block-hero .ve-hero-button {
    display: inline-block;
    padding: 12px 28px;
    background: {$accent};
    color: white;
    border-radius: 30px;
    text-decoration: none;
    font-weight: 600;
    transition: 0.2s;
}
.ve-block-hero .ve-hero-button:hover { transform: translateY(-2px); opacity: 0.9; }
.ve-block-text .ve-text-editable { font-size: 16px; line-height: 1.6; }
.ve-block-image img { max-width: 100%; border-radius: 8px; }
.ve-block-button .ve-button {
    display: inline-block;
    padding: 12px 24px;
    border-radius: 12px;
    text-decoration: none;
    font-weight: 500;
    transition: 0.2s;
}
.ve-block-shape .ve-shape { margin: 0 auto; }
.ve-block-slider .ve-slide-content {
    padding: 16px;
    background: rgba(0,0,0,0.5);
    color: white;
    margin-top: -60px;
    position: relative;
    z-index: 1;
    border-radius: 0 0 12px 12px;
}
.ve-block-slider .ve-slider-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0,0,0,0.5);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    z-index: 10;
    font-size: 20px;
}
.ve-block-slider .ve-slider-arrow.prev { left: 10px; }
.ve-block-slider .ve-slider-arrow.next { right: 10px; }
.ve-block-slider .ve-slider-dots {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 10;
}
.ve-block-slider .ve-slider-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255,255,255,0.5);
    cursor: pointer;
}
.ve-block-slider .ve-slider-dot.active { background: {$accent}; }
.ve-block-product .product-card {
    background: #1a1a2e;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #2a2a3e;
}
.ve-block-product .product-card img { width: 100%; aspect-ratio: 1; object-fit: cover; }
.ve-block-product .product-card .product-content { padding: 16px; }
.ve-block-product .product-card .product-title { margin: 0 0 8px; font-size: 16px; }
.ve-block-product .product-card .product-price {
    font-size: 24px;
    font-weight: 700;
    color: {$accent};
    margin-bottom: 12px;
}
.ve-block-product .product-card .product-btn {
    width: 100%;
    padding: 10px;
    background: {$accent};
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    font-weight: 600;
    transition: 0.2s;
}
.ve-block-product .product-card .product-btn:hover { opacity: 0.8; }
.ve-block-progress .progress-bar {
    background: #2a2a3e;
    border-radius: 20px;
    height: 24px;
    overflow: hidden;
}
.ve-block-progress .progress-bar .progress-fill {
    height: 100%;
    border-radius: 20px;
    transition: width 0.3s ease;
}
.ve-block-accordion .ve-accordion-item {
    border: 1px solid #2a2a3e;
    border-radius: 8px;
    margin-bottom: 8px;
    overflow: hidden;
}
.ve-block-accordion .ve-accordion-header {
    padding: 12px 16px;
    background: #1a1a2e;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    user-select: none;
}
.ve-block-accordion .ve-accordion-content {
    display: none;
    padding: 16px;
    background: #12121a;
}
.ve-block-accordion .ve-accordion-content.open { display: block; }
.ve-block-tabs .ve-tab {
    padding: 10px 20px;
    background: transparent;
    border: 1px solid #2a2a3e;
    border-radius: 8px 8px 0 0;
    color: #94a3b8;
    cursor: pointer;
    transition: 0.2s;
}
.ve-block-tabs .ve-tab.active {
    background: {$accent};
    color: white;
    border: none;
}
.ve-block-tabs .ve-tab-content {
    display: none;
    padding: 16px;
    background: #12121a;
    border-radius: 0 8px 8px 8px;
}
.ve-block-tabs .ve-tab-content.active { display: block; }
.ve-block-counter .ve-counter { font-size: 32px; font-weight: 700; }
.ve-block-gallery .ve-gallery-item img { transition: transform 0.3s; }
.ve-block-gallery .ve-gallery-item img:hover { transform: scale(1.05); }
.ve-block-container {
    border: 1px dashed #2a2a3e;
    border-radius: 12px;
    min-height: 100px;
}
.ve-block-container .container-children {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}
.ve-block-row .row-cols {
    display: flex;
    flex-wrap: wrap;
    margin: 0 -10px;
}
.ve-block-row .row-cols .row-col {
    flex: 1;
    min-width: 200px;
    padding: 0 10px;
}
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.ve-empty-state {
    text-align: center;
    padding: 80px;
    color: #64748b;
}
.ve-empty-state i {
    font-size: 48px;
    display: block;
    margin-bottom: 16px;
    opacity: 0.3;
}
CSS;
}

/**
 * Генерация JS для экспорта
 */
private function generateExportJS(array $pageData): string
{
    return <<<JS
// Интерактивные элементы
document.addEventListener('DOMContentLoaded', function() {
    // Слайдеры
    document.querySelectorAll('.ve-block-slider .ve-slider-container').forEach(function(container) {
        const slides = container.querySelectorAll('.ve-slide');
        const dots = container.querySelectorAll('.ve-slider-dot');
        let current = 0;
        const showSlide = function(index) {
            slides.forEach(s => s.style.display = 'none');
            dots.forEach(d => d.classList.remove('active'));
            slides[index].style.display = 'block';
            dots[index].classList.add('active');
            current = index;
        };
        slides.forEach((s, i) => s.style.display = i === 0 ? 'block' : 'none');
        dots.forEach((d, i) => {
            d.addEventListener('click', function() { showSlide(i); });
        });
        container.querySelector('.ve-slider-arrow.prev').addEventListener('click', function() {
            showSlide((current - 1 + slides.length) % slides.length);
        });
        container.querySelector('.ve-slider-arrow.next').addEventListener('click', function() {
            showSlide((current + 1) % slides.length);
        });
    });
    
    // Аккордеоны
    document.querySelectorAll('.ve-block-accordion .ve-accordion-header').forEach(function(header) {
        header.addEventListener('click', function() {
            const content = this.closest('.ve-accordion-item').querySelector('.ve-accordion-content');
            const icon = this.querySelector('i');
            if (content.classList.contains('open')) {
                content.classList.remove('open');
                icon.style.transform = 'rotate(0deg)';
            } else {
                content.classList.add('open');
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });
    
    // Табы
    document.querySelectorAll('.ve-block-tabs').forEach(function(tabsContainer) {
        const tabs = tabsContainer.querySelectorAll('.ve-tab');
        const contents = tabsContainer.querySelectorAll('.ve-tab-content');
        tabs.forEach(function(tab, idx) {
            tab.addEventListener('click', function() {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                contents[idx].classList.add('active');
            });
        });
    });
    
    // Счётчики
    document.querySelectorAll('.ve-block-counter .ve-counter').forEach(function(el) {
        if (el.dataset.animated === 'true') return;
        el.dataset.animated = 'true';
        const start = parseInt(el.dataset.start) || 0;
        const end = parseInt(el.dataset.end) || 100;
        const speed = parseFloat(el.dataset.speed) || 2;
        const numberSpan = el.querySelector('.counter-number');
        let current = start;
        const step = Math.ceil((end - start) / (30 / speed));
        const interval = setInterval(function() {
            current += step;
            if (current >= end) { current = end; clearInterval(interval); }
            numberSpan.textContent = current;
        }, 1000 / speed);
    });
});
JS;
}