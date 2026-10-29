// ui/floatingPanel.js
import { blockMetadata } from '../blocks/index.js';
import { showToast } from './toolbar.js';

let panelVisible = true;
let panelExpanded = true;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let currentPin = 'top-right';
let initialized = false;

function loadState() {
    try {
        const saved = localStorage.getItem('ve_floating_panel_state');
        if (saved) {
            const state = JSON.parse(saved);
            if (state.pin) currentPin = state.pin;
            if (state.visible !== undefined) panelVisible = state.visible;
            if (state.expanded !== undefined) panelExpanded = state.expanded;
            return state;
        }
    } catch (e) {}
    return null;
}

function saveState() {
    try {
        localStorage.setItem('ve_floating_panel_state', JSON.stringify({
            pin: currentPin,
            visible: panelVisible,
            expanded: panelExpanded
        }));
    } catch (e) {}
}

export function initFloatingPanel() {
    if (initialized) {
        console.warn('⚠️ Плавающая панель уже инициализирована, пропускаем');
        return;
    }
    initialized = true;

    const savedState = loadState();

    const panel = document.createElement('div');
    panel.id = 'veFloatingPanel';
    panel.className = 've-floating-panel';
    panel.innerHTML = `
        <div class="ve-floating-header" id="veFloatingHeader">
            <span><i class="fas fa-cubes"></i> Блоки</span>
            <div class="ve-floating-actions">
                <button id="veFloatingPin" title="Закрепить в углу"><i class="fas fa-thumbtack"></i></button>
                <button id="veFloatingToggle" title="Свернуть/развернуть"><i class="fas fa-chevron-up"></i></button>
                <button id="veFloatingClose" title="Закрыть"><i class="fas fa-times"></i></button>
            </div>
        </div>
        <div class="ve-floating-body" id="veFloatingBody">
            <div class="ve-floating-search">
                <input type="text" id="veFloatingSearch" placeholder="Поиск блоков...">
            </div>
            <div class="ve-floating-grid" id="veFloatingGrid"></div>
        </div>
    `;

    document.body.appendChild(panel);

    if (savedState) {
        if (savedState.pin) {
            currentPin = savedState.pin;
            applyPin(currentPin, panel);
        }
        if (savedState.visible !== undefined) {
            panelVisible = savedState.visible;
        }
        if (savedState.expanded !== undefined) {
            panelExpanded = savedState.expanded;
        }
        if (!panelVisible) {
            panel.classList.add('ve-floating-panel-hidden');
        } else {
            panel.classList.remove('ve-floating-panel-hidden');
            toggleBody(panel, panelExpanded);
        }
    } else {
        panel.classList.remove('ve-floating-panel-hidden');
        panelExpanded = true;
        panelVisible = true;
        toggleBody(panel, true);
        applyPin('top-right', panel);
    }

    renderFloatingGrid();

    // ===== КНОПКА В ТУЛБАРЕ (УНИКАЛЬНЫЙ ID) =====
    if (!document.getElementById('veFloatingPanelBtn')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'veFloatingPanelBtn';
        toggleBtn.className = 've-btn ve-btn-primary';
        toggleBtn.innerHTML = '<i class="fas fa-cubes"></i> <span>Блоки</span>';
        toggleBtn.title = 'Открыть панель блоков';
        
        const toolbarGroup = document.querySelector('.ve-toolbar-group:first-child');
        if (toolbarGroup) {
            const exportBtn = document.getElementById('exportHtmlBtn');
            if (exportBtn) {
                toolbarGroup.insertBefore(toggleBtn, exportBtn);
            } else {
                toolbarGroup.appendChild(toggleBtn);
            }
        }

        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (panelVisible) {
                closePanel(panel);
            } else {
                openPanel(panel);
            }
        });
    }

    document.getElementById('veFloatingClose')?.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('🔴 Крестик нажат, закрываем панель');
        closePanel(panel);
    });

    document.getElementById('veFloatingToggle')?.addEventListener('click', function() {
        panelExpanded = !panelExpanded;
        toggleBody(panel, panelExpanded);
        const icon = this.querySelector('i');
        if (icon) {
            icon.className = panelExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
        }
        saveState();
    });

    document.getElementById('veFloatingPin')?.addEventListener('click', function() {
        cyclePin(panel);
    });

    document.getElementById('veFloatingSearch')?.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const items = document.querySelectorAll('.ve-floating-item');
        items.forEach(item => {
            const name = item.dataset.name?.toLowerCase() || '';
            const icon = item.querySelector('.ve-floating-item-icon i')?.className || '';
            const searchable = name + ' ' + icon;
            item.style.display = searchable.includes(query) ? 'flex' : 'none';
        });
    });

    const header = document.getElementById('veFloatingHeader');
    if (header) {
        header.addEventListener('mousedown', function(e) {
            if (e.target.closest('.ve-floating-actions')) return;
            if (currentPin) {
                currentPin = null;
                panel.style.left = 'auto';
                panel.style.right = '20px';
                panel.style.top = '80px';
                panel.style.bottom = 'auto';
                panel.style.transform = 'none';
                saveState();
            }
            isDragging = true;
            const rect = panel.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            panel.style.cursor = 'grabbing';
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
        });

        header.addEventListener('touchstart', function(e) {
            if (e.target.closest('.ve-floating-actions')) return;
            const touch = e.touches[0];
            const rect = panel.getBoundingClientRect();
            dragOffsetX = touch.clientX - rect.left;
            dragOffsetY = touch.clientY - rect.top;
            isDragging = true;
            document.addEventListener('touchmove', onTouchDrag, { passive: false });
            document.addEventListener('touchend', stopTouchDrag);
        }, { passive: true });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && panelVisible) {
            closePanel(panel);
        }
    });

    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            handleResponsive(panel);
        }, 200);
    });
    handleResponsive(panel);

    console.log('✅ Плавающая панель блоков инициализирована (защита от дублирования)');
}

function renderFloatingGrid() {
    const grid = document.getElementById('veFloatingGrid');
    if (!grid) return;

    const categories = {};
    for (const [type, meta] of Object.entries(blockMetadata)) {
        const category = meta.category || 'Другое';
        if (!categories[category]) categories[category] = [];
        categories[category].push({ type, ...meta });
    }

    let html = '';
    for (const [categoryName, blocks] of Object.entries(categories)) {
        html += `<div class="ve-floating-category">
            <div class="ve-floating-category-title">${categoryName}</div>
            <div class="ve-floating-category-grid">`;

        for (const block of blocks) {
            html += `<div class="ve-floating-item" data-type="${block.type}" data-name="${block.name}">
                <div class="ve-floating-item-icon"><i class="fas ${block.icon}"></i></div>
                <div class="ve-floating-item-name">${block.name}</div>
            </div>`;
        }

        html += `</div></div>`;
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.ve-floating-item').forEach(item => {
        item.addEventListener('click', function() {
            const type = this.dataset.type;
            if (typeof window.addBlock === 'function') {
                window.addBlock(type);
                showToast(`➕ Блок добавлен`, 'success');
            } else {
                showToast('Ошибка: addBlock не найден', 'error');
            }
        });

        item.addEventListener('mousedown', function(e) {
            if (typeof window.dragManager?.startFromPanel === 'function') {
                window.dragManager.startFromPanel(this, this.dataset.type);
            }
        });
    });
}

function toggleBody(panel, expanded) {
    const body = document.getElementById('veFloatingBody');
    if (body) {
        body.style.display = expanded ? 'block' : 'none';
    }
    const toggleBtn = document.getElementById('veFloatingToggle');
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        if (icon) {
            icon.className = expanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
        }
    }
}

function openPanel(panel) {
    panelVisible = true;
    panel.classList.remove('ve-floating-panel-hidden');
    panel.style.display = 'flex';
    toggleBody(panel, panelExpanded);
    saveState();
    const btn = document.getElementById('veFloatingPanelBtn');
    if (btn) btn.classList.add('active');
}

function closePanel(panel) {
    panelVisible = false;
    panel.classList.add('ve-floating-panel-hidden');
    panel.style.display = 'none';
    saveState();
    const btn = document.getElementById('veFloatingPanelBtn');
    if (btn) btn.classList.remove('active');
    console.log('🔴 Панель закрыта');
}

function cyclePin(panel) {
    const pins = ['top-right', 'bottom-right', 'bottom-left', 'top-left'];
    let idx = pins.indexOf(currentPin);
    idx = (idx + 1) % pins.length;
    currentPin = pins[idx];
    applyPin(currentPin, panel);
    saveState();
    showToast(`📌 Панель закреплена: ${currentPin.replace('-', ' → ')}`, 'info');
}

function applyPin(pin, panel) {
    panel.style.transform = 'none';
    panel.style.left = 'auto';
    panel.style.right = 'auto';
    panel.style.top = 'auto';
    panel.style.bottom = 'auto';
    switch (pin) {
        case 'top-right':
            panel.style.right = '20px';
            panel.style.top = '80px';
            break;
        case 'bottom-right':
            panel.style.right = '20px';
            panel.style.bottom = '80px';
            break;
        case 'bottom-left':
            panel.style.left = '20px';
            panel.style.bottom = '80px';
            break;
        case 'top-left':
            panel.style.left = '20px';
            panel.style.top = '80px';
            break;
        default:
            panel.style.right = '20px';
            panel.style.top = '80px';
    }
    const pinBtn = document.getElementById('veFloatingPin');
    if (pinBtn) {
        const idx = ['top-right', 'bottom-right', 'bottom-left', 'top-left'].indexOf(pin);
        pinBtn.innerHTML = `<i class="fas fa-thumbtack" style="transform:rotate(${idx * 90}deg);"></i>`;
    }
}

function handleResponsive(panel) {
    const isMobile = window.innerWidth < 768;
    if (isMobile && panelVisible) {
        if (panelExpanded) {
            panelExpanded = false;
            toggleBody(panel, false);
            saveState();
        }
        panel.style.width = '240px';
        panel.style.maxHeight = '50vh';
    } else if (!isMobile) {
        panel.style.width = '';
        panel.style.maxHeight = '';
    }
}

function onDrag(e) {
    if (!isDragging) return;
    const panel = document.getElementById('veFloatingPanel');
    if (!panel) return;
    const x = e.clientX - dragOffsetX;
    const y = e.clientY - dragOffsetY;
    panel.style.left = Math.max(0, x) + 'px';
    panel.style.top = Math.max(0, y) + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    if (currentPin) {
        currentPin = null;
        saveState();
        const pinBtn = document.getElementById('veFloatingPin');
        if (pinBtn) pinBtn.innerHTML = '<i class="fas fa-thumbtack"></i>';
    }
}

function stopDrag() {
    isDragging = false;
    const panel = document.getElementById('veFloatingPanel');
    if (panel) {
        panel.style.cursor = 'default';
        autoPin(panel);
    }
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
}

function onTouchDrag(e) {
    if (!isDragging) return;
    e.preventDefault();
    const panel = document.getElementById('veFloatingPanel');
    if (!panel) return;
    const touch = e.touches[0];
    const x = touch.clientX - dragOffsetX;
    const y = touch.clientY - dragOffsetY;
    panel.style.left = Math.max(0, x) + 'px';
    panel.style.top = Math.max(0, y) + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    if (currentPin) {
        currentPin = null;
        saveState();
        const pinBtn = document.getElementById('veFloatingPin');
        if (pinBtn) pinBtn.innerHTML = '<i class="fas fa-thumbtack"></i>';
    }
}

function stopTouchDrag() {
    isDragging = false;
    const panel = document.getElementById('veFloatingPanel');
    if (panel) {
        autoPin(panel);
    }
    document.removeEventListener('touchmove', onTouchDrag);
    document.removeEventListener('touchend', stopTouchDrag);
}

function autoPin(panel) {
    const rect = panel.getBoundingClientRect();
    const threshold = 80;
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    let newPin = null;
    if (rect.left < threshold) {
        if (rect.top < threshold) newPin = 'top-left';
        else if (rect.bottom > winH - threshold) newPin = 'bottom-left';
        else newPin = 'top-left';
    } else if (rect.right > winW - threshold) {
        if (rect.top < threshold) newPin = 'top-right';
        else if (rect.bottom > winH - threshold) newPin = 'bottom-right';
        else newPin = 'top-right';
    }
    if (newPin) {
        currentPin = newPin;
        applyPin(currentPin, panel);
        saveState();
        showToast(`📌 Панель закреплена: ${currentPin.replace('-', ' → ')}`, 'info');
    }
}

export function toggleFloatingPanel() {
    const panel = document.getElementById('veFloatingPanel');
    if (!panel) return;
    if (panelVisible) {
        closePanel(panel);
    } else {
        openPanel(panel);
    }
}

export function openFloatingPanel() {
    const panel = document.getElementById('veFloatingPanel');
    if (panel) openPanel(panel);
}

export function closeFloatingPanel() {
    const panel = document.getElementById('veFloatingPanel');
    if (panel) closePanel(panel);
}