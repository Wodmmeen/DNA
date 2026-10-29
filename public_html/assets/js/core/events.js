// core/events.js
// Все события в одном месте — чтобы не ошибиться в названиях

export const EVENTS = {
    // ===== БЛОКИ =====
    BLOCK_ADDED: 'block:added',
    BLOCK_REMOVED: 'block:removed',
    BLOCK_UPDATED: 'block:updated',
    BLOCK_SELECTED: 'block:selected',
    BLOCK_DESELECTED: 'block:deselected',
    BLOCK_MOVED: 'block:moved',
    BLOCK_RESIZED: 'block:resized',
    BLOCK_ROTATED: 'block:rotated',
    BLOCK_DUPLICATED: 'block:duplicated',
    BLOCK_GROUPED: 'block:grouped',
    BLOCK_UNGROUPED: 'block:ungrouped',
    BLOCK_REORDERED: 'block:reordered',

    // ===== ХОЛСТ =====
    CANVAS_RENDERED: 'canvas:rendered',
    CANVAS_CLEARED: 'canvas:cleared',
    CANVAS_READY: 'canvas:ready',

    // ===== ИСТОРИЯ =====
    HISTORY_PUSHED: 'history:pushed',
    HISTORY_UNDO: 'history:undo',
    HISTORY_REDO: 'history:redo',

    // ===== СОХРАНЕНИЕ =====
    LAYOUT_SAVING: 'layout:saving',
    LAYOUT_SAVED: 'layout:saved',
    LAYOUT_LOADED: 'layout:loaded',
    LAYOUT_CHANGED: 'layout:changed',

    // ===== РЕЖИМ =====
    POSITION_MODE_CHANGED: 'position-mode:changed',

    // ===== СЕТКА =====
    GRID_TOGGLED: 'grid:toggled',
    SNAP_TOGGLED: 'snap:toggled',

    // ===== DRAG & DROP =====
    DRAG_STARTED: 'drag:started',
    DRAG_MOVED: 'drag:moved',
    DRAG_ENDED: 'drag:ended',
    DROP_COMPLETED: 'drop:completed',
    DROP_CANCELLED: 'drop:cancelled',

    // ===== UI =====
    TOAST_SHOWN: 'ui:toast',
    SIDEBAR_TOGGLED: 'ui:sidebar-toggled',
    PROPERTIES_OPENED: 'ui:properties-opened',
    PROPERTIES_CLOSED: 'ui:properties-closed',
    MODAL_OPENED: 'ui:modal-opened',
    MODAL_CLOSED: 'ui:modal-closed',

    // ===== КОМПОНЕНТЫ =====
    COMPONENT_SAVED: 'component:saved',
    COMPONENT_INSERTED: 'component:inserted',

    // ===== КАСТОМНЫЕ БЛОКИ =====
    CUSTOM_BLOCK_CREATED: 'custom-block:created',
    CUSTOM_BLOCK_REMOVED: 'custom-block:removed'
};

export default EVENTS;