// core/guides.js
import { state } from './state.js';
import { renderCanvas } from './renderer.js';

export let guides = {
    vertical: [],
    horizontal: []
};

let isDraggingGuide = false;
let guideType = null;
let guideIndex = -1;
let guideStart = 0;

export function initGuides() {
    // Загружаем направляющие из localStorage
    try {
        const saved = localStorage.getItem('ve_guides');
        if (saved) {
            guides = JSON.parse(saved);
        }
    } catch (e) {}

    // Создаём контейнер для направляющих
    const container = document.getElementById('veCanvas');
    if (!container) return;

    // Добавляем линейки
    const rulers = document.createElement('div');
    rulers.className = 've-rulers';
    rulers.innerHTML = `
        <div class="ve-ruler ve-ruler-top">
            <div class="ve-ruler-inner" id="veRulerTop"></div>
        </div>
        <div class="ve-ruler ve-ruler-left">
            <div class="ve-ruler-inner" id="veRulerLeft"></div>
        </div>
    `;
    container.parentElement?.appendChild(rulers);

    // Создаём слой для направляющих
    const guidesLayer = document.createElement('div');
    guidesLayer.className = 've-guides-layer';
    guidesLayer.id = 'veGuidesLayer';
    container.appendChild(guidesLayer);

    renderGuides();
    setupGuideEvents();
}

export function renderGuides() {
    const layer = document.getElementById('veGuidesLayer');
    if (!layer) return;

    const container = document.getElementById('veCanvas');
    const rect = container.getBoundingClientRect();

    let html = '';

    // Вертикальные направляющие
    for (const pos of guides.vertical) {
        html += `<div class="ve-guide ve-guide-vertical" style="left:${pos - rect.left}px;"></div>`;
    }

    // Горизонтальные направляющие
    for (const pos of guides.horizontal) {
        html += `<div class="ve-guide ve-guide-horizontal" style="top:${pos - rect.top}px;"></div>`;
    }

    layer.innerHTML = html;
}

function setupGuideEvents() {
    const rulerTop = document.getElementById('veRulerTop');
    const rulerLeft = document.getElementById('veRulerLeft');

    if (rulerTop) {
        rulerTop.addEventListener('mousedown', (e) => startGuide(e, 'horizontal'));
        rulerTop.addEventListener('mousemove', (e) => {
            const x = e.clientX - rulerTop.getBoundingClientRect().left;
            rulerTop.querySelector('.ve-ruler-cursor')?.remove();
            const cursor = document.createElement('div');
            cursor.className = 've-ruler-cursor';
            cursor.style.left = x + 'px';
            cursor.textContent = Math.round(x);
            rulerTop.appendChild(cursor);
        });
        rulerTop.addEventListener('mouseleave', () => {
            rulerTop.querySelector('.ve-ruler-cursor')?.remove();
        });
    }

    if (rulerLeft) {
        rulerLeft.addEventListener('mousedown', (e) => startGuide(e, 'vertical'));
        rulerLeft.addEventListener('mousemove', (e) => {
            const y = e.clientY - rulerLeft.getBoundingClientRect().top;
            rulerLeft.querySelector('.ve-ruler-cursor')?.remove();
            const cursor = document.createElement('div');
            cursor.className = 've-ruler-cursor';
            cursor.style.top = y + 'px';
            cursor.textContent = Math.round(y);
            rulerLeft.appendChild(cursor);
        });
        rulerLeft.addEventListener('mouseleave', () => {
            rulerLeft.querySelector('.ve-ruler-cursor')?.remove();
        });
    }

    // Удаление направляющей по двойному клику
    document.addEventListener('dblclick', (e) => {
        const guide = e.target.closest('.ve-guide');
        if (guide) {
            const type = guide.classList.contains('ve-guide-vertical') ? 'vertical' : 'horizontal';
            const parent = guide.parentElement;
            const children = parent.querySelectorAll('.ve-guide');
            let index = 0;
            for (const child of children) {
                if (child === guide) break;
                index++;
            }
            guides[type].splice(index, 1);
            saveGuides();
            renderGuides();
        }
    });
}

function startGuide(e, type) {
    isDraggingGuide = true;
    guideType = type;
    guideStart = type === 'horizontal' ? e.clientY : e.clientX;

    const container = document.getElementById('veCanvas');
    const rect = container.getBoundingClientRect();

    // Создаём временную направляющую
    const temp = document.createElement('div');
    temp.className = 've-guide ve-guide-temp';
    if (type === 'horizontal') {
        temp.style.top = (e.clientY - rect.top) + 'px';
    } else {
        temp.style.left = (e.clientX - rect.left) + 'px';
    }
    document.getElementById('veGuidesLayer')?.appendChild(temp);

    document.addEventListener('mousemove', onGuideMove);
    document.addEventListener('mouseup', endGuide);
}

function onGuideMove(e) {
    if (!isDraggingGuide) return;
    const container = document.getElementById('veCanvas');
    const rect = container.getBoundingClientRect();
    const temp = document.querySelector('.ve-guide-temp');

    if (temp) {
        if (guideType === 'horizontal') {
            const pos = Math.round((e.clientY - rect.top) / 10) * 10;
            temp.style.top = pos + 'px';
        } else {
            const pos = Math.round((e.clientX - rect.left) / 10) * 10;
            temp.style.left = pos + 'px';
        }
    }
}

function endGuide(e) {
    if (!isDraggingGuide) return;
    isDraggingGuide = false;

    const temp = document.querySelector('.ve-guide-temp');
    if (temp) {
        const container = document.getElementById('veCanvas');
        const rect = container.getBoundingClientRect();
        const pos = guideType === 'horizontal' 
            ? parseInt(temp.style.top) 
            : parseInt(temp.style.left);

        if (pos > 10 && pos < (guideType === 'horizontal' ? rect.height - 10 : rect.width - 10)) {
            guides[guideType].push(pos + (guideType === 'horizontal' ? rect.top : rect.left));
            saveGuides();
        }
        temp.remove();
    }

    renderGuides();
    document.removeEventListener('mousemove', onGuideMove);
    document.removeEventListener('mouseup', endGuide);
}

function saveGuides() {
    try {
        localStorage.setItem('ve_guides', JSON.stringify(guides));
    } catch (e) {}
}

export function snapToGuides(value, type) {
    const threshold = 8;
    let snapped = value;
    let snappedTo = null;

    const container = document.getElementById('veCanvas');
    const rect = container.getBoundingClientRect();

    const guideValues = type === 'horizontal' 
        ? guides.horizontal.map(g => g - rect.top)
        : guides.vertical.map(g => g - rect.left);

    for (const guide of guideValues) {
        if (Math.abs(value - guide) < threshold) {
            snapped = guide;
            snappedTo = guide;
            break;
        }
        if (Math.abs(value - (guide + 20)) < threshold) {
            snapped = guide + 20;
            snappedTo = guide + 20;
            break;
        }
        if (Math.abs(value - (guide - 20)) < threshold) {
            snapped = guide - 20;
            snappedTo = guide - 20;
            break;
        }
    }

    return { snapped, snappedTo };
}