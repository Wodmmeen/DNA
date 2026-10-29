// ui/toolbar.js
import { state } from '../core/state.js';
import { saveLayout, exportPage } from '../core/api.js';
import { undo, redo } from '../core/history.js';
import { renderCanvas } from '../core/renderer.js';
import { renderLayers, updateBlocksCount } from './sidebar.js';

export function initToolbar() {
    // Сохранение
    document.getElementById('saveBtn')?.addEventListener('click', () => {
        saveLayout(false);
    });

    // Публикация
    document.getElementById('publishBtn')?.addEventListener('click', () => {
        saveLayout(true);
    });

    // Превью
    document.getElementById('previewBtn')?.addEventListener('click', () => {
        if (state.pageId) {
            window.open(`/preview/${state.pageId}`, '_blank');
        } else {
            showToast('Нет страницы для превью', 'error');
        }
    });

    // Отмена
    document.getElementById('undoBtn')?.addEventListener('click', () => {
        if (undo()) {
            renderCanvas();
            renderLayers();
            updateBlocksCount();
            showToast('↩️ Отменено', 'info');
        } else {
            showToast('Нечего отменять', 'warning');
        }
    });

    // Повтор
    document.getElementById('redoBtn')?.addEventListener('click', () => {
        if (redo()) {
            renderCanvas();
            renderLayers();
            updateBlocksCount();
            showToast('↪️ Повторено', 'info');
        } else {
            showToast('Нечего повторять', 'warning');
        }
    });

    // Экспорт HTML
    document.getElementById('exportHtmlBtn')?.addEventListener('click', () => {
        exportPage();
    });

    // Экспорт JSON
    document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
        const data = {
            blocks: state.blocks,
            global: state.global,
            templates: state.templates,
            exported: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `page_${state.pageId}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('📄 JSON экспортирован', 'success');
    });

    // ===== САЙДБАР =====
    const toggleBtn = document.getElementById('sidebarToggle');
    if (toggleBtn) {
        const newBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);
        newBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const sidebar = document.getElementById('veSidebar');
            const editor = document.getElementById('veEditor');
            if (sidebar) {
                const isOpen = sidebar.classList.toggle('open');
                if (editor) editor.classList.toggle('shifted');
                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = isOpen ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
                }
                console.log(`🔘 Сайдбар ${isOpen ? 'открыт' : 'закрыт'}`);
            }
        });
        console.log('✅ Обработчик сайдбара привязан');
    } else {
        console.warn('⚠️ Кнопка #sidebarToggle не найдена');
    }

    // Закрытие панели свойств
    document.getElementById('closePropertiesBtn')?.addEventListener('click', () => {
        document.getElementById('propertiesContent').innerHTML = '';
        document.getElementById('veProperties').classList.remove('open');
        state.selectedId = null;
        document.querySelectorAll('.ve-block').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.ve-layer-item').forEach(el => el.classList.remove('active'));
    });
}

// ========== УВЕДОМЛЕНИЯ ==========
export function showToast(msg, type = 'success') {
    const existing = document.querySelector('.ve-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 've-toast';
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #1a1a2e;
        color: #e2e8f0;
        padding: 12px 24px;
        border-radius: 40px;
        z-index: 10001;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
        border: 1px solid ${colors[type] || '#8b5cf6'};
        animation: toastInOut 2.8s ease forwards;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
    `;
    toast.innerHTML = `<i class="fas ${icons[type] || 'fa-info-circle'}" style="color:${colors[type] || '#8b5cf6'};"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}

// ========== ИНДИКАТОР АВТОСОХРАНЕНИЯ ==========
export function updateAutoSaveIndicator(status) {
    const ind = document.getElementById('autoSaveIndicator');
    if (!ind) return;
    const icon = ind.querySelector('i');
    const text = ind.querySelector('span');
    if (status === 'saving') {
        icon.className = 'fas fa-spinner fa-pulse';
        text.textContent = 'Сохранение...';
    } else if (status === 'saved') {
        icon.className = 'fas fa-check';
        text.textContent = 'Сохранено';
    } else if (status === 'changed') {
        icon.className = 'fas fa-clock';
        text.textContent = 'Есть изменения';
    }
}