// core/transform.js
import { state, getBlock, updateBlock } from './state.js';
import { reRenderBlock } from './renderer.js';
import { saveHistory } from './history.js';
import { showToast } from '../ui/toolbar.js';

export let transformState = {
    isResizing: false,
    blockId: null,
    direction: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0,
    startRotate: 0,
    isShift: false,
    isAlt: false,
    aspectRatio: 1
};

export function initTransform() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') transformState.isShift = true;
        if (e.key === 'Alt') transformState.isAlt = true;
    });
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') transformState.isShift = false;
        if (e.key === 'Alt') transformState.isAlt = false;
    });
}

export function startResize(e, blockId, direction) {
    const block = getBlock(blockId);
    if (!block) return;

    const el = document.querySelector(`.ve-block[data-id="${blockId}"]`);
    if (!el) return;

    const rect = el.getBoundingClientRect();

    transformState.isResizing = true;
    transformState.blockId = blockId;
    transformState.direction = direction;
    transformState.startX = e.clientX;
    transformState.startY = e.clientY;
    transformState.startWidth = block.styles.width || 200;
    transformState.startHeight = block.styles.height || 150;
    transformState.startLeft = block.styles.left || 0;
    transformState.startTop = block.styles.top || 0;
    transformState.startRotate = block.styles.rotate || 0;
    transformState.aspectRatio = (block.styles.width || 200) / (block.styles.height || 150);
    transformState.isShift = e.shiftKey;
    transformState.isAlt = e.altKey;

    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
    document.addEventListener('touchmove', onResizeTouchMove, { passive: false });
    document.addEventListener('touchend', onResizeTouchEnd);

    // Добавляем класс на блок
    el.classList.add('ve-resizing');

    return { blockId, direction };
}

function onResizeMove(e) {
    if (!transformState.isResizing) return;
    e.preventDefault();
    applyResize(e.clientX, e.clientY);
}

function onResizeTouchMove(e) {
    if (!transformState.isResizing) return;
    e.preventDefault();
    const touch = e.touches[0];
    applyResize(touch.clientX, touch.clientY);
}

function applyResize(clientX, clientY) {
    const { blockId, direction, startX, startY, startWidth, startHeight, startLeft, startTop, aspectRatio, isShift, isAlt } = transformState;
    const block = getBlock(blockId);
    if (!block) return;

    const dx = clientX - startX;
    const dy = clientY - startY;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;

    // Ресайз в зависимости от направления
    if (direction.includes('e')) {
        newWidth = Math.max(20, startWidth + dx);
        if (isShift) {
            newHeight = newWidth / aspectRatio;
        }
    }
    if (direction.includes('w')) {
        newWidth = Math.max(20, startWidth - dx);
        if (isShift) {
            newHeight = newWidth / aspectRatio;
        }
        if (isAlt) {
            newLeft = startLeft + dx / 2;
        } else {
            newLeft = startLeft + dx;
        }
    }
    if (direction.includes('s')) {
        newHeight = Math.max(20, startHeight + dy);
        if (isShift) {
            newWidth = newHeight * aspectRatio;
        }
    }
    if (direction.includes('n')) {
        newHeight = Math.max(20, startHeight - dy);
        if (isShift) {
            newWidth = newHeight * aspectRatio;
        }
        if (isAlt) {
            newTop = startTop + dy / 2;
        } else {
            newTop = startTop + dy;
        }
    }

    // Если Alt — ресайз от центра
    if (isAlt) {
        if (direction.includes('e')) {
            newLeft = startLeft - (newWidth - startWidth) / 2;
        }
        if (direction.includes('s')) {
            newTop = startTop - (newHeight - startHeight) / 2;
        }
    }

    // Округление до пикселей
    newWidth = Math.round(newWidth);
    newHeight = Math.round(newHeight);
    newLeft = Math.round(newLeft);
    newTop = Math.round(newTop);

    block.styles.width = newWidth;
    block.styles.height = newHeight;
    block.styles.left = newLeft;
    block.styles.top = newTop;

    // Обновляем DOM
    const el = document.querySelector(`.ve-block[data-id="${blockId}"]`);
    if (el) {
        el.style.width = newWidth + 'px';
        el.style.height = newHeight + 'px';
        el.style.left = newLeft + 'px';
        el.style.top = newTop + 'px';
    }

    // Обновляем панель свойств
    if (typeof updateBlockPositions === 'function') {
        updateBlockPositions();
    }
}

function onResizeEnd(e) {
    if (!transformState.isResizing) return;
    const el = document.querySelector(`.ve-block[data-id="${transformState.blockId}"]`);
    if (el) el.classList.remove('ve-resizing');

    if (transformState.blockId) {
        saveHistory();
        state.hasUnsaved = true;
        if (typeof updateBlockPositions === 'function') {
            updateBlockPositions();
        }
    }

    transformState.isResizing = false;
    transformState.blockId = null;
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
    document.removeEventListener('touchmove', onResizeTouchMove);
    document.removeEventListener('touchend', onResizeTouchEnd);
}

function onResizeTouchEnd(e) {
    onResizeEnd(e);
}

export function rotateBlock(blockId, angle) {
    const block = getBlock(blockId);
    if (!block) return;
    block.styles.rotate = (block.styles.rotate || 0) + angle;
    reRenderBlock(blockId);
    saveHistory();
    state.hasUnsaved = true;
    if (typeof updateBlockPositions === 'function') {
        updateBlockPositions();
    }
    showToast(`🔄 Поворот: ${Math.round(block.styles.rotate)}°`, 'info');
}

export function setRotation(blockId, angle) {
    const block = getBlock(blockId);
    if (!block) return;
    block.styles.rotate = angle % 360;
    reRenderBlock(blockId);
    saveHistory();
    state.hasUnsaved = true;
}

export function moveLayerUp(blockId) {
    const block = getBlock(blockId);
    if (!block) return;
    const currentZ = block.styles.zIndex || 1;
    const maxZ = Math.max(...state.blocks.map(b => b.styles.zIndex || 1));
    if (currentZ < maxZ) {
        // Находим следующий слой
        const nextBlock = state.blocks.find(b => (b.styles.zIndex || 1) > currentZ);
        if (nextBlock) {
            const nextZ = nextBlock.styles.zIndex || 1;
            block.styles.zIndex = nextZ;
            nextBlock.styles.zIndex = currentZ;
        } else {
            block.styles.zIndex = maxZ + 1;
        }
        reRenderBlock(blockId);
        saveHistory();
        state.hasUnsaved = true;
        showToast('⬆️ Слой вверх', 'success');
    }
}

export function moveLayerDown(blockId) {
    const block = getBlock(blockId);
    if (!block) return;
    const currentZ = block.styles.zIndex || 1;
    const minZ = Math.min(...state.blocks.map(b => b.styles.zIndex || 1));
    if (currentZ > minZ) {
        const prevBlock = state.blocks.find(b => (b.styles.zIndex || 1) < currentZ);
        if (prevBlock) {
            const prevZ = prevBlock.styles.zIndex || 1;
            block.styles.zIndex = prevZ;
            prevBlock.styles.zIndex = currentZ;
        } else {
            block.styles.zIndex = Math.max(1, minZ - 1);
        }
        reRenderBlock(blockId);
        saveHistory();
        state.hasUnsaved = true;
        showToast('⬇️ Слой вниз', 'success');
    }
}