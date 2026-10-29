// core/history.js
import { state, setBlocks, markUnsaved } from './state.js';

const MAX_HISTORY = 50;

export function saveHistory() {
    const snapshot = JSON.stringify(state.blocks);
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
    }
    state.history.push(snapshot);
    state.historyIndex = state.history.length - 1;
    if (state.history.length > MAX_HISTORY) {
        state.history.shift();
        state.historyIndex--;
    }
}

export function undo() {
    if (state.historyIndex > 0) {
        state.historyIndex--;
        const blocks = JSON.parse(state.history[state.historyIndex]);
        setBlocks(blocks);
        markUnsaved();
        if (typeof renderCanvas === 'function') {
            renderCanvas();
        }
        return true;
    }
    return false;
}

export function redo() {
    if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        const blocks = JSON.parse(state.history[state.historyIndex]);
        setBlocks(blocks);
        markUnsaved();
        if (typeof renderCanvas === 'function') {
            renderCanvas();
        }
        return true;
    }
    return false;
}

export function canUndo() {
    return state.historyIndex > 0;
}

export function canRedo() {
    return state.historyIndex < state.history.length - 1;
}

export function saveToLocalStorage() {
    try {
        localStorage.setItem('ve_editor_blocks_' + state.pageId, JSON.stringify(state.blocks));
        localStorage.setItem('ve_editor_global_' + state.pageId, JSON.stringify(state.global));
    } catch (e) {}
}

export function loadFromLocalStorage() {
    try {
        const blocks = localStorage.getItem('ve_editor_blocks_' + state.pageId);
        const global = localStorage.getItem('ve_editor_global_' + state.pageId);
        if (blocks) {
            state.blocks = JSON.parse(blocks);
            state.isDirty = true;
            state.hasUnsaved = true;
        }
        if (global) {
            state.global = JSON.parse(global);
        }
    } catch (e) {}
}