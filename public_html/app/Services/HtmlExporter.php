<?php
namespace App\Services;

/**
 * HtmlExporter — Генерация чистой HTML-страницы из page_data
 */
class HtmlExporter
{
    private array $data;
    private string $pageTitle;
    private string $containerWidth;
    private array $globalStyles;

    public function __construct(array $pageData, string $pageTitle = 'Страница')
    {
        $this->data = $pageData;
        $this->pageTitle = $pageTitle;
        $this->globalStyles = $pageData['global'] ?? [];
        $this->containerWidth = $this->globalStyles['container_width'] ?? '1280px';
    }

    /**
     * Генерация полного HTML-документа
     */
    public function generate(): string
    {
        $blocksHtml = $this->renderBlocks();
        $css = $this->generateCSS();
        $js = $this->generateJS();

        return <<<HTML
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$this->escapeHtml($this->pageTitle)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        /* ===== ГЛОБАЛЬНЫЕ СТИЛИ ===== */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: {$this->globalStyles['font_family'] ?? 'Inter, sans-serif'};
            background: {$this->globalStyles['body_bg'] ?? '#0f0f1a'};
            color: #e2e8f0;
            padding: 20px;
        }
        .container {
            max-width: {$this->containerWidth};
            margin: 0 auto;
        }
        .ve-block {
            margin-bottom: 20px;
            border-radius: 12px;
            transition: all 0.2s;
        }
        .ve-block-hero .ve-hero-title {
            font-size: 48px;
            font-weight: 800;
            margin-bottom: 20px;
        }
        .ve-block-hero .ve-hero-subtitle {
            font-size: 18px;
            opacity: 0.8;
            margin-bottom: 30px;
        }
        .ve-block-hero .ve-hero-button {
            display: inline-block;
            padding: 12px 28px;
            background: {$this->globalStyles['accent_color'] ?? '#8b5cf6'};
            color: white;
            border-radius: 30px;
            text-decoration: none;
            font-weight: 600;
            transition: 0.2s;
        }
        .ve-block-hero .ve-hero-button:hover {
            transform: translateY(-2px);
            opacity: 0.9;
        }
        .ve-block-hero .ve-hero-image img {
            max-width: 100%;
            border-radius: 12px;
            margin-bottom: 20px;
        }
        .ve-block-text .ve-text-editable {
            font-size: 16px;
            line-height: 1.6;
        }
        .ve-block-image img {
            max-width: 100%;
            border-radius: 8px;
        }
        .ve-block-button .ve-button {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 500;
            transition: 0.2s;
        }
        .ve-block-shape .ve-shape {
            margin: 0 auto;
        }
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
        .ve-block-slider .ve-slider-dot.active {
            background: {$this->globalStyles['accent_color'] ?? '#8b5cf6'};
        }
        .ve-block-gallery .ve-gallery-item img {
            transition: transform 0.3s;
        }
        .ve-block-gallery .ve-gallery-item img:hover {
            transform: scale(1.05);
        }
        .ve-block-counter .ve-counter {
            font-size: 32px;
            font-weight: 700;
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
        .ve-block-accordion .ve-accordion-header i {
            transition: transform 0.2s;
        }
        .ve-block-accordion .ve-accordion-content {
            display: none;
            padding: 16px;
            background: #12121a;
        }
        .ve-block-accordion .ve-accordion-content.open {
            display: block;
        }
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
            background: {$this->globalStyles['accent_color'] ?? '#8b5cf6'};
            color: white;
            border: none;
        }
        .ve-block-tabs .ve-tab-content {
            display: none;
            padding: 16px;
            background: #12121a;
            border-radius: 0 8px 8px 8px;
        }
        .ve-block-tabs .ve-tab-content.active {
            display: block;
        }
        .ve-block-product .product-card {
            background: #1a1a2e;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #2a2a3e;
        }
        .ve-block-product .product-card img {
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
        }
        .ve-block-product .product-card .product-content {
            padding: 16px;
        }
        .ve-block-product .product-card .product-title {
            margin: 0 0 8px;
            font-size: 16px;
        }
        .ve-block-product .product-card .product-price {
            font-size: 24px;
            font-weight: 700;
            color: {$this->globalStyles['accent_color'] ?? '#8b5cf6'};
            margin-bottom: 12px;
        }
        .ve-block-product .product-card .product-btn {
            width: 100%;
            padding: 10px;
            background: {$this->globalStyles['accent_color'] ?? '#8b5cf6'};
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            font-weight: 600;
            transition: 0.2s;
        }
        .ve-block-product .product-card .product-btn:hover {
            opacity: 0.8;
        }
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
        /* ===== УТИЛИТЫ ===== */
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
    </style>
    {$css}
</head>
<body>
    <div class="container">
        {$blocksHtml}
    </div>
    {$js}
    <script>
        // Инициализация интерактивных элементов
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
                container.querySelector('.ve-slider-arrow.prev')?.addEventListener('click', function() {
                    showSlide((current - 1 + slides.length) % slides.length);
                });
                container.querySelector('.ve-slider-arrow.next')?.addEventListener('click', function() {
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
    </script>
</body>
</html>
HTML;
    }

    /**
     * Рендеринг всех блоков
     */
    private function renderBlocks(): string
    {
        $blocks = $this->data['blocks'] ?? [];
        if (empty($blocks)) {
            return '<div class="ve-empty-state"><i class="fas fa-plus-circle"></i><p>Нет блоков</p></div>';
        }

        $html = '';
        foreach ($blocks as $block) {
            $html .= $this->renderSingleBlock($block);
        }
        return $html;
    }

    /**
     * Рендеринг одного блока (используется тот же подход, что и в JS)
     */
    private function renderSingleBlock(array $block): string
    {
        $type = $block['type'] ?? 'text';
        $content = $block['content'] ?? [];
        $styles = $block['styles'] ?? [];
        $styleStr = $this->stylesToString($styles);

        switch ($type) {
            case 'hero':
                return $this->renderHero($block, $content, $styles, $styleStr);
            case 'text':
                return $this->renderText($block, $content, $styles, $styleStr);
            case 'image':
                return $this->renderImage($block, $content, $styles, $styleStr);
            case 'button':
                return $this->renderButton($block, $content, $styles, $styleStr);
            case 'shape':
                return $this->renderShape($block, $content, $styles, $styleStr);
            case 'slider':
                return $this->renderSlider($block, $content, $styles, $styleStr);
            case 'video':
                return $this->renderVideo($block, $content, $styles, $styleStr);
            case 'map':
                return $this->renderMap($block, $content, $styles, $styleStr);
            case 'gallery':
                return $this->renderGallery($block, $content, $styles, $styleStr);
            case 'counter':
                return $this->renderCounter($block, $content, $styles, $styleStr);
            case 'accordion':
                return $this->renderAccordion($block, $content, $styles, $styleStr);
            case 'tabs':
                return $this->renderTabs($block, $content, $styles, $styleStr);
            case 'reviews':
                return $this->renderReviews($block, $content, $styles, $styleStr);
            case 'product':
                return $this->renderProduct($block, $content, $styles, $styleStr);
            case 'progress':
                return $this->renderProgress($block, $content, $styles, $styleStr);
            case 'container':
                return $this->renderContainer($block, $content, $styles, $styleStr);
            case 'row':
                return $this->renderRow($block, $content, $styles, $styleStr);
            default:
                return '<div class="ve-block ve-block-error">Неизвестный блок: ' . $this->escapeHtml($type) . '</div>';
        }
    }

    /**
     * Преобразование массива стилей в строку CSS
     */
    private function stylesToString(array $styles): string
    {
        $map = [
            'padding' => 'padding',
            'bg_color' => 'background',
            'color' => 'color',
            'text_color' => 'color',
            'font_size' => 'font-size',
            'font_family' => 'font-family',
            'alignment' => 'text-align',
            'border_radius' => 'border-radius',
            'border' => 'border',
            'min_height' => 'min-height',
            'gap' => 'gap',
        ];
        $result = [];
        foreach ($styles as $key => $value) {
            if (isset($map[$key]) && $value !== null && $value !== '') {
                $result[] = $map[$key] . ': ' . $value;
            }
        }
        return implode('; ', $result);
    }

    // ========== РЕНДЕР БЛОКОВ ==========

    private function renderHero(array $block, array $content, array $styles, string $styleStr): string
    {
        $title = $this->escapeHtml($content['title'] ?? 'Заголовок');
        $subtitle = $this->escapeHtml($content['subtitle'] ?? 'Подзаголовок');
        $buttonText = $this->escapeHtml($content['button_text'] ?? 'Кнопка');
        $buttonLink = $this->escapeHtml($content['button_link'] ?? '#');
        $image = isset($content['image']) ? '<div class="ve-hero-image"><img src="' . $this->escapeHtml($content['image']) . '" alt="Hero"></div>' : '';
        $id = $block['id'] ?? '';

        return <<<HTML
<div class="ve-block ve-block-hero" data-id="{$id}" style="{$styleStr}">
    <div class="ve-hero-inner">
        {$image}
        <h1 class="ve-hero-title">{$title}</h1>
        <p class="ve-hero-subtitle">{$subtitle}</p>
        <a href="{$buttonLink}" class="ve-hero-button">{$buttonText}</a>
    </div>
</div>
HTML;
    }

    private function renderText(array $block, array $content, array $styles, string $styleStr): string
    {
        $text = $this->escapeHtml($content['text'] ?? 'Введите ваш текст здесь...');
        $id = $block['id'] ?? '';
        return <<<HTML
<div class="ve-block ve-block-text" data-id="{$id}" style="{$styleStr}">
    <div class="ve-text-editable">{$text}</div>
</div>
HTML;
    }

    private function renderImage(array $block, array $content, array $styles, string $styleStr): string
    {
        $url = $this->escapeHtml($content['image_url'] ?? '/uploads/placeholder.jpg');
        $alt = $this->escapeHtml($content['alt'] ?? '');
        $id = $block['id'] ?? '';
        $radius = $styles['border_radius'] ?? '8px';
        return <<<HTML
<div class="ve-block ve-block-image" data-id="{$id}" style="{$styleStr}">
    <img src="{$url}" alt="{$alt}" style="max-width:100%;border-radius:{$radius};">
</div>
HTML;
    }

    private function renderButton(array $block, array $content, array $styles, string $styleStr): string
    {
        $text = $this->escapeHtml($content['text'] ?? 'Кнопка');
        $link = $this->escapeHtml($content['link'] ?? '#');
        $bgColor = $content['bg_color'] ?? '#8b5cf6';
        $hoverColor = $content['hover_color'] ?? '#7c3aed';
        $radius = $content['border_radius'] ?? '12px';
        $color = $styles['color'] ?? '#ffffff';
        $fontSize = $styles['font_size'] ?? '14px';
        $id = $block['id'] ?? '';

        return <<<HTML
<div class="ve-block ve-block-button" data-id="{$id}" style="{$styleStr}">
    <a href="{$link}" class="ve-button" style="background:{$bgColor};color:{$color};border-radius:{$radius};padding:12px 24px;text-decoration:none;display:inline-block;font-size:{$fontSize};font-weight:500;transition:background 0.2s;"
       onmouseover="this.style.background='{$hoverColor}'" onmouseout="this.style.background='{$bgColor}'">
        {$text}
    </a>
</div>
HTML;
    }

    private function renderShape(array $block, array $content, array $styles, string $styleStr): string
    {
        $shape = $content['shape'] ?? 'square';
        $size = $content['size'] ?? 120;
        $bgColor = $content['bg_color'] ?? '#8b5cf6';
        $radius = $content['border_radius'] ?? '12px';
        $id = $block['id'] ?? '';

        $shapeCss = '';
        switch ($shape) {
            case 'circle': $shapeCss = 'border-radius:50%;'; break;
            case 'triangle': $shapeCss = 'clip-path: polygon(50% 0%, 0% 100%, 100% 100%);'; break;
            case 'diamond': $shapeCss = 'clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);'; break;
            case 'star': $shapeCss = 'clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);'; break;
            default: $shapeCss = "border-radius:{$radius};";
        }

        return <<<HTML
<div class="ve-block ve-block-shape" data-id="{$id}" style="{$styleStr}">
    <div class="ve-shape" style="width:{$size}px;height:{$size}px;background:{$bgColor};{$shapeCss}margin:0 auto;"></div>
</div>
HTML;
    }

    private function renderSlider(array $block, array $content, array $styles, string $styleStr): string
    {
        $slides = $content['slides'] ?? [
            ['image' => 'https://picsum.photos/800/400?random=1', 'title' => 'Слайд 1', 'text' => 'Описание слайда 1'],
            ['image' => 'https://picsum.photos/800/400?random=2', 'title' => 'Слайд 2', 'text' => 'Описание слайда 2']
        ];
        $id = $block['id'] ?? '';

        $slidesHtml = '';
        foreach ($slides as $idx => $slide) {
            $display = $idx === 0 ? 'block' : 'none';
            $slidesHtml .= <<<HTML
<div class="ve-slide" data-index="{$idx}" style="display:{$display};">
    <img src="{$this->escapeHtml($slide['image'])}" alt="{$this->escapeHtml($slide['title'])}" style="width:100%;border-radius:12px;">
    <div class="ve-slide-content">
        <h3>{$this->escapeHtml($slide['title'])}</h3>
        <p>{$this->escapeHtml($slide['text'])}</p>
    </div>
</div>
HTML;
        }

        $dotsHtml = '';
        foreach ($slides as $idx => $slide) {
            $active = $idx === 0 ? ' active' : '';
            $dotsHtml .= '<span class="ve-slider-dot' . $active . '" data-index="' . $idx . '"></span>';
        }

        return <<<HTML
<div class="ve-block ve-block-slider" data-id="{$id}" style="{$styleStr}">
    <div class="ve-slider-container" style="position:relative;overflow:hidden;border-radius:12px;">
        {$slidesHtml}
        <button class="ve-slider-arrow prev">‹</button>
        <button class="ve-slider-arrow next">›</button>
        <div class="ve-slider-dots">{$dotsHtml}</div>
    </div>
</div>
HTML;
    }

    private function renderVideo(array $block, array $content, array $styles, string $styleStr): string
    {
        $url = $content['url'] ?? 'https://www.youtube.com/embed/dQw4w9WgXcQ';
        if (strpos($url, 'youtube.com/watch?v=') !== false) {
            $videoId = explode('v=', $url)[1] ?? '';
            $videoId = explode('&', $videoId)[0] ?? '';
            if ($videoId) $url = 'https://www.youtube.com/embed/' . $videoId;
        } elseif (strpos($url, 'youtu.be/') !== false) {
            $videoId = explode('youtu.be/', $url)[1] ?? '';
            $videoId = explode('?', $videoId)[0] ?? '';
            if ($videoId) $url = 'https://www.youtube.com/embed/' . $videoId;
        }
        $id = $block['id'] ?? '';

        return <<<HTML
<div class="ve-block ve-block-video" data-id="{$id}" style="{$styleStr}">
    <div style="position:relative;padding-bottom:56.25%;height:0;max-width:100%;">
        <iframe src="{$this->escapeHtml($url)}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:12px;" allowfullscreen></iframe>
    </div>
</div>
HTML;
    }

    private function renderMap(array $block, array $content, array $styles, string $styleStr): string
    {
        $lat = $content['lat'] ?? '55.751244';
        $lng = $content['lng'] ?? '37.618423';
        $zoom = $content['zoom'] ?? 12;
        $id = $block['id'] ?? '';
        $key = 'AIzaSyBFj0YbrH6v2kGdD6y3sp9yw5UKyxUVH5I'; // Замените на свой ключ

        return <<<HTML
<div class="ve-block ve-block-map" data-id="{$id}" style="{$styleStr}">
    <iframe src="https://www.google.com/maps/embed/v1/view?key={$key}&center={$lat},{$lng}&zoom={$zoom}" 
            style="width:100%;height:300px;border:none;border-radius:12px;" allowfullscreen></iframe>
</div>
HTML;
    }

    private function renderGallery(array $block, array $content, array $styles, string $styleStr): string
    {
        $images = $content['images'] ?? [
            'https://picsum.photos/200/150?random=1',
            'https://picsum.photos/200/150?random=2',
            'https://picsum.photos/200/150?random=3',
            'https://picsum.photos/200/150?random=4'
        ];
        $cols = $styles['columns'] ?? 4;
        $id = $block['id'] ?? '';

        $gridHtml = '';
        foreach ($images as $img) {
            $gridHtml .= '<div class="ve-gallery-item" style="overflow:hidden;border-radius:8px;aspect-ratio:1;"><img src="' . $this->escapeHtml($img) . '" style="width:100%;height:100%;object-fit:cover;"></div>';
        }

        return <<<HTML
<div class="ve-block ve-block-gallery" data-id="{$id}" style="{$styleStr}">
    <div style="display:grid;grid-template-columns:repeat({$cols},1fr);gap:16px;">
        {$gridHtml}
    </div>
</div>
HTML;
    }

    private function renderCounter(array $block, array $content, array $styles, string $styleStr): string
    {
        $start = $content['start'] ?? 0;
        $end = $content['end'] ?? 100;
        $speed = $content['speed'] ?? 2;
        $prefix = $this->escapeHtml($content['prefix'] ?? '');
        $suffix = $this->escapeHtml($content['suffix'] ?? '%');
        $color = $content['color'] ?? '#8b5cf6';
        $fontSize = $styles['font_size'] ?? '32px';
        $id = $block['id'] ?? '';

        return <<<HTML
<div class="ve-block ve-block-counter" data-id="{$id}" style="{$styleStr}">
    <div class="ve-counter" data-start="{$start}" data-end="{$end}" data-speed="{$speed}" style="font-size:{$fontSize};font-weight:700;color:{$color};">
        {$prefix}<span class="counter-number">{$start}</span>{$suffix}
    </div>
</div>
HTML;
    }

    private function renderAccordion(array $block, array $content, array $styles, string $styleStr): string
    {
        $items = $content['items'] ?? [
            ['title' => 'Вопрос 1', 'content' => 'Ответ на вопрос 1'],
            ['title' => 'Вопрос 2', 'content' => 'Ответ на вопрос 2']
        ];
        $id = $block['id'] ?? '';

        $itemsHtml = '';
        foreach ($items as $item) {
            $itemsHtml .= <<<HTML
<div class="ve-accordion-item">
    <div class="ve-accordion-header">
        <span>{$this->escapeHtml($item['title'])}</span>
        <i class="fas fa-chevron-down"></i>
    </div>
    <div class="ve-accordion-content">{$this->escapeHtml($item['content'])}</div>
</div>
HTML;
        }

        return <<<HTML
<div class="ve-block ve-block-accordion" data-id="{$id}" style="{$styleStr}">
    <div class="ve-accordion-container">
        {$itemsHtml}
    </div>
</div>
HTML;
    }

    private function renderTabs(array $block, array $content, array $styles, string $styleStr): string
    {
        $tabs = $content['tabs'] ?? [
            ['title' => 'Вкладка 1', 'content' => 'Содержимое вкладки 1'],
            ['title' => 'Вкладка 2', 'content' => 'Содержимое вкладки 2']
        ];
        $id = $block['id'] ?? '';

        $tabsHtml = '';
        $contentsHtml = '';
        foreach ($tabs as $idx => $tab) {
            $active = $idx === 0 ? ' active' : '';
            $tabsHtml .= '<button class="ve-tab' . $active . '" data-tab="' . $idx . '">' . $this->escapeHtml($tab['title']) . '</button>';
            $display = $idx === 0 ? 'block' : 'none';
            $contentsHtml .= '<div class="ve-tab-content' . $active . '" data-tab="' . $idx . '" style="display:' . $display . ';">' . $this->escapeHtml($tab['content']) . '</div>';
        }

        return <<<HTML
<div class="ve-block ve-block-tabs" data-id="{$id}" style="{$styleStr}">
    <div class="ve-tabs-container">
        <div style="display:flex;gap:4px;flex-wrap:wrap;border-bottom:2px solid #2a2a3e;">
            {$tabsHtml}
        </div>
        <div style="margin-top:-2px;">
            {$contentsHtml}
        </div>
    </div>
</div>
HTML;
    }

    private function renderReviews(array $block, array $content, array $styles, string $styleStr): string
    {
        $items = $content['items'] ?? [
            ['name' => 'Анна Иванова', 'rating' => 5, 'text' => 'Отличный сервис! Очень довольна результатом.'],
            ['name' => 'Михаил Петров', 'rating' => 4, 'text' => 'Хорошо, но есть куда расти.']
        ];
        $id = $block['id'] ?? '';

        $itemsHtml = '';
        foreach ($items as $item) {
            $stars = str_repeat('★', $item['rating']) . str_repeat('☆', 5 - $item['rating']);
            $itemsHtml .= <<<HTML
<div style="padding:16px;background:#1a1a2e;border-radius:12px;margin-bottom:12px;border:1px solid #2a2a3e;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong>{$this->escapeHtml($item['name'])}</strong>
        <span style="color:#fbbf24;">{$stars}</span>
    </div>
    <p style="color:#94a3b8;margin:0;">{$this->escapeHtml($item['text'])}</p>
</div>
HTML;
        }

        return <<<HTML
<div class="ve-block ve-block-reviews" data-id="{$id}" style="{$styleStr}">
    <div class="ve-reviews-container">
        {$itemsHtml}
    </div>
</div>
HTML;
    }

    private function renderProduct(array $block, array $content, array $styles, string $styleStr): string
    {
        $image = $this->escapeHtml($content['image'] ?? 'https://picsum.photos/300/200?random=1');
        $title = $this->escapeHtml($content['title'] ?? 'Название товара');
        $price = $this->escapeHtml($content['price'] ?? '1000');
        $buttonText = $this->escapeHtml($content['buttonText'] ?? 'Купить');
        $id = $block['id'] ?? '';
        $accent = $this->globalStyles['accent_color'] ?? '#8b5cf6';

        return <<<HTML
<div class="ve-block ve-block-product" data-id="{$id}" style="{$styleStr}">
    <div class="product-card" style="max-width:320px;margin:0 auto;">
        <img src="{$image}" alt="{$title}">
        <div class="product-content">
            <h3 class="product-title">{$title}</h3>
            <div class="product-price">{$price} ₽</div>
            <button class="product-btn" style="background:{$accent};">{$buttonText}</button>
        </div>
    </div>
</div>
HTML;
    }

    private function renderProgress(array $block, array $content, array $styles, string $styleStr): string
    {
        $value = $content['value'] ?? 50;
        $max = $content['max'] ?? 100;
        $color = $content['color'] ?? '#8b5cf6';
        $label = $this->escapeHtml($content['label'] ?? 'Прогресс');
        $percent = min(100, ($value / $max) * 100);
        $id = $block['id'] ?? '';

        return <<<HTML
<div class="ve-block ve-block-progress" data-id="{$id}" style="{$styleStr}">
    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span>{$label}</span>
        <span>{$percent}%</span>
    </div>
    <div class="progress-bar">
        <div class="progress-fill" style="width:{$percent}%;background:{$color};"></div>
    </div>
</div>
HTML;
    }

    private function renderContainer(array $block, array $content, array $styles, string $styleStr): string
    {
        $children = $content['blocks'] ?? [];
        $id = $block['id'] ?? '';
        $childrenHtml = '';
        foreach ($children as $child) {
            $childrenHtml .= $this->renderSingleBlock($child);
        }

        return <<<HTML
<div class="ve-block ve-block-container" data-id="{$id}" style="{$styleStr}">
    <div class="container-children">
        {$childrenHtml}
    </div>
</div>
HTML;
    }

    private function renderRow(array $block, array $content, array $styles, string $styleStr): string
    {
        $columns = $content['columns'] ?? [[], []];
        $id = $block['id'] ?? '';
        $gap = $styles['gap'] ?? '20px';

        $colsHtml = '';
        foreach ($columns as $col) {
            $colHtml = '';
            foreach ($col as $child) {
                $colHtml .= $this->renderSingleBlock($child);
            }
            $colsHtml .= '<div class="row-col">' . ($colHtml ?: '<div style="padding:20px;color:#64748b;text-align:center;background:rgba(139,92,246,0.05);border-radius:8px;">Колонка пуста</div>') . '</div>';
        }

        return <<<HTML
<div class="ve-block ve-block-row" data-id="{$id}" style="{$styleStr}">
    <div class="row-cols" style="margin:0 -10px;gap:{$gap};">
        {$colsHtml}
    </div>
</div>
HTML;
    }

    /**
     * Экранирование HTML
     */
    private function escapeHtml(string $str): string
    {
        return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
    }
}