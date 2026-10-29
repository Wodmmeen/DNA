// core/dragManager.js
import { state, getBlock, addBlock } from './state.js';
import { renderCanvas, reRenderBlock } from './renderer.js';
import { renderLayers, updateBlocksCount } from '../ui/sidebar.js';
import { saveHistory } from './history.js';
import { showToast } from '../ui/toolbar.js';

class DragManager {
    constructor() {
        this.isDragging = false;
        this.dragType = null;
        this.dragData = null;
        this.sourceIndex = -1;
        this.ghost = null;
        this.indicator = null;
        this.dropIndex = -1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.canvas = null;
        this.dropTarget = null;
        this.isAltPressed = false;
        this.selectedBlocks = [];
        this.bindEvents();
        this.createIndicator();
        this.setupKeyboardListeners();
    }

    bindEvents() {
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onTouchEnd.bind(this));
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Alt') this.isAltPressed = true;
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Alt') this.isAltPressed = false;
        });
    }

    createIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.className = 've-drop-indicator';
        this.indicator.style.cssText = `
            height: 4px;
            background: var(--accent);
            border-radius: 2px;
            margin: 8px 0;
            display: none;
            transition: opacity 0.15s ease;
            box-shadow: 0 0 10px var(--accent-glow);
        `;
        this.canvas = document.getElementById('veCanvas');
        if (this.canvas) {
            this.canvas.appendChild(this.indicator);
        }
    }

    startFromPanel(element, blockType) {
        if (this.isDragging) return;
        this.isDragging = true;
        this.dragType = 'from-panel';
        this.dragData = { type: blockType };
        const rect = element.getBoundingClientRect();
        this.offsetX = rect.width / 2;
        this.offsetY = rect.height / 2;
        this.createGhost(element, blockType);
        this.canvas?.classList.add('ve-drop-active');
        document.body.style.cursor = 'grabbing';
    }

    startFromCanvas(element, blockId) {
        if (this.isDragging) return;
        const block = getBlock(blockId);
        if (!block) return;
        this.isDragging = true;
        this.dragType = 'from-canvas';
        this.dragData = block;
        this.sourceIndex = state.blocks.findIndex(b => b.id === blockId);
        this.selectedBlocks = [blockId];
        const rect = element.getBoundingClientRect();
        this.offsetX = 20;
        this.offsetY = 20;
        this.createGhost(element, block.type, block);
        const el = document.querySelector(`.ve-block[data-id="${blockId}"]`);
        if (el) {
            el.style.opacity = '0.3';
            el.dataset.dragging = 'true';
        }
        document.body.style.cursor = 'grabbing';
    }

    createGhost(sourceElement, blockType, blockData = null) {
        this.removeGhost();
        this.ghost = document.createElement('div');
        this.ghost.className = 've-drag-ghost';
        let content = '';
        if (blockData) {
            const clone = sourceElement.cloneNode(true);
            clone.style.cssText = '';
            clone.classList.add('ve-ghost-content');
            content = clone.outerHTML;
        } else {
            const meta = window.blockMetadata?.[blockType];
            content = `
                <div class="ve-ghost-card">
                    <i class="fas ${meta?.icon || 'fa-cube'}"></i>
                    <span>${meta?.name || blockType}</span>
                </div>
            `;
        }
        this.ghost.innerHTML = content;
        this.ghost.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 100000;
            opacity: 0.85;
            transform: scale(1.02) rotate(-2deg);
            transition: none;
            filter: drop-shadow(0 10px 30px rgba(0,0,0,0.4));
            max-width: 280px;
            background: var(--bg-secondary);
            border: 2px solid var(--accent);
            border-radius: 12px;
            padding: 12px 16px;
            color: var(--text-primary);
        `;
        document.body.appendChild(this.ghost);
        const e = window.event || { clientX: 0, clientY: 0 };
        this.updateGhostPosition(e);
    }

    updateGhostPosition(e) {
        if (!this.ghost) return;
        const x = (e.clientX || 0) - this.offsetX;
        const y = (e.clientY || 0) - this.offsetY;
        this.ghost.style.left = x + 'px';
        this.ghost.style.top = y + 'px';
    }

    findDropTarget(clientX, clientY) {
        const elements = document.elementsFromPoint(clientX, clientY);
        for (const el of elements) {
            if (el.classList?.contains('ve-block-container')) {
                const id = el.closest('.ve-block')?.dataset.id;
                if (id) return getBlock(id);
            }
            if (el.classList?.contains('ve-block-children')) {
                const parentId = el.dataset.parent;
                if (parentId) return getBlock(parentId);
            }
        }
        return null;
    }

    findDropIndex(clientY, container) {
        if (!container) return -1;
        const children = container.querySelectorAll('.ve-block:not([data-dragging="true"])');
        if (children.length === 0) return 0;
        for (let i = 0; i < children.length; i++) {
            const rect = children[i].getBoundingClientRect();
            if (clientY < rect.top + rect.height / 2) return i;
        }
        return children.length;
    }

    showIndicator(index, container) {
        if (!this.indicator) return;
        if (index === -1 || !container) {
            this.indicator.style.display = 'none';
            return;
        }
        this.indicator.style.display = 'block';
        const children = container.querySelectorAll('.ve-block:not([data-dragging="true"])');
        if (children.length === 0 || index >= children.length) {
            container.appendChild(this.indicator);
        } else {
            container.insertBefore(this.indicator, children[index]);
        }
        this.dropIndex = index;
        this.dropTarget = container.closest('.ve-block')?.dataset.id || null;
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.updateGhostPosition(e);
        this.handleDragOver(e.clientX, e.clientY);
        this.handleAutoScroll(e.clientX, e.clientY);
    }

    onTouchMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        this.updateGhostPosition(touch);
        this.handleDragOver(touch.clientX, touch.clientY);
        this.handleAutoScroll(touch.clientX, touch.clientY);
    }

    handleAutoScroll(clientX, clientY) {
        if (!this.canvas) return;
        const wrapper = this.canvas.parentElement;
        if (!wrapper) return;
        const rect = wrapper.getBoundingClientRect();
        const threshold = 60;
        let scrollX = 0, scrollY = 0;
        if (clientX < rect.left + threshold) scrollX = -10;
        else if (clientX > rect.right - threshold) scrollX = 10;
        if (clientY < rect.top + threshold) scrollY = -10;
        else if (clientY > rect.bottom - threshold) scrollY = 10;
        if (scrollX || scrollY) {
            wrapper.scrollLeft += scrollX;
            wrapper.scrollTop += scrollY;
        }
    }

    handleDragOver(clientX, clientY) {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const isOver = clientX >= rect.left && clientX <= rect.right &&
                       clientY >= rect.top && clientY <= rect.bottom;

        if (!isOver) {
            this.indicator.style.display = 'none';
            this.dropIndex = -1;
            this.canvas.classList.remove('ve-drop-active');
            return;
        }

        this.canvas.classList.add('ve-drop-active');
        
        const targetBlock = this.findDropTarget(clientX, clientY);
        let container = this.canvas;
        let index = this.findDropIndex(clientY, container);
        
        if (targetBlock && targetBlock.type === 'container') {
            const containerEl = document.querySelector(`.ve-block[data-id="${targetBlock.id}"] .ve-block-children`);
            if (containerEl) {
                container = containerEl;
                index = this.findDropIndex(clientY, container);
            }
        }
        
        this.showIndicator(index, container);
    }

    onMouseUp(e) {
        if (!this.isDragging) return;
        this.completeDrag(e);
    }

    onTouchEnd(e) {
        if (!this.isDragging) return;
        this.completeDrag(e.changedTouches[0]);
    }

    completeDrag(e) {
        this.canvas?.classList.remove('ve-drop-active');
        document.body.style.cursor = '';

        if (this.dragType === 'from-canvas') {
            for (const id of this.selectedBlocks) {
                const el = document.querySelector(`.ve-block[data-id="${id}"]`);
                if (el) {
                    el.style.opacity = '';
                    el.dataset.dragging = '';
                }
            }
        }

        if (this.isAltPressed && this.dragType === 'from-canvas') {
            this.duplicateSelected();
            this.isDragging = false;
            this.selectedBlocks = [];
            this.removeGhost();
            if (this.indicator) this.indicator.style.display = 'none';
            return;
        }

        if (this.dropIndex !== -1 && this.isDragging) {
            this.performDrop();
        }

        this.removeGhost();
        if (this.indicator) this.indicator.style.display = 'none';
        this.isDragging = false;
        this.dragType = null;
        this.dragData = null;
        this.dropIndex = -1;
        this.dropTarget = null;
        this.selectedBlocks = [];
    }

    duplicateSelected() {
        const blocksToCopy = this.selectedBlocks.length > 0 ? this.selectedBlocks : [this.dragData.id];
        const newBlocks = [];
        for (const id of blocksToCopy) {
            const orig = getBlock(id);
            if (!orig) continue;
            const copy = JSON.parse(JSON.stringify(orig));
            copy.id = 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            copy.styles.left = (orig.styles.left || 0) + 30;
            copy.styles.top = (orig.styles.top || 0) + 30;
            if (orig.parentId) {
                const parent = getBlock(orig.parentId);
                if (parent && parent.children) {
                    parent.children.push(copy.id);
                }
            }
            newBlocks.push(copy);
            state.blocks.push(copy);
        }
        state.hasUnsaved = true;
        saveHistory();
        renderCanvas();
        renderLayers();
        updateBlocksCount();
        showToast(`📋 Скопировано ${newBlocks.length} блоков`, 'success');
    }

    performDrop() {
        const index = this.dropIndex;
        const targetParentId = this.dropTarget;

        if (this.dragType === 'from-panel') {
            const blockType = this.dragData.type;
            const def = window.blockMetadata?.[blockType];
            if (def) {
                const newBlock = {
                    id: 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    type: blockType,
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
                        position: state.positionMode === 'free' ? 'absolute' : 'relative'
                    }
                };
                if (targetParentId && getBlock(targetParentId)?.type === 'container') {
                    newBlock.parentId = targetParentId;
                }
                if (typeof window.addBlock === 'function') {
                    window.addBlock(newBlock);
                }
            }
        } else if (this.dragType === 'from-canvas') {
            const blocksToMove = this.selectedBlocks.length > 0 ? this.selectedBlocks : [this.dragData.id];
            
            for (const blockId of blocksToMove) {
                const block = getBlock(blockId);
                if (!block) continue;
                
                const oldParentId = block.parentId;
                if (oldParentId) {
                    const oldParent = getBlock(oldParentId);
                    if (oldParent && oldParent.children) {
                        oldParent.children = oldParent.children.filter(c => c !== blockId);
                    }
                }
                
                if (targetParentId && getBlock(targetParentId)?.type === 'container') {
                    block.parentId = targetParentId;
                    const newParent = getBlock(targetParentId);
                    if (newParent) {
                        if (!newParent.children) newParent.children = [];
                        newParent.children.push(blockId);
                    }
                } else {
                    block.parentId = null;
                }
                
                if (state.positionMode === 'free') {
                    const rect = this.ghost?.getBoundingClientRect();
                    if (rect) {
                        const canvasRect = this.canvas?.getBoundingClientRect();
                        if (canvasRect) {
                            const snapX = snapToGuides(rect.left - canvasRect.left, 'vertical');
                            const snapY = snapToGuides(rect.top - canvasRect.top, 'horizontal');
                            block.styles.left = snapX.snapped;
                            block.styles.top = snapY.snapped;
                        }
                    }
                }
            }
            
            state.hasUnsaved = true;
            saveHistory();
            renderCanvas();
            renderLayers();
            updateBlocksCount();
            showToast(`🔀 Блоки перемещены`, 'success');
        }
    }

    removeGhost() {
        if (this.ghost) {
            this.ghost.remove();
            this.ghost = null;
        }
    }

    destroy() {
        this.removeGhost();
        this.indicator?.remove();
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('touchmove', this.onTouchMove);
        document.removeEventListener('touchend', this.onTouchEnd);
    }
}

function snapToGuides(value, type) {
    return { snapped: value, snappedTo: null };
}

let dragManager = null;

export function initDragManager() {
    if (!dragManager) {
        dragManager = new DragManager();
        console.log('✅ DragManager инициализирован (Figma-уровень)');
    }
    return dragManager;
}

export function getDragManager() {
    return dragManager;
}