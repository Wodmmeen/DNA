// ui/properties.js
import { state, getBlock, togglePositionMode } from '../core/state.js';
import { reRenderBlock } from '../core/renderer.js';
import { saveHistory } from '../core/history.js';
import { showToast, updateAutoSaveIndicator } from './toolbar.js';
import { renderLayers } from './sidebar.js';
import { eventBus } from '../core/eventBus.js';
import { EVENTS } from '../core/events.js';

let activeBlockId = null;

export function updatePropertiesPanel(blockId) {
    const container = document.getElementById('propertiesContent');
    if (!container) {
        console.warn('⚠️ propertiesContent не найден');
        return;
    }

    const panel = document.getElementById('veProperties');
    if (panel) {
        if (blockId) {
            panel.classList.add('open');
        } else {
            panel.classList.remove('open');
        }
    }

    activeBlockId = blockId;

    if (!blockId) {
        container.innerHTML = `
            <div style="padding:40px;color:#94a3b8;text-align:center;">
                <i class="fas fa-mouse-pointer" style="font-size:48px;opacity:0.3;display:block;margin-bottom:16px;"></i>
                <p>Выберите блок, чтобы увидеть его настройки</p>
            </div>
        `;
        return;
    }

    const block = getBlock(blockId);
    if (!block) {
        container.innerHTML = `<div style="padding:20px;color:#ef4444;">❌ Блок не найден</div>`;
        return;
    }

    const html = generatePropertiesHTML(block);
    container.innerHTML = html;
    bindPropertyEvents(blockId);
}

function generatePropertiesHTML(block) {
    const type = block.type;
    const content = block.content || {};
    const styles = block.styles || {};

    let html = `<div class="ve-properties-block">`;

    html += `
        <div class="ve-properties-header-bar">
            <span class="ve-properties-type">${getTypeLabel(type)}</span>
            <button class="ve-properties-delete" id="deleteBlockBtn" title="Удалить блок">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    html += `<div class="ve-properties-group">`;
    switch (type) {
        case 'text': html += textProperties(content); break;
        case 'hero': html += heroProperties(content); break;
        case 'image': html += imageProperties(content); break;
        case 'button': html += buttonProperties(content); break;
        case 'shape': html += shapeProperties(content); break;
        default: html += `<div class="ve-properties-hint">Для этого блока пока нет настроек</div>`;
    }
    html += `</div>`;

    html += `
        <div class="ve-properties-group">
            <div class="ve-properties-group-title">Позиционирование</div>
            <div class="ve-properties-grid">
                <div class="ve-property">
                    <label class="ve-property-label">X</label>
                    <input class="ve-property-input" data-pos="x" type="number" value="${Math.round(styles.left || 0)}">
                </div>
                <div class="ve-property">
                    <label class="ve-property-label">Y</label>
                    <input class="ve-property-input" data-pos="y" type="number" value="${Math.round(styles.top || 0)}">
                </div>
                <div class="ve-property">
                    <label class="ve-property-label">Ширина</label>
                    <input class="ve-property-input" data-pos="width" type="number" value="${Math.round(styles.width || 0)}">
                </div>
                <div class="ve-property">
                    <label class="ve-property-label">Высота</label>
                    <input class="ve-property-input" data-pos="height" type="number" value="${Math.round(styles.height || 0)}">
                </div>
                <div class="ve-property" style="grid-column: 1 / -1;">
                    <label class="ve-property-label">Поворот (град)</label>
                    <input class="ve-property-input" data-pos="rotate" type="number" value="${Math.round(styles.rotate || 0)}" step="5">
                </div>
            </div>
        </div>
    `;

    html += `
        <div class="ve-properties-group">
            <div class="ve-properties-group-title">Режим позиционирования</div>
            <div style="display:flex;gap:8px;">
                <button class="ve-mode-btn ${state.positionMode === 'flow' ? 'active' : ''}" data-mode="flow" style="flex:1;padding:8px;border-radius:6px;cursor:pointer;background:${state.positionMode === 'flow' ? 'var(--accent)' : 'var(--bg-tertiary)'};border:1px solid var(--border);color:var(--text-primary);">
                    <i class="fas fa-list"></i> Flow
                </button>
                <button class="ve-mode-btn ${state.positionMode === 'free' ? 'active' : ''}" data-mode="free" style="flex:1;padding:8px;border-radius:6px;cursor:pointer;background:${state.positionMode === 'free' ? 'var(--accent)' : 'var(--bg-tertiary)'};border:1px solid var(--border);color:var(--text-primary);">
                    <i class="fas fa-arrows-alt"></i> Free
                </button>
            </div>
        </div>
    `;

    html += `
        <div class="ve-properties-group">
            <div class="ve-properties-group-title">Стили</div>
            ${styleProperties(styles)}
        </div>
    `;

    html += `
        <button class="ve-properties-apply" id="applyPropsBtn">
            <i class="fas fa-check"></i> Применить
        </button>
    `;

    html += `</div>`;
    return html;
}

function textProperties(content) {
    return `
        <div class="ve-property">
            <label class="ve-property-label">Текст</label>
            <textarea class="ve-property-input" data-prop="text" rows="4">${escapeHtml(content.text || '')}</textarea>
        </div>
    `;
}

function heroProperties(content) {
    return `
        <div class="ve-property">
            <label class="ve-property-label">Заголовок</label>
            <input class="ve-property-input" data-prop="title" value="${escapeHtml(content.title || '')}">
        </div>
        <div class="ve-property">
            <label class="ve-property-label">Подзаголовок</label>
            <input class="ve-property-input" data-prop="subtitle" value="${escapeHtml(content.subtitle || '')}">
        </div>
        <div class="ve-property">
            <label class="ve-property-label">Текст кнопки</label>
            <input class="ve-property-input" data-prop="button_text" value="${escapeHtml(content.button_text || '')}">
        </div>
        <div class="ve-property">
            <label class="ve-property-label">Ссылка</label>
            <input class="ve-property-input" data-prop="button_link" value="${escapeHtml(content.button_link || '#')}">
        </div>
    `;
}

function imageProperties(content) {
    return `
        <div class="ve-property">
            <label class="ve-property-label">URL изображения</label>
            <input class="ve-property-input" data-prop="image_url" value="${escapeHtml(content.image_url || '')}">
        </div>
        <div class="ve-property">
            <label class="ve-property-label">Alt текст</label>
            <input class="ve-property-input" data-prop="alt" value="${escapeHtml(content.alt || '')}">
        </div>
    `;
}

function buttonProperties(content) {
    return `
        <div class="ve-property">
            <label class="ve-property-label">Текст кнопки</label>
            <input class="ve-property-input" data-prop="text" value="${escapeHtml(content.text || '')}">
        </div>
        <div class="ve-property">
            <label class="ve-property-label">Ссылка</label>
            <input class="ve-property-input" data-prop="link" value="${escapeHtml(content.link || '#')}">
        </div>
    `;
}

function shapeProperties(content) {
    const shapes = ['square', 'circle', 'triangle', 'diamond', 'star'];
    const options = shapes.map(s => 
        `<option value="${s}" ${content.shape === s ? 'selected' : ''}>${s}</option>`
    ).join('');
    
    return `
        <div class="ve-property">
            <label class="ve-property-label">Форма</label>
            <select class="ve-property-input" data-prop="shape">${options}</select>
        </div>
        <div class="ve-property">
            <label class="ve-property-label">Цвет</label>
            <input class="ve-property-input" data-prop="bg_color" type="color" value="${content.bg_color || '#8b5cf6'}">
        </div>
    `;
}

function styleProperties(styles) {
    const alignments = ['left', 'center', 'right'];
    const alignOptions = alignments.map(a => 
        `<option value="${a}" ${styles.alignment === a ? 'selected' : ''}>${a}</option>`
    ).join('');

    const getColorValue = (value) => {
        if (!value || value === 'transparent' || value.startsWith('linear-gradient')) {
            return '#8b5cf6';
        }
        return value;
    };

    return `
        <div class="ve-property">
            <label class="ve-property-label">Цвет фона</label>
            <input class="ve-property-input" data-style="bg_color" type="color" value="${getColorValue(styles.bg_color)}">
        </div>
        <div class="ve-property">
            <label class="ve-property-label">Отступ (padding)</label>
            <input class="ve-property-input" data-style="padding" value="${styles.padding || '20px'}">
        </div>
        <div class="ve-property">
            <label class="ve-property-label">Выравнивание</label>
            <select class="ve-property-input" data-style="alignment">${alignOptions}</select>
        </div>
        <div class="ve-property">
            <label class="ve-property-label">Слой (z-index)</label>
            <input class="ve-property-input" data-style="zIndex" type="number" value="${styles.zIndex || 1}">
        </div>
    `;
}

function applyProperties(blockId) {
    const block = getBlock(blockId);
    if (!block) return;

    const container = document.getElementById('propertiesContent');
    if (!container) return;

    let hasChanges = false;

    const contentFields = container.querySelectorAll('[data-prop]');
    contentFields.forEach(field => {
        const key = field.dataset.prop;
        const value = field.type === 'number' ? parseInt(field.value) : field.value;
        if (block.content[key] !== value) {
            block.content[key] = value;
            hasChanges = true;
        }
    });

    const posFields = container.querySelectorAll('[data-pos]');
    posFields.forEach(field => {
        const key = field.dataset.pos;
        let value = field.type === 'number' ? parseInt(field.value) : 0;
        if (key === 'rotate') {
            value = parseFloat(field.value) || 0;
        }
        if (block.styles[key] !== value) {
            block.styles[key] = value;
            hasChanges = true;
        }
    });

    const styleFields = container.querySelectorAll('[data-style]');
    styleFields.forEach(field => {
        const key = field.dataset.style;
        let value = field.type === 'number' ? parseInt(field.value) : field.value;
        if (field.type === 'color' && !value) {
            value = 'transparent';
        }
        if (block.styles[key] !== value) {
            block.styles[key] = value;
            hasChanges = true;
        }
    });

    if (hasChanges) {
        saveHistory();
        reRenderBlock(blockId);
        renderLayers();
        state.hasUnsaved = true;
        if (typeof updateAutoSaveIndicator === 'function') {
            updateAutoSaveIndicator('changed');
        }
        showToast('✅ Блок обновлён', 'success');

        eventBus.emit(EVENTS.BLOCK_UPDATED, { id: blockId, block });
    }
}

function bindPropertyEvents(blockId) {
    const container = document.getElementById('propertiesContent');
    if (!container) return;

    const applyBtn = document.getElementById('applyPropsBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => applyProperties(blockId));
    }

    const deleteBtn = document.getElementById('deleteBlockBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (typeof window.deleteBlock === 'function') {
                window.deleteBlock(blockId);
            }
        });
    }

    document.querySelectorAll('.ve-mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;
            const newMode = togglePositionMode();
            document.querySelectorAll('.ve-mode-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.mode === newMode);
                b.style.background = b.classList.contains('active') ? 'var(--accent)' : 'var(--bg-tertiary)';
            });
            if (typeof window.renderCanvas === 'function') {
                window.renderCanvas();
            }
            showToast(`📐 Режим ${newMode === 'flow' ? 'Flow' : 'Free'}`, 'info');

            eventBus.emit(EVENTS.POSITION_MODE_CHANGED, { mode: newMode });
        });
    });

    const inputs = container.querySelectorAll('.ve-property-input');
    inputs.forEach(input => {
        if (input.type === 'text' || input.type === 'number') {
            input.addEventListener('blur', () => applyProperties(blockId));
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') applyProperties(blockId);
            });
        }
        if (input.type === 'color' || input.tagName === 'SELECT' || input.tagName === 'TEXTAREA') {
            input.addEventListener('change', () => applyProperties(blockId));
        }
    });
}

function getTypeLabel(type) {
    const labels = {
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
    return labels[type] || type;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[m]);
}

export function initProperties() {
    updatePropertiesPanel(null);
    console.log('✅ Панель свойств инициализирована');

    eventBus.on(EVENTS.BLOCK_SELECTED, ({ id }) => {
        console.log('📋 Панель свойств: получен выбор блока', id);
        updatePropertiesPanel(id);
    });

    eventBus.on(EVENTS.BLOCK_DESELECTED, () => {
        updatePropertiesPanel(null);
    });

    eventBus.on(EVENTS.BLOCK_UPDATED, ({ id }) => {
        if (state.selectedId === id) {
            updatePropertiesPanel(id);
        }
    });
}