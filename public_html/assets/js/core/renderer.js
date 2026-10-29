// core/renderer.js
import { state, getBlock, selectBlock, clearSelection, getChildren } from './state.js';
import { blockRegistry } from '../blocks/index.js';
import { renderLayers, updateBlocksCount } from '../ui/sidebar.js';
import { updatePropertiesPanel } from '../ui/properties.js';
import { showToast } from '../ui/toolbar.js';
import { eventBus } from './eventBus.js';
import { EVENTS } from './events.js';

export function renderBlock(block, isChild = false) {
    const BlockClass = blockRegistry[block.type];
    if (!BlockClass) {
        console.warn(`Unknown block type: ${block.type}`);
        return `<div class="ve-block ve-block-error" data-id="${block.id}" data-type="${block.type}">
            <div class="ve-block-error-msg">Неизвестный блок: ${block.type}</div>
        </div>`;
    }
    const instance = new BlockClass(block);
    let html = instance.render();
    
    const children = getChildren(block.id);
    let childrenHtml = '';
    if (children.length > 0) {
        childrenHtml = `<div class="ve-block-children" data-parent="${block.id}">`;
        for (const child of children) {
            childrenHtml += renderBlock(child, true);
        }
        childrenHtml += `</div>`;
    }
    
    if (childrenHtml) {
        html = html.replace('</div>', childrenHtml + '</div>');
    }

    const isSelected = state.selectedId === block.id;
    let handlesHtml = '';
    if (isSelected && state.positionMode === 'free') {
        handlesHtml = `
            <div class="ve-resize-handle nw" data-direction="nw"></div>
            <div class="ve-resize-handle ne" data-direction="ne"></div>
            <div class="ve-resize-handle se" data-direction="se"></div>
            <div class="ve-resize-handle sw" data-direction="sw"></div>
            <div class="ve-resize-handle n" data-direction="n"></div>
            <div class="ve-resize-handle s" data-direction="s"></div>
            <div class="ve-resize-handle w" data-direction="w"></div>
            <div class="ve-resize-handle e" data-direction="e"></div>
            <div class="ve-rotate-handle" data-direction="rotate">
                <i class="fas fa-sync-alt"></i>
            </div>
        `;
    }

    if (isSelected && handlesHtml && state.positionMode === 'free') {
        html = html.replace('</div>', handlesHtml + '</div>');
    }
    
    return html;
}

export function renderCanvas() {
    const container = document.getElementById('veCanvas');
    if (!container) return;

    if (state.positionMode === 'free') {
        container.style.position = 'relative';
        container.style.minHeight = '800px';
        container.style.minWidth = '100%';
        container.classList.add('ve-canvas-free');
    } else {
        container.style.position = '';
        container.style.minHeight = '';
        container.style.minWidth = '';
        container.classList.remove('ve-canvas-free');
    }

    const rootBlocks = state.blocks.filter(b => !b.parentId);
    let html = '';
    for (const block of rootBlocks) {
        html += renderBlock(block);
    }
    container.innerHTML = html || '<div class="ve-empty-state"><i class="fas fa-plus-circle"></i><p>Нажмите на блок слева, чтобы добавить</p></div>';

    attachBlockEvents();
    highlightSelectedBlock();
    updateBlockPositions();
    updateGrid();

    eventBus.emit(EVENTS.CANVAS_RENDERED, { blockCount: state.blocks.length });
}

export function reRenderBlock(id) {
    const block = getBlock(id);
    if (!block) return;
    
    if (block.parentId) {
        renderCanvas();
        return;
    }

    const container = document.getElementById('veCanvas');
    const oldEl = container.querySelector(`.ve-block[data-id="${id}"]`);
    if (oldEl) {
        const newHtml = renderBlock(block);
        const temp = document.createElement('div');
        temp.innerHTML = newHtml;
        const newEl = temp.firstElementChild;
        if (newEl) {
            oldEl.replaceWith(newEl);
            attachBlockEvents();
            if (state.selectedId === id) newEl.classList.add('selected');
            updateBlockPositions();
            updateGrid();
            return newEl;
        }
    }
    renderCanvas();
}

export function updateBlockPositions() {
    const block = state.selectedId ? getBlock(state.selectedId) : null;
    if (!block) return;
    const el = document.querySelector(`.ve-block[data-id="${block.id}"]`);
    if (!el) return;
    const styles = block.styles;
    const container = document.getElementById('propertiesContent');
    if (!container) return;
    const xInput = container.querySelector('[data-pos="x"]');
    const yInput = container.querySelector('[data-pos="y"]');
    const wInput = container.querySelector('[data-pos="width"]');
    const hInput = container.querySelector('[data-pos="height"]');
    const rInput = container.querySelector('[data-pos="rotate"]');
    if (xInput) xInput.value = Math.round(styles.left || 0);
    if (yInput) yInput.value = Math.round(styles.top || 0);
    if (wInput) wInput.value = Math.round(styles.width || 0);
    if (hInput) hInput.value = Math.round(styles.height || 0);
    if (rInput) rInput.value = Math.round(styles.rotate || 0);
}

function attachBlockEvents() {
    document.querySelectorAll('.ve-block').forEach(el => {
        el.onclick = (e) => {
            e.stopPropagation();
            const id = el.dataset.id;
            selectBlock(id);
            highlightSelectedBlock();
            document.querySelectorAll('.ve-layer-item').forEach(item => {
                item.classList.toggle('active', item.dataset.id === id);
            });
            if (typeof updatePropertiesPanel === 'function') {
                updatePropertiesPanel(id);
            }
            updateBlockPositions();

            eventBus.emit(EVENTS.BLOCK_SELECTED, { id, block: getBlock(id) });
        };

        el.ondblclick = (e) => {
            const id = el.dataset.id;
            handleDoubleClick(id);
        };

        el.oncontextmenu = (e) => {
            e.preventDefault();
            const id = el.dataset.id;
            if (typeof showContextMenu === 'function') {
                showContextMenu(id, e.clientX, e.clientY);
            }
        };

        el.addEventListener('mousedown', function(e) {
            if (e.target.closest('a, button, input, textarea, .ve-text-editable, .ve-hero-button')) return;
            if (e.target.closest('.ve-resize-handle')) return;
            if (e.target.closest('.ve-rotate-handle')) return;
            if (typeof window.dragManager?.startFromCanvas === 'function') {
                window.dragManager.startFromCanvas(this, this.dataset.id);
            }
        });

        el.querySelectorAll('.ve-resize-handle').forEach(handle => {
            handle.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const id = el.dataset.id;
                const direction = this.dataset.direction;
                if (typeof window.startResize === 'function') {
                    window.startResize(e, id, direction);
                }
            });
        });

        el.querySelectorAll('.ve-rotate-handle').forEach(handle => {
            handle.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const id = el.dataset.id;
                if (typeof window.startRotate === 'function') {
                    window.startRotate(e, id);
                }
            });
        });
    });

    const canvas = document.getElementById('veCanvas');
    if (canvas) {
        canvas.onclick = (e) => {
            if (e.target === canvas) {
                clearSelection();
                highlightSelectedBlock();
                document.querySelectorAll('.ve-layer-item').forEach(el => el.classList.remove('active'));
                if (typeof updatePropertiesPanel === 'function') {
                    updatePropertiesPanel(null);
                }
                eventBus.emit(EVENTS.BLOCK_DESELECTED);
            }
        };
    }
}

let resizeState = null;

export function startResize(e, blockId, direction) {
    const block = getBlock(blockId);
    if (!block) return;
    const el = document.querySelector(`.ve-block[data-id="${blockId}"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const isShift = e.shiftKey;
    const isAlt = e.altKey;
    const aspectRatio = (block.styles.width || 200) / (block.styles.height || 150);
    resizeState = {
        blockId: blockId,
        direction: direction,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: block.styles.width || 200,
        startHeight: block.styles.height || 150,
        startLeft: block.styles.left || 0,
        startTop: block.styles.top || 0,
        isShift: isShift,
        isAlt: isAlt,
        aspectRatio: aspectRatio
    };
    el.classList.add('ve-resizing');
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
    document.addEventListener('touchmove', onResizeTouchMove, { passive: false });
    document.addEventListener('touchend', onResizeTouchEnd);
}

function onResizeMove(e) {
    if (!resizeState) return;
    e.preventDefault();
    applyResize(e.clientX, e.clientY, e.shiftKey, e.altKey);
}

function onResizeTouchMove(e) {
    if (!resizeState) return;
    e.preventDefault();
    const touch = e.touches[0];
    applyResize(touch.clientX, touch.clientY, false, false);
}

function applyResize(clientX, clientY, isShift, isAlt) {
    const { blockId, direction, startX, startY, startWidth, startHeight, startLeft, startTop, aspectRatio } = resizeState;
    const block = getBlock(blockId);
    if (!block) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;

    if (direction.includes('e')) {
        newWidth = Math.max(20, startWidth + dx);
        if (isShift) newHeight = newWidth / aspectRatio;
    }
    if (direction.includes('w')) {
        newWidth = Math.max(20, startWidth - dx);
        if (isShift) newHeight = newWidth / aspectRatio;
        if (isAlt) newLeft = startLeft + dx / 2;
        else newLeft = startLeft + dx;
    }
    if (direction.includes('s')) {
        newHeight = Math.max(20, startHeight + dy);
        if (isShift) newWidth = newHeight * aspectRatio;
    }
    if (direction.includes('n')) {
        newHeight = Math.max(20, startHeight - dy);
        if (isShift) newWidth = newHeight * aspectRatio;
        if (isAlt) newTop = startTop + dy / 2;
        else newTop = startTop + dy;
    }

    if (isAlt) {
        if (direction.includes('e')) newLeft = startLeft - (newWidth - startWidth) / 2;
        if (direction.includes('s')) newTop = startTop - (newHeight - startHeight) / 2;
    }

    newWidth = Math.round(newWidth);
    newHeight = Math.round(newHeight);
    newLeft = Math.round(newLeft);
    newTop = Math.round(newTop);

    block.styles.width = newWidth;
    block.styles.height = newHeight;
    block.styles.left = newLeft;
    block.styles.top = newTop;

    const el = document.querySelector(`.ve-block[data-id="${blockId}"]`);
    if (el) {
        el.style.width = newWidth + 'px';
        el.style.height = newHeight + 'px';
        el.style.left = newLeft + 'px';
        el.style.top = newTop + 'px';
    }
    updateBlockPositions();
}

function onResizeEnd(e) {
    if (!resizeState) return;
    const el = document.querySelector(`.ve-block[data-id="${resizeState.blockId}"]`);
    if (el) el.classList.remove('ve-resizing');
    if (resizeState.blockId) {
        saveHistory();
        state.hasUnsaved = true;
        updateBlockPositions();
        eventBus.emit(EVENTS.BLOCK_RESIZED, { blockId: resizeState.blockId });
    }
    resizeState = null;
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
    document.removeEventListener('touchmove', onResizeTouchMove);
    document.removeEventListener('touchend', onResizeTouchEnd);
}

function onResizeTouchEnd(e) {
    onResizeEnd(e);
}

let rotateState = null;

export function startRotate(e, blockId) {
    const block = getBlock(blockId);
    if (!block) return;
    const el = document.querySelector(`.ve-block[data-id="${blockId}"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
    rotateState = {
        blockId: blockId,
        centerX: centerX,
        centerY: centerY,
        startAngle: startAngle,
        startRotate: block.styles.rotate || 0
    };
    document.addEventListener('mousemove', onRotateMove);
    document.addEventListener('mouseup', onRotateEnd);
    document.addEventListener('touchmove', onRotateTouchMove, { passive: false });
    document.addEventListener('touchend', onRotateTouchEnd);
}

function onRotateMove(e) {
    if (!rotateState) return;
    e.preventDefault();
    applyRotate(e.clientX, e.clientY, e.shiftKey);
}

function onRotateTouchMove(e) {
    if (!rotateState) return;
    e.preventDefault();
    const touch = e.touches[0];
    applyRotate(touch.clientX, touch.clientY, false);
}

function applyRotate(clientX, clientY, isShift) {
    const { blockId, centerX, centerY, startAngle, startRotate } = rotateState;
    const block = getBlock(blockId);
    if (!block) return;
    const currentAngle = Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI;
    let delta = currentAngle - startAngle;
    let newRotate = startRotate + delta;
    if (isShift) newRotate = Math.round(newRotate / 15) * 15;
    block.styles.rotate = newRotate % 360;
    const el = document.querySelector(`.ve-block[data-id="${blockId}"]`);
    if (el) el.style.transform = `rotate(${newRotate}deg)`;
    updateBlockPositions();
}

function onRotateEnd(e) {
    if (!rotateState) return;
    if (rotateState.blockId) {
        saveHistory();
        state.hasUnsaved = true;
        updateBlockPositions();
        eventBus.emit(EVENTS.BLOCK_ROTATED, { blockId: rotateState.blockId });
    }
    rotateState = null;
    document.removeEventListener('mousemove', onRotateMove);
    document.removeEventListener('mouseup', onRotateEnd);
    document.removeEventListener('touchmove', onRotateTouchMove);
    document.removeEventListener('touchend', onRotateTouchEnd);
}

function onRotateTouchEnd(e) {
    onRotateEnd(e);
}

function highlightSelectedBlock() {
    document.querySelectorAll('.ve-block').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === state.selectedId);
    });
}

function handleDoubleClick(id) {
    const block = getBlock(id);
    if (!block) return;
    if (block.type === 'text') {
        const el = document.querySelector(`.ve-block[data-id="${id}"] .ve-text-editable`);
        if (el) el.focus();
    } else {
        selectBlock(id);
        highlightSelectedBlock();
        if (typeof updatePropertiesPanel === 'function') {
            updatePropertiesPanel(id);
        }
    }
}

let gridVisible = true;
let snapToGrid = true;
const GRID_SIZE = 20;

export function toggleGrid() {
    gridVisible = !gridVisible;
    updateGrid();
    showToast(gridVisible ? '📏 Сетка включена' : '📏 Сетка выключена', 'info');
    eventBus.emit(EVENTS.GRID_TOGGLED, { visible: gridVisible });
}

export function toggleSnap() {
    snapToGrid = !snapToGrid;
    window.snapToGrid = snapToGrid;
    showToast(snapToGrid ? '🔒 Привязка к сетке включена' : '🔓 Привязка к сетке выключена', 'info');
    eventBus.emit(EVENTS.SNAP_TOGGLED, { enabled: snapToGrid });
}

export function updateGrid() {
    const canvas = document.getElementById('veCanvas');
    if (!canvas) return;
    if (gridVisible) {
        canvas.style.setProperty('background-image', `
            linear-gradient(rgba(139, 92, 246, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.15) 1px, transparent 1px)
        `, 'important');
        canvas.style.setProperty('background-size', `${GRID_SIZE}px ${GRID_SIZE}px`, 'important');
        canvas.style.setProperty('background-color', 'transparent', 'important');
    } else {
        canvas.style.setProperty('background-image', 'none', 'important');
        canvas.style.setProperty('background-size', '', 'important');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => { gridVisible = true; updateGrid(); }, 100);
    });
} else {
    setTimeout(() => { gridVisible = true; updateGrid(); }, 100);
}