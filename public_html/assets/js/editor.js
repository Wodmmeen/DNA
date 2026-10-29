// editor.js — полная рабочая версия с Event Bus
console.log('🔴 editor.js ЗАГРУЗИЛСЯ');

import { state, setBlocks, selectBlock, markSaved, togglePositionMode } from './core/state.js';
import { renderCanvas, reRenderBlock, toggleGrid, toggleSnap, startResize, startRotate } from './core/renderer.js';
import { saveHistory, undo, redo, saveToLocalStorage } from './core/history.js';
import { saveLayout, loadPage, exportPage, apiRequest } from './core/api.js';
import { blockRegistry, blockMetadata, blockTypes } from './blocks/index.js';
import { initSidebar, renderLayers, renderTemplates, updateBlocksCount, moveBlockUp, moveBlockDown, renderBlockList } from './ui/sidebar.js';
import { initProperties, updatePropertiesPanel } from './ui/properties.js';
import { initToolbar, showToast, updateAutoSaveIndicator } from './ui/toolbar.js';
import { initFloatingPanel } from './ui/floatingPanel.js';
import { initModals } from './ui/modals.js';
import { initDragManager } from './core/dragManager.js';
import { initCustomBlocks, openCustomBlockModal, renderCustomBlock } from './ui/customBlocks.js';
import { eventBus } from './core/eventBus.js';
import { EVENTS } from './core/events.js';

export function initEditor(pageData) {
    console.log('✅ initEditor вызван с данными:', pageData);

    state.pageId = pageData.pageId || 0;
    state.projectId = pageData.projectId || 0;
    state.blocks = pageData.blocks || [];
    state.global = pageData.global || {};
    state.templates = pageData.templates || [];
    state.selectedId = null;
    state.hasUnsaved = false;
    state.isSaving = false;
    state.positionMode = 'flow';

    const savedBlocks = localStorage.getItem('ve_editor_blocks_' + state.pageId);
    if (savedBlocks && state.blocks.length === 0) {
        try {
            state.blocks = JSON.parse(savedBlocks);
            state.hasUnsaved = true;
            showToast('Восстановлены несохранённые данные', 'info');
        } catch (e) {}
    }

    saveHistory();

    initSidebar();
    initProperties();
    initToolbar();
    initModals();
    initFloatingPanel();
    initCustomBlocks();

    renderCanvas();

    renderLayers();
    renderTemplates();
    updateBlocksCount();

    const dragManager = initDragManager();
    window.dragManager = dragManager;

    const sidebar = document.getElementById('veSidebar');
    const editorEl = document.getElementById('veEditor');
    const toggleIcon = document.querySelector('#sidebarToggle i');

    if (sidebar && !sidebar.classList.contains('open')) {
        sidebar.classList.add('open');
        if (editorEl) editorEl.classList.add('shifted');
        if (toggleIcon) {
            toggleIcon.className = 'fas fa-chevron-left';
        }
        console.log('✅ Сайдбар принудительно открыт');
    } else {
        console.log('ℹ️ Сайдбар уже открыт или не найден');
    }

    if (toggleIcon && sidebar) {
        const isOpen = sidebar.classList.contains('open');
        toggleIcon.className = isOpen ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
        console.log(`🔄 Иконка синхронизирована: ${isOpen ? 'открыт' : 'закрыт'}`);
    }

    const toolbarGroup = document.querySelector('.ve-toolbar-group:first-child');
    if (toolbarGroup && !document.getElementById('veGridBtn')) {
        const gridBtn = document.createElement('button');
        gridBtn.id = 'veGridBtn';
        gridBtn.className = 've-btn';
        gridBtn.innerHTML = '<i class="fas fa-th"></i>';
        gridBtn.title = 'Сетка';
        gridBtn.onclick = () => {
            if (typeof toggleGrid === 'function') {
                toggleGrid();
            } else {
                showToast('toggleGrid не определена', 'error');
            }
        };
        toolbarGroup.appendChild(gridBtn);

        const snapBtn = document.createElement('button');
        snapBtn.id = 'veSnapBtn';
        snapBtn.className = 've-btn';
        snapBtn.innerHTML = '<i class="fas fa-magnet"></i>';
        snapBtn.title = 'Привязка к сетке';
        snapBtn.onclick = () => {
            if (typeof toggleSnap === 'function') {
                toggleSnap();
            } else {
                showToast('toggleSnap не определена', 'error');
            }
        };
        toolbarGroup.appendChild(snapBtn);
    }

    setupKeyboardShortcuts();
    setupAutoSave();
    setupBeforeUnload();

    console.log('✅ Редактор полностью инициализирован');
    console.log(`📄 Страница: ${state.pageId}, Блоков: ${state.blocks.length}`);

    eventBus.emit(EVENTS.CANVAS_READY, { pageId: state.pageId });

    return {
        state,
        addBlock: (type) => addBlock(type),
        deleteBlock: (id) => deleteBlock(id),
        duplicateBlock: (id) => duplicateBlock(id),
        save: () => saveLayout(false),
        publish: () => saveLayout(true),
        export: () => exportPage(),
        undo: () => undo(),
        redo: () => redo(),
        reRenderBlock: (id) => reRenderBlock(id),
        moveBlockUp: (id) => moveBlockUp(id),
        moveBlockDown: (id) => moveBlockDown(id),
        toggleGrid: toggleGrid,
        toggleSnap: toggleSnap
    };
}

export function addBlock(type) {
    const def = typeof type === 'string' ? blockMetadata[type] : null;
    let newBlock;
    
    if (typeof type === 'object' && type.id) {
        newBlock = type;
    } else if (def) {
        newBlock = {
            id: 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: typeof type === 'string' ? type : type.type,
            content: {},
            styles: {
                padding: '20px',
                bg_color: 'transparent',
                alignment: 'center',
                zIndex: state.blocks.length + 1,
                width: 200,
                height: 150,
                left: 50 + state.blocks.length * 20,
                top: 50 + state.blocks.length * 20,
                position: state.positionMode === 'free' ? 'absolute' : 'relative',
                rotate: 0
            }
        };
        if (typeof type === 'object' && type.parentId) {
            newBlock.parentId = type.parentId;
        }
    } else {
        showToast('Неизвестный тип блока', 'error');
        return;
    }

    if (newBlock.parentId) {
        const parent = state.blocks.find(b => b.id === newBlock.parentId);
        if (parent) {
            if (!parent.children) parent.children = [];
            parent.children.push(newBlock.id);
        }
    }

    state.blocks.push(newBlock);
    state.hasUnsaved = true;
    state.isDirty = true;
    saveHistory();
    renderCanvas();
    renderLayers();
    updateBlocksCount();
    selectBlock(newBlock.id);
    updatePropertiesPanel(newBlock.id);
    showToast(`➕ Блок добавлен`, 'success');
    saveToLocalStorage();

    eventBus.emit(EVENTS.BLOCK_ADDED, { id: newBlock.id, type: newBlock.type, block: newBlock });
}

export function deleteBlock(id) {
    if (!confirm('Удалить этот блок?')) return;
    const block = state.blocks.find(b => b.id === id);
    if (block && block.parentId) {
        const parent = state.blocks.find(b => b.id === block.parentId);
        if (parent && parent.children) {
            parent.children = parent.children.filter(c => c !== id);
        }
    }
    const toDelete = [id];
    const findChildren = (parentId) => {
        const children = state.blocks.filter(b => b.parentId === parentId);
        for (const child of children) {
            toDelete.push(child.id);
            findChildren(child.id);
        }
    };
    findChildren(id);
    state.blocks = state.blocks.filter(b => !toDelete.includes(b.id));
    if (state.selectedId === id) state.selectedId = null;
    state.hasUnsaved = true;
    state.isDirty = true;
    saveHistory();
    renderCanvas();
    renderLayers();
    updateBlocksCount();
    showToast('🗑️ Блок удалён', 'success');
    saveToLocalStorage();

    eventBus.emit(EVENTS.BLOCK_REMOVED, { id });
}

export function duplicateBlock(id) {
    const orig = state.blocks.find(b => b.id === id);
    if (!orig) return;
    const newBlock = JSON.parse(JSON.stringify(orig));
    newBlock.id = 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    newBlock.styles.left = (orig.styles.left || 0) + 30;
    newBlock.styles.top = (orig.styles.top || 0) + 30;
    const index = state.blocks.findIndex(b => b.id === id);
    state.blocks.splice(index + 1, 0, newBlock);
    state.hasUnsaved = true;
    state.isDirty = true;
    saveHistory();
    renderCanvas();
    renderLayers();
    updateBlocksCount();
    selectBlock(newBlock.id);
    updatePropertiesPanel(newBlock.id);
    showToast('📋 Блок скопирован', 'success');
    saveToLocalStorage();

    eventBus.emit(EVENTS.BLOCK_DUPLICATED, { originalId: id, newId: newBlock.id });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveLayout(false);
        }
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            if (undo()) {
                renderCanvas();
                renderLayers();
                updateBlocksCount();
                showToast('↩️ Отменено', 'info');
                eventBus.emit(EVENTS.HISTORY_UNDO);
            }
        }
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            if (redo()) {
                renderCanvas();
                renderLayers();
                updateBlocksCount();
                showToast('↪️ Повторено', 'info');
                eventBus.emit(EVENTS.HISTORY_REDO);
            }
        }
        if (e.key === 'Delete' && state.selectedId) {
            e.preventDefault();
            deleteBlock(state.selectedId);
        }
        if (e.key === 'Escape') {
            state.selectedId = null;
            updatePropertiesPanel(null);
            document.querySelectorAll('.ve-block').forEach(el => el.classList.remove('selected'));
            document.querySelectorAll('.ve-layer-item').forEach(el => el.classList.remove('active'));
            eventBus.emit(EVENTS.BLOCK_DESELECTED);
        }
        if (e.ctrlKey && e.key === 'd' && state.selectedId) {
            e.preventDefault();
            duplicateBlock(state.selectedId);
        }
        if (e.ctrlKey && e.key === 'g' && state.selectedId) {
            e.preventDefault();
            if (typeof window.groupSelected === 'function') {
                window.groupSelected();
            }
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'G') {
            e.preventDefault();
            if (typeof window.ungroupSelected === 'function') {
                window.ungroupSelected();
            }
        }
        if (e.ctrlKey && e.key === '[' && state.selectedId) {
            e.preventDefault();
            if (typeof moveLayerDown === 'function') {
                moveLayerDown(state.selectedId);
            }
        }
        if (e.ctrlKey && e.key === ']' && state.selectedId) {
            e.preventDefault();
            if (typeof moveLayerUp === 'function') {
                moveLayerUp(state.selectedId);
            }
        }
    });
}

function setupAutoSave() {
    setInterval(() => {
        if (state.hasUnsaved && !state.isSaving) {
            saveLayout(false);
        }
    }, 30000);
}

function setupBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
        if (state.hasUnsaved) {
            e.preventDefault();
            e.returnValue = 'У вас есть несохранённые изменения. Вы уверены?';
            return e.returnValue;
        }
    });
}

window.addBlock = addBlock;
window.deleteBlock = deleteBlock;
window.duplicateBlock = duplicateBlock;
window.saveLayout = saveLayout;
window.exportPage = exportPage;
window.undo = undo;
window.redo = redo;
window.showToast = showToast;
window.state = state;
window.blockRegistry = blockRegistry;
window.blockMetadata = blockMetadata;
window.reRenderBlock = reRenderBlock;
window.moveBlockUp = moveBlockUp;
window.moveBlockDown = moveBlockDown;
window.updatePropertiesPanel = updatePropertiesPanel;
window.renderBlockList = renderBlockList;
window.initSidebar = initSidebar;
window.toggleGrid = toggleGrid;
window.toggleSnap = toggleSnap;
window.openCustomBlockModal = openCustomBlockModal;
window.renderCustomBlock = renderCustomBlock;
window.togglePositionMode = togglePositionMode;
window.startResize = startResize;
window.startRotate = startRotate;

window.eventBus = eventBus;
window.EVENTS = EVENTS;

if (window.pageData) {
    console.log('🚀 Автоматическая инициализация');
    const app = initEditor(window.pageData);
    window.__editor = app;
} else {
    console.error('❌ pageData не найден!');
}

export default initEditor;