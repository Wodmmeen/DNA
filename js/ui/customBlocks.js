// ui/customBlocks.js
import { state } from '../core/state.js';
import { renderBlockList } from './sidebar.js';
import { showToast } from './toolbar.js';
import { blockMetadata, blockRegistry } from '../blocks/index.js';

// ===== ЗАГРУЗКА КАСТОМНЫХ БЛОКОВ =====
export function getCustomBlocks() {
    try {
        return JSON.parse(localStorage.getItem('ve_custom_blocks') || '[]');
    } catch { return []; }
}

export function saveCustomBlock(name, html, css, js) {
    const blocks = getCustomBlocks();
    const id = 'custom_' + Date.now();
    blocks.push({ id, name, html, css, js, created: new Date().toISOString() });
    localStorage.setItem('ve_custom_blocks', JSON.stringify(blocks));
    
    // Добавляем в blockMetadata для отображения в списке
    window.blockMetadata[id] = {
        name: name,
        icon: 'fa-code',
        category: 'Мои блоки',
        isCustom: true,
        html: html,
        css: css,
        js: js
    };
    
    // Регистрируем в blockRegistry
    registerCustomBlock(id);
    
    renderBlockList();
    showToast(`✅ Блок "${name}" сохранён`, 'success');
}

// ===== РЕГИСТРАЦИЯ КАСТОМНОГО БЛОКА В blockRegistry =====
export function registerCustomBlock(id) {
    blockRegistry[id] = class CustomBlock {
        constructor(data) {
            this.id = data.id;
            this.type = data.type;
            this.content = data.content || {};
            this.styles = data.styles || {};
        }
        render() {
            const customBlocks = getCustomBlocks();
            const block = customBlocks.find(b => b.id === this.type);
            if (!block) return `<div>Блок не найден</div>`;
            
            let html = block.html || '';
            let css = block.css || '';
            let js = block.js || '';
            
            // Добавляем уникальный ID для стилей
            const containerId = 'custom-' + this.id;
            
            let result = `<div id="${containerId}" class="custom-block-wrapper">${html}</div>`;
            
            if (css) {
                const escapedCss = css.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
                result += `<style>#${containerId} ${css}</style>`;
            }
            
            if (js) {
                try {
                    const script = document.createElement('script');
                    script.textContent = js;
                    // Выполняем через setTimeout, чтобы DOM успел отрендериться
                    setTimeout(() => {
                        try {
                            // Создаём новый скрипт и выполняем
                            const s = document.createElement('script');
                            s.textContent = js;
                            document.body.appendChild(s);
                            document.body.removeChild(s);
                        } catch (e) {
                            console.warn('Ошибка выполнения JS кастомного блока:', e);
                        }
                    }, 50);
                } catch (e) {
                    console.warn('Ошибка обработки JS кастомного блока:', e);
                }
            }
            
            return result;
        }
        getProperties() {
            return [
                { key: 'html', label: 'HTML', type: 'textarea', default: '' },
                { key: 'css', label: 'CSS', type: 'textarea', default: '' },
                { key: 'js', label: 'JavaScript', type: 'textarea', default: '' }
            ];
        }
    };
}

// ===== РЕНДЕРИНГ КАСТОМНОГО БЛОКА =====
export function renderCustomBlock(blockId) {
    const customBlocks = getCustomBlocks();
    const block = customBlocks.find(b => b.id === blockId);
    if (!block) return `<div>Блок не найден</div>`;
    
    let html = block.html || '';
    let css = block.css || '';
    let js = block.js || '';
    
    const containerId = 'custom-preview-' + Date.now();
    
    let result = `<div id="${containerId}" class="custom-block-wrapper">${html}</div>`;
    
    if (css) {
        result += `<style>#${containerId} ${css}</style>`;
    }
    
    if (js) {
        try {
            setTimeout(() => {
                try {
                    const s = document.createElement('script');
                    s.textContent = js;
                    document.body.appendChild(s);
                    document.body.removeChild(s);
                } catch (e) {
                    console.warn('Ошибка выполнения JS:', e);
                }
            }, 50);
        } catch (e) {
            console.warn('Ошибка обработки JS:', e);
        }
    }
    
    return result;
}

// ===== ОТКРЫТИЕ МОДАЛКИ =====
export function openCustomBlockModal() {
    const modal = document.getElementById('customBlockModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('customBlockName').value = '';
        document.getElementById('customBlockHTML').value = '<div class="my-custom-block">Привет, мир!</div>';
        document.getElementById('customBlockCSS').value = '.my-custom-block { padding: 20px; background: #8b5cf6; color: white; border-radius: 12px; text-align: center; }';
        document.getElementById('customBlockJS').value = 'console.log("Кастомный блок загружен!");';
    }
}

export function closeCustomBlockModal() {
    const modal = document.getElementById('customBlockModal');
    if (modal) modal.classList.remove('active');
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
export function initCustomBlocks() {
    // Загружаем кастомные блоки из localStorage в blockMetadata
    const customBlocks = getCustomBlocks();
    for (const block of customBlocks) {
        window.blockMetadata[block.id] = {
            name: block.name,
            icon: 'fa-code',
            category: 'Мои блоки',
            isCustom: true,
            html: block.html,
            css: block.css,
            js: block.js
        };
        registerCustomBlock(block.id);
    }
    
    // Привязываем события модалки
    document.getElementById('saveCustomBlockBtn')?.addEventListener('click', () => {
        const name = document.getElementById('customBlockName').value.trim();
        const html = document.getElementById('customBlockHTML').value.trim();
        const css = document.getElementById('customBlockCSS').value.trim();
        const js = document.getElementById('customBlockJS').value.trim();
        
        if (!name) {
            showToast('Введите название блока', 'error');
            return;
        }
        if (!html) {
            showToast('Введите HTML код', 'error');
            return;
        }
        saveCustomBlock(name, html, css, js);
        closeCustomBlockModal();
    });
    
    document.getElementById('cancelCustomBlockBtn')?.addEventListener('click', closeCustomBlockModal);
    document.getElementById('closeCustomBlockModal')?.addEventListener('click', closeCustomBlockModal);
    
    document.getElementById('customBlockModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeCustomBlockModal();
    });
    
    // Обработчик для кнопки в сайдбаре (если она уже создана)
    document.addEventListener('click', function(e) {
        if (e.target.closest('#openCustomBlockBtn')) {
            openCustomBlockModal();
        }
    });
    
    console.log('✅ Кастомные блоки инициализированы');
}