// core/state.js
export const state = {
    blocks: [],
    selectedId: null,
    history: [],
    historyIndex: -1,
    isDirty: false,
    pageId: 0,
    projectId: 0,
    global: {},
    templates: [],
    hasUnsaved: false,
    isSaving: false,
    positionMode: 'flow',
    components: []
};

export function setBlocks(blocks) {
    state.blocks = blocks;
    state.isDirty = true;
}

export function addBlock(block, parentId = null) {
    block.parentId = parentId;
    if (parentId) {
        const parent = state.blocks.find(b => b.id === parentId);
        if (parent) {
            if (!parent.children) parent.children = [];
            parent.children.push(block.id);
        }
    }
    state.blocks.push(block);
    state.isDirty = true;
    state.hasUnsaved = true;
}

export function updateBlock(id, updates) {
    const index = state.blocks.findIndex(b => b.id === id);
    if (index !== -1) {
        state.blocks[index] = { ...state.blocks[index], ...updates };
        state.isDirty = true;
        state.hasUnsaved = true;
    }
}

export function deleteBlock(id) {
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
    state.isDirty = true;
    state.hasUnsaved = true;
}

export function selectBlock(id) {
    state.selectedId = id;
}

export function clearSelection() {
    state.selectedId = null;
}

export function getBlock(id) {
    return state.blocks.find(b => b.id === id);
}

export function getChildren(parentId) {
    return state.blocks.filter(b => b.parentId === parentId);
}

export function getSelectedBlock() {
    return state.selectedId ? getBlock(state.selectedId) : null;
}

export function markSaved() {
    state.isDirty = false;
    state.hasUnsaved = false;
}

export function markUnsaved() {
    state.hasUnsaved = true;
}

export function togglePositionMode() {
    state.positionMode = state.positionMode === 'flow' ? 'free' : 'flow';
    for (const block of state.blocks) {
        if (state.positionMode === 'free') {
            block.styles.position = 'absolute';
            if (!block.styles.left) block.styles.left = 50 + Math.random() * 100;
            if (!block.styles.top) block.styles.top = 50 + Math.random() * 100;
        } else {
            block.styles.position = 'relative';
            block.styles.left = undefined;
            block.styles.top = undefined;
        }
    }
    return state.positionMode;
}

export function saveComponent(name) {
    const selectedBlocks = state.blocks.filter(b => b.id === state.selectedId);
    if (selectedBlocks.length === 0) {
        return false;
    }
    const getBlockTree = (id) => {
        const block = getBlock(id);
        if (!block) return null;
        const children = getChildren(id);
        return {
            ...block,
            children: children.map(c => getBlockTree(c.id)).filter(Boolean)
        };
    };
    const componentData = selectedBlocks.map(b => getBlockTree(b.id)).filter(Boolean);
    const id = 'component_' + Date.now();
    const component = {
        id: id,
        name: name,
        data: componentData,
        created: new Date().toISOString()
    };
    state.components = state.components || [];
    state.components.push(component);
    localStorage.setItem('ve_components', JSON.stringify(state.components));
    return component;
}