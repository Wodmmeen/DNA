// ui/sidebar.js
import { state, getBlock, selectBlock, saveComponent } from '../core/state.js';
import { renderCanvas, reRenderBlock } from '../core/renderer.js';
import { saveHistory } from '../core/history.js';
import { showToast } from './toolbar.js';
import { updatePropertiesPanel } from './properties.js';
import { blockRegistry, blockMetadata } from '../blocks/index.js';
import { openCustomBlockModal } from './customBlocks.js';

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem('ve_favorite_blocks') || '[]');
    } catch { return []; }
}

function toggleFavorite(type) {
    let favorites = getFavorites();
    if (favorites.includes(type)) {
        favorites = favorites.filter(t => t !== type);
    } else {
        favorites.push(type);
    }
    localStorage.setItem('ve_favorite_blocks', JSON.stringify(favorites));
    renderBlockList();
}

function isFavorite(type) {
    return getFavorites().includes(type);
}

export function renderBlockList() {
    const container = document.getElementById('blocksList');
    if (!container) {
        console.warn('⚠️ #blocksList не найден');
        return;
    }

    const favorites = getFavorites();
    const categories = {};
    for (const [type, meta] of Object.entries(blockMetadata)) {
        const category = meta.category || 'Другое';
        if (!categories[category]) categories[category] = [];
        categories[category].push({ type, ...meta });
    }

    const sortedCategories = Object.keys(categories).sort((a, b) => {
        if (a === 'Избранное') return -1;
        if (b === 'Избранное') return 1;
        return a.localeCompare(b);
    });

    let html = '';

    const favoriteBlocks = Object.values(blockMetadata).filter(meta => favorites.includes(meta.type));
    if (favoriteBlocks.length > 0) {
        html += `<div class="ve-block-category">
            <div class="category-header">
                <i class="fas fa-star" style="color:#fbbf24;"></i>
                <span>Избранное</span>
                <i class="fas fa-chevron-down category-arrow"></i>
            </div>
            <div class="category-blocks" style="display:block;">`;
        for (const block of favoriteBlocks) {
            html += renderBlockCard(block, true);
        }
        html += `</div></div>`;
    }

    for (const categoryName of sortedCategories) {
        if (categoryName === 'Избранное') continue;
        const blocks = categories[categoryName];
        html += `<div class="ve-block-category">
            <div class="category-header">
                <i class="fas ${getCategoryIcon(categoryName)}"></i>
                <span>${categoryName}</span>
                <i class="fas fa-chevron-down category-arrow"></i>
            </div>
            <div class="category-blocks">`;
        for (const block of blocks) {
            html += renderBlockCard(block, false);
        }
        html += `</div></div>`;
    }

    container.innerHTML = html;

    container.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', function(e) {
            e.stopPropagation();
            const blocksDiv = this.parentElement.querySelector('.category-blocks');
            const arrow = this.querySelector('.category-arrow');
            if (blocksDiv) {
                const isOpen = blocksDiv.style.display !== 'none';
                blocksDiv.style.display = isOpen ? 'none' : 'block';
                if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
            }
        });
        const blocksDiv = header.parentElement.querySelector('.category-blocks');
        if (blocksDiv) blocksDiv.style.display = 'none';
        const firstCategory = container.querySelector('.ve-block-category');
        if (firstCategory && header.parentElement === firstCategory) {
            blocksDiv.style.display = 'block';
            const arrow = header.querySelector('.category-arrow');
            if (arrow) arrow.style.transform = 'rotate(180deg)';
        }
    });

    container.querySelectorAll('.ve-block-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.ve-block-favorite')) return;
            const type = this.dataset.type;
            if (typeof window.addBlock === 'function') {
                window.addBlock(type);
            }
        });

        const star = card.querySelector('.ve-block-favorite');
        if (star) {
            star.addEventListener('click', function(e) {
                e.stopPropagation();
                const type = this.closest('.ve-block-card').dataset.type;
                toggleFavorite(type);
            });
        }

        card.addEventListener('mouseenter', function(e) {
            const type = this.dataset.type;
            showBlockPreview(type, this);
        });
        card.addEventListener('mouseleave', function() {
            hideBlockPreview();
        });

        card.addEventListener('mousedown', function(e) {
            if (e.target.closest('.ve-block-favorite')) return;
            if (typeof window.dragManager?.startFromPanel === 'function') {
                window.dragManager.startFromPanel(this, this.dataset.type);
            }
        });
    });
}

function renderBlockCard(block, favorite) {
    const fav = favorite || isFavorite(block.type);
    return `
        <div class="ve-block-card" data-type="${block.type}">
            <div class="ve-block-card-icon"><i class="fas ${block.icon}"></i></div>
            <span class="ve-block-card-name">${block.name}</span>
            <button class="ve-block-favorite ${fav ? 'active' : ''}" title="В избранное">
                <i class="fas fa-star"></i>
            </button>
        </div>
    `;
}

let previewTimeout = null;
let previewElement = null;

function showBlockPreview(type, cardElement) {
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(() => {
        if (previewElement) previewElement.remove();

        const BlockClass = blockRegistry[type];
        if (!BlockClass) {
            showSimplePreview(type, cardElement);
            return;
        }

        const testBlock = createTestBlock(type);
        if (!testBlock) {
            showSimplePreview(type, cardElement);
            return;
        }

        const instance = new BlockClass(testBlock);
        const html = instance.render();

        previewElement = document.createElement('div');
        previewElement.className = 've-block-preview';
        const rect = cardElement.getBoundingClientRect();
        const isNearRight = rect.right + 300 > window.innerWidth;

        previewElement.style.cssText = `
            position: fixed;
            left: ${isNearRight ? rect.left - 320 : rect.right + 16}px;
            top: ${Math.min(rect.top, window.innerHeight - 250)}px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 12px;
            box-shadow: var(--shadow-xl);
            z-index: 10000;
            max-width: 280px;
            min-width: 200px;
            pointer-events: none;
            animation: fadeIn 0.15s ease;
            backdrop-filter: blur(8px);
        `;

        previewElement.innerHTML = `
            <div style="font-size:10px;color:var(--text-tertiary);margin-bottom:6px;border-bottom:1px solid var(--border);padding-bottom:4px;">
                <i class="fas ${blockMetadata[type]?.icon || 'fa-cube'}"></i> ${blockMetadata[type]?.name || type}
            </div>
            <div class="ve-preview-content" style="transform:scale(0.7);transform-origin:top left;max-height:180px;overflow:hidden;border-radius:6px;">
                ${html}
            </div>
        `;
        document.body.appendChild(previewElement);
    }, 400);
}

function createTestBlock(type) {
    const id = 'preview_' + Date.now();
    const base = { id, type, content: {}, styles: { padding: '12px', bg_color: 'transparent', alignment: 'center' } };

    switch (type) {
        case 'hero':
            base.content = { title: 'Заголовок', subtitle: 'Подзаголовок', button_text: 'Кнопка', button_link: '#' };
            base.styles = { padding: '16px', bg_color: '#1a1a2e', alignment: 'center', text_color: '#ffffff' };
            break;
        case 'text':
            base.content = { text: 'Текст для превью' };
            base.styles = { padding: '8px', bg_color: 'transparent', alignment: 'left', color: '#e2e8f0', font_size: '12px' };
            break;
        case 'image':
            base.content = { image_url: 'https://picsum.photos/200/120', alt: 'Preview' };
            base.styles = { padding: '4px', bg_color: 'transparent', alignment: 'center' };
            break;
        case 'button':
            base.content = { text: 'Кнопка', link: '#', bg_color: '#8b5cf6', hover_color: '#7c3aed', border_radius: '8px' };
            base.styles = { padding: '8px', bg_color: 'transparent', alignment: 'center', color: '#ffffff', font_size: '11px' };
            break;
        case 'shape':
            base.content = { shape: 'square', size: 40, bg_color: '#8b5cf6', border_radius: '4px' };
            base.styles = { padding: '4px', bg_color: 'transparent', alignment: 'center' };
            break;
        case 'slider':
            base.content = {
                slides: [
                    { image: 'https://picsum.photos/200/100?random=1', title: 'Слайд 1', text: 'Описание' },
                    { image: 'https://picsum.photos/200/100?random=2', title: 'Слайд 2', text: 'Описание' }
                ]
            };
            base.styles = { padding: '4px', bg_color: 'transparent' };
            break;
        case 'video':
            base.content = { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' };
            base.styles = { padding: '4px', bg_color: 'transparent', alignment: 'center' };
            break;
        case 'map':
            base.content = { lat: '55.751244', lng: '37.618423', zoom: 12 };
            base.styles = { padding: '4px', bg_color: 'transparent', alignment: 'center' };
            break;
        case 'gallery':
            base.content = {
                images: [
                    'https://picsum.photos/100/100?random=1',
                    'https://picsum.photos/100/100?random=2',
                    'https://picsum.photos/100/100?random=3'
                ]
            };
            base.styles = { padding: '4px', bg_color: 'transparent', columns: 3 };
            break;
        case 'counter':
            base.content = { start: 0, end: 100, speed: 2, prefix: '', suffix: '%', color: '#8b5cf6' };
            base.styles = { padding: '8px', bg_color: 'transparent', alignment: 'center', font_size: '18px' };
            break;
        case 'accordion':
            base.content = {
                items: [
                    { title: 'Вопрос 1', content: 'Ответ 1' },
                    { title: 'Вопрос 2', content: 'Ответ 2' }
                ]
            };
            base.styles = { padding: '4px', bg_color: 'transparent' };
            break;
        case 'tabs':
            base.content = {
                tabs: [
                    { title: 'Вкладка 1', content: 'Содержимое 1' },
                    { title: 'Вкладка 2', content: 'Содержимое 2' }
                ]
            };
            base.styles = { padding: '4px', bg_color: 'transparent' };
            break;
        case 'reviews':
            base.content = {
                items: [
                    { name: 'Анна', rating: 5, text: 'Отлично!' },
                    { name: 'Михаил', rating: 4, text: 'Хорошо' }
                ]
            };
            base.styles = { padding: '4px', bg_color: 'transparent' };
            break;
        case 'product':
            base.content = { image: 'https://picsum.photos/100/100?random=1', title: 'Товар', price: '1000', buttonText: 'Купить' };
            base.styles = { padding: '4px', bg_color: 'transparent', alignment: 'center' };
            break;
        case 'progress':
            base.content = { label: 'Прогресс', value: 70, max: 100, color: '#8b5cf6' };
            base.styles = { padding: '4px', bg_color: 'transparent' };
            break;
        case 'container':
            base.content = { blocks: [] };
            base.styles = { padding: '4px', bg_color: 'transparent', border: '1px dashed #2a2a3e', min_height: '40px' };
            break;
        case 'row':
            base.content = { columns: [[], []] };
            base.styles = { padding: '4px', bg_color: 'transparent', gap: '4px' };
            break;
        default:
            const customBlocks = getCustomBlocks();
            const custom = customBlocks.find(b => b.id === type);
            if (custom) {
                return { id: type, type: type, content: { html: custom.html, css: custom.css, js: custom.js }, styles: { padding: '8px' } };
            }
            return null;
    }
    return base;
}

function showSimplePreview(type, cardElement) {
    const meta = blockMetadata[type];
    const rect = cardElement.getBoundingClientRect();
    const isNearRight = rect.right + 220 > window.innerWidth;

    previewElement = document.createElement('div');
    previewElement.className = 've-block-preview';
    previewElement.style.cssText = `
        position: fixed;
        left: ${isNearRight ? rect.left - 200 : rect.right + 16}px;
        top: ${Math.min(rect.top, window.innerHeight - 120)}px;
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 12px 16px;
        box-shadow: var(--shadow-xl);
        z-index: 10000;
        max-width: 180px;
        pointer-events: none;
        animation: fadeIn 0.15s ease;
        backdrop-filter: blur(8px);
    `;
    previewElement.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;color:var(--text-secondary);font-size:12px;">
            <i class="fas ${meta?.icon || 'fa-cube'}"></i>
            <span>${meta?.name || type}</span>
        </div>
        <div style="margin-top:6px;padding:8px;background:var(--bg-tertiary);border-radius:4px;text-align:center;font-size:11px;color:var(--text-tertiary);">
            <i class="fas ${meta?.icon || 'fa-cube'}" style="font-size:20px;display:block;margin-bottom:4px;color:var(--accent);"></i>
            Пример блока
        </div>
    `;
    document.body.appendChild(previewElement);
}

function hideBlockPreview() {
    clearTimeout(previewTimeout);
    if (previewElement) {
        previewElement.remove();
        previewElement = null;
    }
}

function getCategoryIcon(category) {
    const icons = {
        'Стандартные': 'fa-star',
        'Медиа': 'fa-photo-video',
        'Интерактив': 'fa-bolt',
        'Контейнеры': 'fa-layer-group',
        'Фигуры': 'fa-shapes',
        'Другое': 'fa-ellipsis-h'
    };
    return icons[category] || 'fa-folder';
}

function getCustomBlocks() {
    try {
        return JSON.parse(localStorage.getItem('ve_custom_blocks') || '[]');
    } catch { return []; }
}

function createCustomBlockButton() {
    const container = document.getElementById('blocksList');
    if (!container) return;
    const parent = container.parentElement;
    if (!parent) return;
    if (document.getElementById('veCustomBlockBtn')) return;
    const customBtn = document.createElement('button');
    customBtn.id = 'veCustomBlockBtn';
    customBtn.className = 've-btn ve-btn-primary';
    customBtn.innerHTML = '<i class="fas fa-plus"></i> Создать блок';
    customBtn.style.cssText = 'width:100%;margin-top:12px;';
    customBtn.onclick = () => {
        if (typeof openCustomBlockModal === 'function') {
            openCustomBlockModal();
        } else {
            showToast('Ошибка: openCustomBlockModal не определён', 'error');
        }
    };
    parent.appendChild(customBtn);
}

function createSaveComponentButton() {
    const container = document.getElementById('blocksList');
    if (!container) return;
    const parent = container.parentElement;
    if (!parent) return;
    if (document.getElementById('veSaveComponentBtn')) return;
    const saveBtn = document.createElement('button');
    saveBtn.id = 'veSaveComponentBtn';
    saveBtn.className = 've-btn ve-btn-primary';
    saveBtn.innerHTML = '<i class="fas fa-object-group"></i> Сохранить компонент';
    saveBtn.style.cssText = 'width:100%;margin-top:8px;background:linear-gradient(135deg,#f59e0b,#d97706);';
    saveBtn.onclick = () => {
        const name = prompt('Название компонента:', 'Мой компонент');
        if (name) {
            const result = saveComponent(name);
            if (result) {
                showToast(`✅ Компонент "${name}" сохранён`, 'success');
                renderBlockList();
            } else {
                showToast('Выберите хотя бы один блок', 'error');
            }
        }
    };
    parent.appendChild(saveBtn);
}

export function renderLayers() {
    const container = document.getElementById('layersList');
    if (!container) return;

    if (state.blocks.length === 0) {
        container.innerHTML = '<div style="color:#64748b;text-align:center;padding:20px;">Нет блоков</div>';
        return;
    }

    let html = '';
    const sorted = [...state.blocks].reverse();

    for (const block of sorted) {
        const isSelected = state.selectedId === block.id;
        const icon = getBlockIcon(block.type);
        const name = getBlockName(block.type);
        html += `<div class="ve-layer-item ${isSelected ? 'active' : ''}" data-id="${block.id}">
            <i class="fas ${icon}" style="width:20px;"></i>
            <span class="ve-layer-name" style="flex:1;font-size:12px;">${name}</span>
            <span class="ve-layer-zindex" style="font-size:10px;color:#94a3b8;margin-right:8px;">z:${block.styles.zIndex || 1}</span>
            <div class="ve-layer-actions" style="display:flex;gap:4px;">
                <button class="layer-move-up" data-id="${block.id}" title="Вверх" style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:2px 6px;border-radius:4px;">
                    <i class="fas fa-arrow-up" style="font-size:10px;"></i>
                </button>
                <button class="layer-move-down" data-id="${block.id}" title="Вниз" style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:2px 6px;border-radius:4px;">
                    <i class="fas fa-arrow-down" style="font-size:10px;"></i>
                </button>
                <button class="layer-delete" data-id="${block.id}" title="Удалить" style="background:none;border:none;color:#ef4444;cursor:pointer;padding:2px 6px;border-radius:4px;">
                    <i class="fas fa-trash" style="font-size:10px;"></i>
                </button>
            </div>
        </div>`;
    }

    container.innerHTML = html;

    container.querySelectorAll('.ve-layer-item').forEach(el => {
        el.addEventListener('click', function(e) {
            if (e.target.closest('.layer-actions')) return;
            const id = this.dataset.id;
            selectBlock(id);
            document.querySelectorAll('.ve-layer-item').forEach(item => {
                item.classList.toggle('active', item.dataset.id === id);
            });
            document.querySelectorAll('.ve-block').forEach(block => {
                block.classList.toggle('selected', block.dataset.id === id);
            });
            if (typeof updatePropertiesPanel === 'function') {
                updatePropertiesPanel(id);
            }
        });
    });

    container.querySelectorAll('.layer-delete').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            if (typeof window.deleteBlock === 'function') {
                window.deleteBlock(id);
            }
        });
    });

    container.querySelectorAll('.layer-move-up').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            moveBlockUp(id);
        });
    });

    container.querySelectorAll('.layer-move-down').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            moveBlockDown(id);
        });
    });
}

export function moveBlockUp(id) {
    const index = state.blocks.findIndex(b => b.id === id);
    if (index <= 0) return;
    const temp = state.blocks[index];
    state.blocks[index] = state.blocks[index - 1];
    state.blocks[index - 1] = temp;
    state.blocks.forEach((b, i) => {
        b.styles.zIndex = i + 1;
    });
    saveHistory();
    renderLayers();
    renderCanvas();
    state.hasUnsaved = true;
    showToast('⬆️ Блок перемещён вверх', 'success');
}

export function moveBlockDown(id) {
    const index = state.blocks.findIndex(b => b.id === id);
    if (index === -1 || index >= state.blocks.length - 1) return;
    const temp = state.blocks[index];
    state.blocks[index] = state.blocks[index + 1];
    state.blocks[index + 1] = temp;
    state.blocks.forEach((b, i) => {
        b.styles.zIndex = i + 1;
    });
    saveHistory();
    renderLayers();
    renderCanvas();
    state.hasUnsaved = true;
    showToast('⬇️ Блок перемещён вниз', 'success');
}

function getBlockIcon(type) {
    const icons = {
        hero: 'fa-home',
        text: 'fa-paragraph',
        image: 'fa-image',
        button: 'fa-hand-pointer',
        shape: 'fa-shapes',
        slider: 'fa-images',
        video: 'fa-video',
        map: 'fa-map',
        gallery: 'fa-th',
        counter: 'fa-calculator',
        accordion: 'fa-chevron-down',
        tabs: 'fa-table',
        reviews: 'fa-star',
        product: 'fa-tag',
        progress: 'fa-chart-line',
        container: 'fa-layer-group',
        row: 'fa-columns'
    };
    return icons[type] || 'fa-cube';
}

function getBlockName(type) {
    const names = {
        hero: 'Герой',
        text: 'Текст',
        image: 'Изображение',
        button: 'Кнопка',
        shape: 'Фигура',
        slider: 'Слайдер',
        video: 'Видео',
        map: 'Карта',
        gallery: 'Галерея',
        counter: 'Счётчик',
        accordion: 'Аккордеон',
        tabs: 'Табы',
        reviews: 'Отзывы',
        product: 'Товар',
        progress: 'Прогресс',
        container: 'Контейнер',
        row: 'Колонки'
    };
    return names[type] || type;
}

export function updateBlocksCount() {
    const el = document.getElementById('blocksCount');
    if (el) el.textContent = `(${state.blocks.length})`;
}

export function renderTemplates() {
    const container = document.getElementById('templatesList');
    if (!container) return;
    const templates = state.templates || [];
    if (templates.length === 0) {
        container.innerHTML = '<div style="color:#64748b;text-align:center;padding:10px;font-size:12px;">Нет шаблонов</div>';
        return;
    }
    let html = '';
    for (const t of templates) {
        html += `<div class="ve-template-item" data-id="${t.id}" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#2a2a3e;border-radius:8px;margin-bottom:6px;cursor:pointer;">
            <span style="font-size:12px;">${t.name}</span>
            <button class="delete-template" data-id="${t.id}" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:11px;">✕</button>
        </div>`;
    }
    container.innerHTML = html;

    container.querySelectorAll('.ve-template-item').forEach(el => {
        el.addEventListener('click', function(e) {
            if (e.target.closest('.delete-template')) return;
            const id = this.dataset.id;
            const template = state.templates.find(t => t.id === id);
            if (template && typeof window.insertTemplate === 'function') {
                window.insertTemplate(template);
            }
        });
    });

    container.querySelectorAll('.delete-template').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            state.templates = state.templates.filter(t => t.id !== id);
            state.hasUnsaved = true;
            renderTemplates();
            showToast('Шаблон удалён', 'success');
        });
    });
}

export function initSidebar() {
    renderBlockList();
    renderLayers();
    updateBlocksCount();
    renderTemplates();
    createCustomBlockButton();
    createSaveComponentButton();

    const searchInput = document.getElementById('blockSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const cards = document.querySelectorAll('.ve-block-card');
            cards.forEach(card => {
                const name = card.querySelector('.ve-block-card-name')?.innerText?.toLowerCase() || '';
                card.style.display = name.includes(query) ? 'flex' : 'none';
            });
        });
    }
}