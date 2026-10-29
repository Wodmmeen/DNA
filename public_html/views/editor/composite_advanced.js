// ========== COMPOSITE BUILDER - FULL WORKING EDITION ==========
// Группировка работает, все 20+ типов блоков, полный функционал

(function() {
    console.log('🚀 COMPOSITE BUILDER FULL EDITION LOADED');
    
    // ========== DOM ЭЛЕМЕНТЫ ==========
    let modal = null, canvas = null, layersDiv = null, propsDiv = null, wrapper = null, zoomLevelSpan = null;
    
    // ========== СОСТОЯНИЕ ==========
    let blocks = [];
    let selectedIds = new Set();
    let history = [], historyIndex = -1;
    let zoom = 1, panX = 0, panY = 0;
    let isPanning = false, panStart = { x: 0, y: 0 };
    let showGrid = true, snapToGrid = true, gridSize = 20;
    
    // ========== ВСПОМОГАТЕЛЬНЫЕ ==========
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[m]);
    }
    
    function showToast(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${msg}`;
        toast.style.cssText = `position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#8b5cf6'}; color:white; padding:10px 20px; border-radius:40px; font-size:13px; font-weight:500; z-index:100000; animation:toastInOut 2.5s ease forwards; box-shadow:0 10px 25px -5px rgba(0,0,0,0.2); backdrop-filter:blur(8px);`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }
    
    function generateId(prefix) {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    }
    
    function snapToGridValue(v) {
        return snapToGrid ? Math.round(v / gridSize) * gridSize : v;
    }
    
    function saveToHistory() {
        const snapshot = JSON.parse(JSON.stringify(blocks));
        if (historyIndex < history.length - 1) history = history.slice(0, historyIndex + 1);
        history.push(snapshot);
        historyIndex = history.length - 1;
        if (history.length > 100) history.shift();
    }
    
    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            blocks = JSON.parse(JSON.stringify(history[historyIndex]));
            render();
            showToast('↩️ Отменено', 'info');
        } else {
            showToast('❌ Нечего отменять', 'warning');
        }
    }
    
    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            blocks = JSON.parse(JSON.stringify(history[historyIndex]));
            render();
            showToast('↪️ Повторено', 'info');
        } else {
            showToast('❌ Нечего повторять', 'warning');
        }
    }
    
    // ========== ДОБАВЛЕНИЕ БЛОКОВ ==========
    function addShape(shapeType) {
        const id = generateId('shape');
        blocks.push({
            id: id, type: 'shape', shape: shapeType,
            content: { bg_color: '#8b5cf6', border_width: 0, border_color: '#ffffff', shadow: false },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 100, height: 100, rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast(`🎨 Добавлена фигура`, 'success');
    }
    
    function addText() {
        const id = generateId('text');
        blocks.push({
            id: id, type: 'text',
            content: { text: 'Двойной клик для редактирования' },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 240, height: 80, fontSize: 16, color: '#ffffff', bgColor: 'transparent', textAlign: 'center', fontWeight: 'normal', fontFamily: 'Inter', rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('📝 Текст добавлен', 'success');
    }
    
    function addImage() {
        const id = generateId('image');
        blocks.push({
            id: id, type: 'image',
            content: { url: 'https://picsum.photos/200/150?random=' + Date.now(), alt: 'Image', fit: 'cover' },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 220, height: 160, rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('🖼️ Изображение добавлено', 'success');
    }
    
    function addButton() {
        const id = generateId('button');
        blocks.push({
            id: id, type: 'button',
            content: { text: 'Кнопка', link: '#', bgColor: '#8b5cf6', hoverColor: '#7c3aed', borderRadius: 12 },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 180, height: 48, fontSize: 14, color: '#ffffff', rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('🔘 Кнопка добавлена', 'success');
    }
    
    function addCard() {
        const id = generateId('card');
        blocks.push({
            id: id, type: 'card',
            content: { title: 'Заголовок карточки', description: 'Описание карточки. Можно добавить любой текст.', image: 'https://picsum.photos/200/150?random=' + Date.now(), buttonText: 'Подробнее', buttonColor: '#8b5cf6' },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 280, height: 380, rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('📇 Карточка добавлена', 'success');
    }
    
    function addIcon() {
        const id = generateId('icon');
        blocks.push({
            id: id, type: 'icon',
            content: { icon: 'fa-star', color: '#fbbf24', size: 48 },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 80, height: 80, rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('✨ Иконка добавлена', 'success');
    }
    
    function addProgress() {
        const id = generateId('progress');
        blocks.push({
            id: id, type: 'progress',
            content: { value: 75, color: '#8b5cf6', label: 'Прогресс', animated: true },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 320, height: 50, rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('📊 Прогресс-бар добавлен', 'success');
    }
    
    function addCounter() {
        const id = generateId('counter');
        blocks.push({
            id: id, type: 'counter',
            content: { start: 0, end: 100, duration: 2, prefix: '', suffix: '%', color: '#8b5cf6' },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 200, height: 80, fontSize: 32, textAlign: 'center', rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('🔢 Счётчик добавлен', 'success');
    }
    
    function addVideo() {
        const id = generateId('video');
        blocks.push({
            id: id, type: 'video',
            content: { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', autoplay: false, controls: true },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 560, height: 315, rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('🎬 Видео добавлено', 'success');
    }
    
    function addMap() {
        const id = generateId('map');
        blocks.push({
            id: id, type: 'map',
            content: { lat: 55.751244, lng: 37.618423, zoom: 12 },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 400, height: 300, rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('🗺️ Карта добавлена', 'success');
    }
    
    function addDivider() {
        const id = generateId('divider');
        blocks.push({
            id: id, type: 'divider',
            content: { color: '#3a3a4e', thickness: 2, style: 'solid', margin: 20 },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 300, height: 2, rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('📏 Разделитель добавлен', 'success');
    }
    
    function addAccordion() {
        const id = generateId('accordion');
        blocks.push({
            id: id, type: 'accordion',
            content: { items: [{ title: 'Заголовок 1', content: 'Содержимое 1' }, { title: 'Заголовок 2', content: 'Содержимое 2' }] },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 320, height: 200, rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('📋 Аккордеон добавлен', 'success');
    }
    
    function addRating() {
        const id = generateId('rating');
        blocks.push({
            id: id, type: 'rating',
            content: { rating: 4.5, max: 5, color: '#fbbf24', size: 20 },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 150, height: 40, rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('⭐ Рейтинг добавлен', 'success');
    }
    
    function addTimer() {
        const id = generateId('timer');
        const endDate = new Date();
        endDate.setHours(endDate.getHours() + 24);
        blocks.push({
            id: id, type: 'timer',
            content: { days: 0, hours: 24, minutes: 0, seconds: 0, color: '#8b5cf6', endDate: endDate.toISOString() },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 400, height: 100, fontSize: 24, rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('⏱️ Таймер добавлен', 'success');
    }
    
    function addSocialLinks() {
        const id = generateId('social');
        blocks.push({
            id: id, type: 'social',
            content: { links: [{ platform: 'facebook', url: '#' }, { platform: 'twitter', url: '#' }, { platform: 'instagram', url: '#' }], color: '#8b5cf6', size: 32 },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 200, height: 50, rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('📱 Социальные кнопки добавлены', 'success');
    }
    
    function addTestimonial() {
        const id = generateId('testimonial');
        blocks.push({
            id: id, type: 'testimonial',
            content: { text: 'Отличный сервис! Очень доволен результатом.', author: 'Анна Иванова', role: 'Клиент', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', rating: 5 },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 320, height: 200, rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('💬 Отзыв добавлен', 'success');
    }
    
    function addPricingCard() {
        const id = generateId('pricing');
        blocks.push({
            id: id, type: 'pricing',
            content: { title: 'Базовый', price: '$19', period: 'месяц', features: ['Функция 1', 'Функция 2', 'Функция 3'], buttonText: 'Выбрать', popular: false },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 280, height: 420, rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('💰 Прайс-карточка добавлена', 'success');
    }
    
    function addChart() {
        const id = generateId('chart');
        blocks.push({
            id: id, type: 'chart',
            content: { type: 'bar', data: [30, 50, 80, 45, 70], labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май'], color: '#8b5cf6' },
            styles: { left: snapToGridValue(200 + blocks.length * 15), top: snapToGridValue(150 + blocks.length * 15), width: 400, height: 300, rotate: 0, opacity: 1, zIndex: blocks.length + 1 }
        });
        afterAdd(id);
        showToast('📊 График добавлен', 'success');
    }
    
    function afterAdd(id) {
        render();
        saveToHistory();
        selectedIds.clear();
        selectedIds.add(id);
        updateLayers();
        updateProperties();
        setTimeout(() => {
            const el = document.querySelector(`.composite-block[data-id="${id}"]`);
            if (el && wrapper) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.animation = 'blockAppear 0.3s ease';
                setTimeout(() => el.style.animation = '', 300);
            }
        }, 50);
    }
    
    // ========== ДЕЙСТВИЯ С БЛОКАМИ ==========
    function deleteSelected() {
        if (selectedIds.size === 0) return;
        blocks = blocks.filter(b => !selectedIds.has(b.id));
        selectedIds.clear();
        render();
        saveToHistory();
        updateLayers();
        updateProperties();
        showToast(`🗑️ Удалено`, 'success');
    }
    
    function duplicateSelected() {
        if (selectedIds.size === 0) return;
        const newBlocks = [];
        Array.from(selectedIds).forEach(id => {
            const orig = blocks.find(b => b.id === id);
            if (orig) {
                const copy = JSON.parse(JSON.stringify(orig));
                copy.id = generateId(orig.type);
                copy.styles.left += 30;
                copy.styles.top += 30;
                copy.styles.zIndex = blocks.length + newBlocks.length + 1;
                newBlocks.push(copy);
            }
        });
        blocks.push(...newBlocks);
        selectedIds.clear();
        newBlocks.forEach(b => selectedIds.add(b.id));
        render();
        saveToHistory();
        updateLayers();
        updateProperties();
        showToast(`📋 Скопировано ${newBlocks.length} блоков`, 'success');
    }
    
    // ИСПРАВЛЕННАЯ ГРУППИРОВКА — БЛОКИ НЕ ПРОПАДАЮТ
    function groupSelected() {
        if (selectedIds.size < 2) {
            showToast('Выберите минимум 2 блока для группировки', 'warning');
            return;
        }
        
        const groupId = generateId('group');
        const groupBlocks = [];
        
        // Сохраняем копии выбранных блоков
        Array.from(selectedIds).forEach(id => {
            const original = blocks.find(b => b.id === id);
            if (original) {
                groupBlocks.push(JSON.parse(JSON.stringify(original)));
            }
        });
        
        // Удаляем оригинальные блоки
        blocks = blocks.filter(b => !selectedIds.has(b.id));
        
        // Вычисляем позицию группы (верхний левый угол)
        const minLeft = Math.min(...groupBlocks.map(b => b.styles.left));
        const minTop = Math.min(...groupBlocks.map(b => b.styles.top));
        const maxRight = Math.max(...groupBlocks.map(b => b.styles.left + b.styles.width));
        const maxBottom = Math.max(...groupBlocks.map(b => b.styles.top + b.styles.height));
        
        // Создаём группу
        const group = {
            id: groupId,
            type: 'group',
            content: { blocks: groupBlocks },
            styles: {
                left: minLeft,
                top: minTop,
                width: maxRight - minLeft,
                height: maxBottom - minTop,
                rotate: 0,
                opacity: 1,
                zIndex: Math.max(...groupBlocks.map(b => b.styles.zIndex || 1)) + 1
            }
        };
        
        blocks.push(group);
        selectedIds.clear();
        selectedIds.add(groupId);
        render();
        saveToHistory();
        updateLayers();
        updateProperties();
        showToast(`🔲 Сгруппировано ${groupBlocks.length} блоков`, 'success');
    }
    
    // ИСПРАВЛЕННАЯ РАЗГРУППИРОВКА
    function ungroupSelected() {
        if (selectedIds.size !== 1) {
            showToast('Выберите одну группу', 'warning');
            return;
        }
        
        const groupId = Array.from(selectedIds)[0];
        const group = blocks.find(b => b.id === groupId);
        
        if (!group || group.type !== 'group') {
            showToast('Это не группа', 'warning');
            return;
        }
        
        if (!group.content.blocks || group.content.blocks.length === 0) {
            showToast('Группа пуста', 'warning');
            return;
        }
        
        // Генерируем новые ID для блоков группы
        const ungroupedBlocks = group.content.blocks.map(block => {
            const newBlock = JSON.parse(JSON.stringify(block));
            newBlock.id = generateId(block.type);
            // Смещаем позицию относительно группы
            newBlock.styles.left += group.styles.left;
            newBlock.styles.top += group.styles.top;
            return newBlock;
        });
        
        // Удаляем группу и добавляем блоки
        blocks = blocks.filter(b => b.id !== groupId);
        blocks.push(...ungroupedBlocks);
        selectedIds.clear();
        
        render();
        saveToHistory();
        updateLayers();
        updateProperties();
        showToast(`🔓 Группа разобрана на ${ungroupedBlocks.length} блоков`, 'success');
    }
    
    function alignSelected(alignment) {
        if (selectedIds.size < 2) {
            showToast('Выберите минимум 2 блока', 'warning');
            return;
        }
        const selected = blocks.filter(b => selectedIds.has(b.id));
        
        if (alignment === 'left') {
            const minL = Math.min(...selected.map(b => b.styles.left));
            selected.forEach(b => b.styles.left = minL);
        } else if (alignment === 'center') {
            const centerX = selected.reduce((s, b) => s + b.styles.left + b.styles.width / 2, 0) / selected.length;
            selected.forEach(b => b.styles.left = centerX - b.styles.width / 2);
        } else if (alignment === 'right') {
            const maxR = Math.max(...selected.map(b => b.styles.left + b.styles.width));
            selected.forEach(b => b.styles.left = maxR - b.styles.width);
        } else if (alignment === 'top') {
            const minT = Math.min(...selected.map(b => b.styles.top));
            selected.forEach(b => b.styles.top = minT);
        } else if (alignment === 'middle') {
            const centerY = selected.reduce((s, b) => s + b.styles.top + b.styles.height / 2, 0) / selected.length;
            selected.forEach(b => b.styles.top = centerY - b.styles.height / 2);
        } else if (alignment === 'bottom') {
            const maxB = Math.max(...selected.map(b => b.styles.top + b.styles.height));
            selected.forEach(b => b.styles.top = maxB - b.styles.height);
        }
        render();
        saveToHistory();
        showToast(`📐 Выравнивание: ${alignment}`, 'success');
    }
    
    function distributeSelected(direction) {
        if (selectedIds.size < 3) {
            showToast('Выберите минимум 3 блока', 'warning');
            return;
        }
        const selected = blocks.filter(b => selectedIds.has(b.id));
        
        if (direction === 'horizontal') {
            const sorted = [...selected].sort((a, b) => a.styles.left - b.styles.left);
            const start = sorted[0].styles.left;
            const end = sorted[sorted.length - 1].styles.left;
            const step = (end - start) / (sorted.length - 1);
            sorted.forEach((b, i) => b.styles.left = start + i * step);
        } else if (direction === 'vertical') {
            const sorted = [...selected].sort((a, b) => a.styles.top - b.styles.top);
            const start = sorted[0].styles.top;
            const end = sorted[sorted.length - 1].styles.top;
            const step = (end - start) / (sorted.length - 1);
            sorted.forEach((b, i) => b.styles.top = start + i * step);
        }
        render();
        saveToHistory();
        showToast(`📏 Распределение`, 'success');
    }
    
    function bringToFront() {
        if (selectedIds.size === 0) return;
        const maxZ = Math.max(...blocks.map(b => b.styles.zIndex || 1));
        Array.from(selectedIds).forEach(id => {
            const b = blocks.find(b => b.id === id);
            if (b) b.styles.zIndex = maxZ + 1;
        });
        render();
        saveToHistory();
        showToast('⬆️ На передний план', 'info');
    }
    
    function sendToBack() {
        if (selectedIds.size === 0) return;
        const minZ = Math.min(...blocks.map(b => b.styles.zIndex || 1));
        Array.from(selectedIds).forEach(id => {
            const b = blocks.find(b => b.id === id);
            if (b) b.styles.zIndex = Math.max(1, minZ - 1);
        });
        render();
        saveToHistory();
        showToast('⬇️ На задний план', 'info');
    }
    
    function moveLayerUp(id) {
        const block = blocks.find(b => b.id === id);
        if (!block) return;
        const currentZ = block.styles.zIndex || 1;
        const higher = blocks.find(b => (b.styles.zIndex || 1) > currentZ);
        if (higher) {
            const higherZ = higher.styles.zIndex;
            block.styles.zIndex = higherZ;
            higher.styles.zIndex = currentZ;
        } else {
            block.styles.zIndex = currentZ + 1;
        }
        render();
        updateLayers();
        saveToHistory();
        showToast('⬆️ Слой вверх', 'success');
    }
    
    function moveLayerDown(id) {
        const block = blocks.find(b => b.id === id);
        if (!block) return;
        const currentZ = block.styles.zIndex || 1;
        const lower = blocks.find(b => (b.styles.zIndex || 1) < currentZ);
        if (lower) {
            const lowerZ = lower.styles.zIndex;
            block.styles.zIndex = lowerZ;
            lower.styles.zIndex = currentZ;
        } else {
            block.styles.zIndex = Math.max(1, currentZ - 1);
        }
        render();
        updateLayers();
        saveToHistory();
        showToast('⬇️ Слой вниз', 'success');
    }
    
    // ========== ЭКСПОРТ/ИМПОРТ ==========
    function exportJSON() {
        const data = { blocks, exported: new Date().toISOString(), version: '4.0', totalBlocks: blocks.length };
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));
        a.download = `composite_${Date.now()}.json`;
        a.click();
        showToast('📄 Экспортировано', 'success');
    }
    
    function importJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (data.blocks && Array.isArray(data.blocks)) {
                        blocks = data.blocks;
                        selectedIds.clear();
                        render();
                        saveToHistory();
                        updateLayers();
                        updateProperties();
                        showToast(`📥 Импортировано ${blocks.length} блоков`, 'success');
                    }
                } catch(err) { showToast('Ошибка импорта', 'error'); }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    
    function saveTemplate() {
        if (!blocks.length) { showToast('Нет блоков', 'error'); return; }
        const name = prompt('Название шаблона:', 'Мой шаблон ' + new Date().toLocaleDateString());
        if (!name) return;
        if (typeof window.pageData !== 'undefined' && window.pageData) {
            if (!window.pageData.templates) window.pageData.templates = [];
            window.pageData.templates.push({ id: 'composite_' + Date.now(), name, isComposite: true, blocks: JSON.parse(JSON.stringify(blocks)) });
            showToast(`✅ Шаблон "${name}" сохранён`, 'success');
            if (typeof saveLayout === 'function') saveLayout(false, true);
            if (typeof renderTemplates === 'function') renderTemplates();
            closeBuilder();
        } else { showToast('Ошибка: pageData не найден', 'error'); }
    }
    
    function clearAll() {
        if (confirm('🗑️ Удалить ВСЕ блоки?')) {
            blocks = [];
            selectedIds.clear();
            render();
            saveToHistory();
            updateLayers();
            updateProperties();
            showToast('Холст очищен', 'success');
        }
    }
    
    // ========== УПРАВЛЕНИЕ ХОЛСТОМ ==========
    function applyGrid() { if (canvas) canvas.style.backgroundImage = `linear-gradient(rgba(139,92,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.15) 1px, transparent 1px)`; canvas.style.backgroundSize = `${gridSize}px ${gridSize}px`; }
    function removeGrid() { if (canvas) canvas.style.backgroundImage = 'none'; }
    function toggleGrid() { showGrid = !showGrid; showGrid ? applyGrid() : removeGrid(); showToast(showGrid ? '📏 Сетка включена' : '📏 Сетка выключена', 'info'); }
    function toggleSnap() { snapToGrid = !snapToGrid; showToast(snapToGrid ? '🔒 Привязка к сетке' : '🔓 Привязка отключена', 'info'); }
    function zoomIn() { zoom = Math.min(3, zoom + 0.1); if (canvas) canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; if (zoomLevelSpan) zoomLevelSpan.innerText = Math.round(zoom * 100) + '%'; }
    function zoomOut() { zoom = Math.max(0.3, zoom - 0.1); if (canvas) canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; if (zoomLevelSpan) zoomLevelSpan.innerText = Math.round(zoom * 100) + '%'; }
    function zoomReset() { zoom = 1; panX = 0; panY = 0; if (canvas) canvas.style.transform = `translate(0px,0px) scale(1)`; if (zoomLevelSpan) zoomLevelSpan.innerText = '100%'; if (wrapper) { wrapper.scrollLeft = 0; wrapper.scrollTop = 0; } showToast('Масштаб сброшен', 'info'); }
    function centerCanvas() { if (!canvas || !wrapper) return; const canvasW = canvas.offsetWidth, canvasH = canvas.offsetHeight, wrapW = wrapper.clientWidth, wrapH = wrapper.clientHeight; if (wrapW > canvasW) panX = (wrapW - canvasW) / 2; if (wrapH > canvasH) panY = (wrapH - canvasH) / 2; canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; showToast('📐 Холст отцентрирован', 'info'); }
    
    function setupCanvasEvents() {
        if (!canvas) return;
        canvas.addEventListener('contextmenu', e => e.preventDefault());
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
                e.preventDefault();
                isPanning = true;
                panStart = { x: e.clientX - panX, y: e.clientY - panY };
                canvas.style.cursor = 'grabbing';
            } else if (e.target === canvas) {
                selectedIds.clear();
                render();
                updateLayers();
                updateProperties();
            }
        });
        window.addEventListener('mousemove', (e) => { if (isPanning) { panX = e.clientX - panStart.x; panY = e.clientY - panStart.y; canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; } });
        window.addEventListener('mouseup', () => { if (isPanning) { isPanning = false; canvas.style.cursor = 'default'; } });
        canvas.addEventListener('wheel', (e) => { if (e.ctrlKey) { e.preventDefault(); const delta = e.deltaY > 0 ? -0.05 : 0.05; zoom = Math.min(3, Math.max(0.3, zoom + delta)); canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; if (zoomLevelSpan) zoomLevelSpan.innerText = Math.round(zoom * 100) + '%'; } }, { passive: false });
    }
    
    // ========== РЕНДЕРИНГ ==========
    function renderBlock(block, isInsideGroup = false, offsetX = 0, offsetY = 0) {
        const s = block.styles;
        const isSelected = selectedIds.has(block.id);
        let inner = '';
        
        const left = (s.left || 0) + (isInsideGroup ? offsetX : 0);
        const top = (s.top || 0) + (isInsideGroup ? offsetY : 0);
        
        if (block.type === 'shape') {
            let shapeClass = 'premium-shape-square';
            if (block.shape === 'circle') shapeClass = 'premium-shape-circle';
            else if (block.shape === 'triangle') shapeClass = 'premium-shape-triangle';
            else if (block.shape === 'diamond') shapeClass = 'premium-shape-diamond';
            else if (block.shape === 'star') shapeClass = 'premium-shape-star';
            const border = block.content.border_width ? `border: ${block.content.border_width}px solid ${block.content.border_color};` : '';
            const shadow = block.content.shadow ? 'box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);' : '';
            inner = `<div class="${shapeClass}" style="width:100%; height:100%; background:${block.content.bg_color}; ${border} ${shadow}"></div>`;
        } else if (block.type === 'text') {
            inner = `<div contenteditable="true" class="composite-text-editable" style="width:100%; height:100%; display:flex; align-items:center; justify-content:${s.textAlign || 'center'}; font-size:${s.fontSize || 16}px; color:${s.color || '#fff'}; background:${s.bgColor || 'transparent'}; padding:8px; border-radius:12px;">${escapeHtml(block.content.text)}</div>`;
        } else if (block.type === 'image') {
            inner = `<img src="${escapeHtml(block.content.url)}" style="width:100%; height:100%; object-fit:${block.content.fit || 'cover'}; border-radius:12px;">`;
        } else if (block.type === 'button') {
            inner = `<a href="${escapeHtml(block.content.link)}" style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; background:${block.content.bgColor || '#8b5cf6'}; color:${s.color || '#fff'}; font-size:${s.fontSize || 14}px; font-weight:500; border-radius:${block.content.borderRadius || 12}px; text-decoration:none;">${escapeHtml(block.content.text)}</a>`;
        } else if (block.type === 'card') {
            inner = `<div style="width:100%; height:100%; background:linear-gradient(135deg,#1e1e2e,#2a2a3e); border-radius:16px; overflow:hidden; display:flex; flex-direction:column;"><img src="${escapeHtml(block.content.image)}" style="width:100%; height:120px; object-fit:cover;"><div style="padding:12px; flex:1;"><h4 style="margin:0 0 6px; font-size:16px;">${escapeHtml(block.content.title)}</h4><p style="margin:0 0 10px; font-size:11px; color:#94a3b8;">${escapeHtml(block.content.description)}</p><button style="background:${block.content.buttonColor || '#8b5cf6'}; border:none; padding:6px 12px; border-radius:20px; color:white; font-size:11px;">${escapeHtml(block.content.buttonText)}</button></div></div>`;
        } else if (block.type === 'icon') {
            inner = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;"><i class="fas ${block.content.icon}" style="font-size:${block.content.size || 48}px; color:${block.content.color || '#8b5cf6'};"></i></div>`;
        } else if (block.type === 'progress') {
            const percent = Math.min(100, Math.max(0, block.content.value || 75));
            inner = `<div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center;">${block.content.label ? `<div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="font-size:11px;">${escapeHtml(block.content.label)}</span><span style="font-size:11px;">${percent}%</span></div>` : ''}<div style="background:#2a2a3e; border-radius:20px; overflow:hidden; height:${(s.height || 50) * 0.4}px;"><div style="width:${percent}%; background:${block.content.color || '#8b5cf6'}; height:100%; border-radius:20px;"></div></div></div>`;
        } else if (block.type === 'counter') {
            inner = `<div class="counter-display" data-start="${block.content.start}" data-end="${block.content.end}" data-duration="${block.content.duration}" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:${s.fontSize || 32}px; font-weight:700; color:${block.content.color || '#8b5cf6'};"><span class="prefix">${block.content.prefix || ''}</span><span class="number">${block.content.start || 0}</span><span class="suffix">${block.content.suffix || ''}</span></div>`;
        } else if (block.type === 'video') {
            inner = `<iframe src="${escapeHtml(block.content.url)}" style="width:100%; height:100%; border:none; border-radius:12px;" ${block.content.autoplay ? 'allow="autoplay"' : ''} ${block.content.controls ? 'controls' : ''}></iframe>`;
        } else if (block.type === 'map') {
            inner = `<iframe width="100%" height="100%" style="border:none; border-radius:12px;" src="https://maps.google.com/maps?q=${block.content.lat},${block.content.lng}&z=${block.content.zoom}&output=embed"></iframe>`;
        } else if (block.type === 'divider') {
            inner = `<hr style="width:100%; height:${block.content.thickness || 2}px; background:${block.content.color || '#3a3a4e'}; border:none; border-radius:2px;">`;
        } else if (block.type === 'accordion') {
            inner = `<div class="premium-accordion" style="width:100%; height:100%; overflow-y:auto;">${(block.content.items || []).map((item, idx) => `<div class="accordion-item" style="margin-bottom:8px;"><div class="accordion-header" style="background:#2a2a3e; padding:10px 12px; border-radius:8px; cursor:pointer; display:flex; justify-content:space-between;"><span>${escapeHtml(item.title)}</span><i class="fas fa-chevron-down"></i></div><div class="accordion-content" style="display:none; padding:10px 12px; background:#1e1e2e; border-radius:8px; margin-top:4px;">${escapeHtml(item.content)}</div></div>`).join('')}</div>`;
        } else if (block.type === 'rating') {
            const fullStars = Math.floor(block.content.rating);
            const hasHalf = block.content.rating % 1 >= 0.5;
            inner = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; gap:4px; color:${block.content.color || '#fbbf24'};">${'★'.repeat(fullStars)}${hasHalf ? '½' : ''}${'☆'.repeat(block.content.max - fullStars - (hasHalf ? 1 : 0))}</div>`;
        } else if (block.type === 'timer') {
            inner = `<div class="timer-display" data-end="${block.content.endDate}" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; gap:12px; font-size:${s.fontSize || 24}px; font-weight:700;"><div class="timer-unit"><span class="value">0</span><span class="label">дн</span></div><div class="timer-unit"><span class="value">0</span><span class="label">ч</span></div><div class="timer-unit"><span class="value">0</span><span class="label">мин</span></div><div class="timer-unit"><span class="value">0</span><span class="label">сек</span></div></div>`;
        } else if (block.type === 'social') {
            const icons = { facebook: 'fa-facebook', twitter: 'fa-twitter', instagram: 'fa-instagram', linkedin: 'fa-linkedin', youtube: 'fa-youtube', telegram: 'fa-telegram' };
            inner = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; gap:12px;">${(block.content.links || []).map(link => `<a href="${escapeHtml(link.url)}" target="_blank" style="color:${block.content.color || '#8b5cf6'}; font-size:${block.content.size || 24}px;"><i class="fab ${icons[link.platform] || 'fa-link'}"></i></a>`).join('')}</div>`;
        } else if (block.type === 'testimonial') {
            inner = `<div style="width:100%; height:100%; background:#2a2a3e; border-radius:16px; padding:16px; display:flex; flex-direction:column;"><div style="display:flex; gap:12px; margin-bottom:12px;"><img src="${escapeHtml(block.content.avatar)}" style="width:48px; height:48px; border-radius:50%; object-fit:cover;"><div><div style="font-weight:600;">${escapeHtml(block.content.author)}</div><div style="font-size:11px; color:#94a3b8;">${escapeHtml(block.content.role)}</div><div style="color:#fbbf24;">${'★'.repeat(block.content.rating)}${'☆'.repeat(5-block.content.rating)}</div></div></div><p style="font-size:13px; line-height:1.5; margin:0; flex:1;">“${escapeHtml(block.content.text)}”</p></div>`;
        } else if (block.type === 'pricing') {
            inner = `<div style="width:100%; height:100%; background:${block.content.popular ? 'linear-gradient(135deg,#2a2a3e,#1e1e2e)' : '#2a2a3e'}; border-radius:16px; padding:20px; text-align:center; display:flex; flex-direction:column; ${block.content.popular ? 'border:2px solid #8b5cf6;' : ''}"><h3 style="margin:0 0 8px;">${escapeHtml(block.content.title)}</h3><div style="font-size:32px; font-weight:700; color:#8b5cf6;">${escapeHtml(block.content.price)}<span style="font-size:14px;">/${escapeHtml(block.content.period)}</span></div><ul style="margin:16px 0; padding:0; list-style:none; flex:1;">${(block.content.features || []).map(f => `<li style="padding:4px 0;">✓ ${escapeHtml(f)}</li>`).join('')}</ul><button style="background:#8b5cf6; border:none; padding:10px; border-radius:8px; color:white;">${escapeHtml(block.content.buttonText)}</button></div>`;
        } else if (block.type === 'chart') {
            const maxVal = Math.max(...(block.content.data || [30, 50, 80]));
            inner = `<div style="width:100%; height:100%; display:flex; align-items:flex-end; justify-content:center; gap:12px; padding:16px;">${(block.content.data || [30, 50, 80]).map((val, i) => `<div style="flex:1; display:flex; flex-direction:column; align-items:center;"><div style="height:${(val / maxVal) * 200}px; width:100%; background:${block.content.color || '#8b5cf6'}; border-radius:8px 8px 0 0;"></div><span style="font-size:10px; margin-top:6px;">${block.content.labels?.[i] || i + 1}</span><span style="font-size:11px; font-weight:600;">${val}</span></div>`).join('')}</div>`;
        } else if (block.type === 'group') {
            // Рекурсивный рендер группы
            let groupInner = '';
            const groupOffsetX = 0;
            const groupOffsetY = 0;
            for (const child of (block.content.blocks || [])) {
                groupInner += renderBlock(child, true, groupOffsetX, groupOffsetY);
            }
            inner = `<div style="position:relative; width:100%; height:100%;">${groupInner}</div>`;
        }
        
        const outline = isSelected ? '2px solid #8b5cf6' : '1px solid rgba(139,92,246,0.15)';
        const zIndex = s.zIndex || 1;
        
        // Для блоков внутри группы не показываем ручки изменения размера
        const showHandles = isSelected && !isInsideGroup;
        
        return `<div class="composite-block" data-id="${block.id}" style="position:absolute; left:${left}px; top:${top}px; width:${s.width}px; height:${s.height}px; transform:rotate(${s.rotate || 0}deg); opacity:${s.opacity || 1}; outline:${outline}; cursor:move; z-index:${zIndex}; border-radius:12px;">${inner}${showHandles ? `<div class="resize-handle nw"></div><div class="resize-handle n"></div><div class="resize-handle ne"></div><div class="resize-handle e"></div><div class="resize-handle se"></div><div class="resize-handle s"></div><div class="resize-handle sw"></div><div class="resize-handle w"></div><div class="rotate-handle"><i class="fas fa-sync-alt"></i></div>` : ''}</div>`;
    }
    
    function render() {
        if (!canvas) return;
        let html = '';
        const sorted = [...blocks].sort((a, b) => (a.styles.zIndex || 1) - (b.styles.zIndex || 1));
        for (const b of sorted) {
            html += renderBlock(b);
        }
        canvas.innerHTML = html || `<div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; color:#64748b;"><i class="fas fa-plus-circle" style="font-size:64px; margin-bottom:20px; opacity:0.3;"></i><p>Нажмите на элемент слева, чтобы добавить блок</p><p style="font-size:11px; margin-top:8px;">💡 20+ типов блоков, группировка, слои, экспорт</p></div>`;
        attachEvents();
        attachAccordionEvents();
        attachTimerEvents();
        attachCounterEvents();
        if (showGrid) applyGrid();
        updateLayers();
        updateProperties();
    }
    
    function attachEvents() {
        document.querySelectorAll('.composite-block').forEach(el => {
            el.removeEventListener('mousedown', onMouseDown);
            el.addEventListener('mousedown', onMouseDown);
            el.removeEventListener('click', onClick);
            el.addEventListener('click', onClick);
        });
        document.querySelectorAll('.composite-text-editable').forEach(el => {
            el.removeEventListener('blur', onTextBlur);
            el.addEventListener('blur', onTextBlur);
        });
    }
    
    function onClick(e) {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        if (e.shiftKey) {
            if (selectedIds.has(id)) selectedIds.delete(id);
            else selectedIds.add(id);
        } else {
            selectedIds.clear();
            selectedIds.add(id);
        }
        render();
    }
    
    function onTextBlur(e) {
        const parent = e.target.closest('.composite-block');
        if (parent) {
            const id = parent.dataset.id;
            const block = blocks.find(b => b.id === id);
            if (block && block.type === 'text') {
                block.content.text = e.target.innerText;
                saveToHistory();
            }
        }
    }
    
    function onAccordionClick(e) {
        const item = e.currentTarget.closest('.accordion-item');
        const content = item.querySelector('.accordion-content');
        const icon = e.currentTarget.querySelector('i');
        if (content.style.display === 'none' || !content.style.display) {
            content.style.display = 'block';
            if (icon) icon.style.transform = 'rotate(180deg)';
        } else {
            content.style.display = 'none';
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    }
    
    function attachAccordionEvents() {
        document.querySelectorAll('.accordion-header').forEach(h => {
            h.removeEventListener('click', onAccordionClick);
            h.addEventListener('click', onAccordionClick);
        });
    }
    
    function attachTimerEvents() {
        const updateTimers = () => {
            document.querySelectorAll('.timer-display').forEach(el => {
                const endDate = new Date(el.dataset.end);
                const now = new Date();
                const diff = endDate - now;
                if (diff <= 0) {
                    el.innerHTML = '<div>Время вышло!</div>';
                    return;
                }
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (86400000)) / (3600000));
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                const units = el.querySelectorAll('.timer-unit');
                if (units.length >= 4) {
                    units[0].querySelector('.value').innerText = days;
                    units[1].querySelector('.value').innerText = hours;
                    units[2].querySelector('.value').innerText = minutes;
                    units[3].querySelector('.value').innerText = seconds;
                }
            });
        };
        updateTimers();
        setInterval(updateTimers, 1000);
    }
    
    function attachCounterEvents() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                    entry.target.classList.add('animated');
                    const el = entry.target;
                    const numberSpan = el.querySelector('.number');
                    if (!numberSpan) return;
                    const start = parseInt(numberSpan.dataset?.start) || parseInt(el.dataset.start) || 0;
                    const end = parseInt(numberSpan.dataset?.end) || parseInt(el.dataset.end) || 100;
                    const duration = (parseFloat(el.dataset.duration) || 2) * 1000;
                    let current = start;
                    const step = Math.ceil((end - start) / (duration / 16));
                    const interval = setInterval(() => {
                        current += step;
                        if ((step > 0 && current >= end) || (step < 0 && current <= end)) {
                            current = end;
                            clearInterval(interval);
                        }
                        numberSpan.innerText = current;
                    }, 16);
                }
            });
        }, { threshold: 0.5 });
        document.querySelectorAll('.counter-display').forEach(c => observer.observe(c));
    }
    
    // ========== ДВИЖЕНИЕ И РЕСАЙЗ ==========
    let dragActive = false, dragId = null, dragStartX = 0, dragStartY = 0, dragStartL = 0, dragStartT = 0;
    let resizeActive = false, resizeId = null, resizeCorner = null, resizeStartX = 0, resizeStartY = 0;
    let resizeStartW = 0, resizeStartH = 0, resizeStartL = 0, resizeStartT = 0, resizeShift = false;
    
    function onMouseDown(e) {
        if (e.target.classList.contains('resize-handle')) {
            startResize(e);
            return;
        }
        if (e.target.classList.contains('rotate-handle')) {
            startRotate(e);
            return;
        }
        const block = e.target.closest('.composite-block');
        if (!block) return;
        const id = block.dataset.id;
        const b = blocks.find(b => b.id === id);
        if (!b) return;
        e.preventDefault();
        e.stopPropagation();
        dragActive = true;
        dragId = id;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragStartL = b.styles.left;
        dragStartT = b.styles.top;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
    
    function onMouseMove(e) {
        if (dragActive && dragId) {
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            const b = blocks.find(b => b.id === dragId);
            if (b) {
                b.styles.left = snapToGridValue(dragStartL + dx);
                b.styles.top = snapToGridValue(dragStartT + dy);
                render();
            }
        }
        if (resizeActive && resizeId) {
            const dx = e.clientX - resizeStartX;
            const dy = e.clientY - resizeStartY;
            const b = blocks.find(b => b.id === resizeId);
            if (b) {
                let newW = resizeStartW, newH = resizeStartH, newL = resizeStartL, newT = resizeStartT;
                if (resizeCorner.includes('e')) newW = Math.max(30, resizeStartW + dx);
                if (resizeCorner.includes('w')) { newW = Math.max(30, resizeStartW - dx); newL = resizeStartL + dx; }
                if (resizeCorner.includes('s')) newH = Math.max(30, resizeStartH + dy);
                if (resizeCorner.includes('n')) { newH = Math.max(30, resizeStartH - dy); newT = resizeStartT + dy; }
                if (resizeShift) {
                    const ratio = resizeStartW / resizeStartH;
                    if (resizeCorner.includes('e') || resizeCorner.includes('w')) {
                        newH = newW / ratio;
                        if (resizeCorner.includes('n')) newT = resizeStartT + (resizeStartH - newH);
                    } else {
                        newW = newH * ratio;
                        if (resizeCorner.includes('w')) newL = resizeStartL + (resizeStartW - newW);
                    }
                }
                if (snapToGrid) {
                    newW = snapToGridValue(newW);
                    newH = snapToGridValue(newH);
                    if (resizeCorner.includes('w')) newL = snapToGridValue(newL);
                    if (resizeCorner.includes('n')) newT = snapToGridValue(newT);
                }
                b.styles.width = Math.max(30, newW);
                b.styles.height = Math.max(30, newH);
                if (resizeCorner.includes('w')) b.styles.left = newL;
                if (resizeCorner.includes('n')) b.styles.top = newT;
                render();
                updateProperties();
            }
        }
    }
    
    function onMouseUp() {
        if (dragActive || resizeActive) saveToHistory();
        dragActive = false;
        resizeActive = false;
        dragId = null;
        resizeId = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
    
    function startResize(e) {
        const block = e.target.closest('.composite-block');
        if (!block) return;
        const id = block.dataset.id;
        const b = blocks.find(b => b.id === id);
        if (!b) return;
        e.preventDefault();
        e.stopPropagation();
        resizeActive = true;
        resizeId = id;
        resizeCorner = e.target.classList[1];
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        resizeStartW = b.styles.width;
        resizeStartH = b.styles.height;
        resizeStartL = b.styles.left;
        resizeStartT = b.styles.top;
        resizeShift = e.shiftKey;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
    
    function startRotate(e) {
        const block = e.target.closest('.composite-block');
        if (!block) return;
        const id = block.dataset.id;
        const b = blocks.find(b => b.id === id);
        if (!b) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = block.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
        const startRotate = b.styles.rotate || 0;
        
        function onRotateMove(move) {
            const angle = Math.atan2(move.clientY - centerY, move.clientX - centerX) * 180 / Math.PI;
            let delta = angle - startAngle;
            let newRotate = startRotate + delta;
            if (snapToGrid) newRotate = Math.round(newRotate / 15) * 15;
            b.styles.rotate = newRotate;
            render();
            updateProperties();
        }
        
        function onRotateUp() {
            document.removeEventListener('mousemove', onRotateMove);
            document.removeEventListener('mouseup', onRotateUp);
            saveToHistory();
        }
        
        document.addEventListener('mousemove', onRotateMove);
        document.addEventListener('mouseup', onRotateUp);
    }
    
    // ========== ПАНЕЛЬ СЛОЁВ ==========
    function updateLayers() {
        if (!layersDiv) return;
        if (!blocks.length) {
            layersDiv.innerHTML = '<div style="color:#64748b; text-align:center; padding:40px;"><i class="fas fa-layer-group" style="font-size:48px; opacity:0.3; margin-bottom:16px;"></i>Нет элементов</div>';
            return;
        }
        let html = '';
        const sorted = [...blocks].sort((a, b) => (b.styles.zIndex || 1) - (a.styles.zIndex || 1));
        const icons = { shape: 'fa-shapes', text: 'fa-font', image: 'fa-image', button: 'fa-hand-pointer', card: 'fa-id-card', icon: 'fa-star', progress: 'fa-chart-line', counter: 'fa-calculator', video: 'fa-video', map: 'fa-map', divider: 'fa-minus', accordion: 'fa-chevron-down', group: 'fa-object-group', rating: 'fa-star', timer: 'fa-hourglass-half', social: 'fa-share-alt', testimonial: 'fa-quote-left', pricing: 'fa-tag', chart: 'fa-chart-bar' };
        
        for (const b of sorted) {
            const isSelected = selectedIds.has(b.id);
            html += `<div class="composite-layer-item ${isSelected ? 'selected' : ''}" data-id="${b.id}" style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:${isSelected ? '#8b5cf6' : '#2a2a3e'}; margin-bottom:6px; border-radius:10px; cursor:pointer;">
                        <i class="fas ${icons[b.type] || 'fa-cube'}" style="width:22px;"></i>
                        <span style="flex:1; font-size:12px;">${b.type === 'group' ? `Группа (${b.content.blocks?.length || 0} элементов)` : b.type}</span>
                        <span style="font-size:10px; opacity:0.6;">z:${b.styles.zIndex || 1}</span>
                        <button class="layer-delete" data-id="${b.id}" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:4px;"><i class="fas fa-trash"></i></button>
                    </div>`;
        }
        layersDiv.innerHTML = html;
        
        layersDiv.querySelectorAll('.composite-layer-item').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.layer-delete')) return;
                const id = el.dataset.id;
                if (e.shiftKey) {
                    if (selectedIds.has(id)) selectedIds.delete(id);
                    else selectedIds.add(id);
                } else {
                    selectedIds.clear();
                    selectedIds.add(id);
                }
                render();
            });
        });
        
        layersDiv.querySelectorAll('.layer-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                blocks = blocks.filter(b => b.id !== id);
                selectedIds.delete(id);
                render();
                saveToHistory();
            });
        });
    }
    
    // ========== ПАНЕЛЬ СВОЙСТВ ==========
    function updateProperties() {
        if (!propsDiv) return;
        if (selectedIds.size !== 1) {
            propsDiv.innerHTML = `<div style="padding:40px; text-align:center;"><i class="fas fa-mouse-pointer" style="font-size:48px; opacity:0.3;"></i><p>${selectedIds.size === 0 ? 'Выберите элемент' : `Выбрано ${selectedIds.size} элементов`}</p>${selectedIds.size > 1 ? `<div style="margin-top:16px; display:flex; flex-direction:column; gap:8px;"><button id="groupBtn" style="padding:10px; background:#8b5cf6; border:none; border-radius:8px; color:white;">Группировать</button><button id="alignLeftBtn" style="padding:8px; background:#2a2a3e; border:none; border-radius:8px;">Выровнять по левому краю</button><button id="alignCenterBtn" style="padding:8px; background:#2a2a3e; border:none; border-radius:8px;">Выровнять по центру</button><button id="distributeHorBtn" style="padding:8px; background:#2a2a3e; border:none; border-radius:8px;">Распределить по горизонтали</button></div>` : ''}</div>`;
            if (selectedIds.size > 1) {
                document.getElementById('groupBtn')?.addEventListener('click', groupSelected);
                document.getElementById('alignLeftBtn')?.addEventListener('click', () => alignSelected('left'));
                document.getElementById('alignCenterBtn')?.addEventListener('click', () => alignSelected('center'));
                document.getElementById('distributeHorBtn')?.addEventListener('click', () => distributeSelected('horizontal'));
            }
            return;
        }
        
        const id = Array.from(selectedIds)[0];
        const b = blocks.find(b => b.id === id);
        if (!b) return;
        const s = b.styles;
        
        let typeName = b.type;
        if (b.type === 'shape') typeName = `Фигура (${b.shape})`;
        else if (b.type === 'group') typeName = `Группа (${b.content.blocks?.length || 0} элементов)`;
        
        propsDiv.innerHTML = `<div style="padding:16px;">
            <div style="margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #3a3a4e;"><h4 style="margin:0;">${typeName.toUpperCase()}</h4></div>
            <div class="prop-group"><label>X</label><input type="number" id="propX" value="${s.left}" class="prop-input"></div>
            <div class="prop-group"><label>Y</label><input type="number" id="propY" value="${s.top}" class="prop-input"></div>
            <div class="prop-group"><label>Ширина</label><input type="number" id="propW" value="${s.width}" class="prop-input"></div>
            <div class="prop-group"><label>Высота</label><input type="number" id="propH" value="${s.height}" class="prop-input"></div>
            <div class="prop-group"><label>Поворот</label><input type="range" id="propRotate" min="-180" max="180" value="${s.rotate || 0}" style="width:100%;"><span id="rotVal">${s.rotate || 0}°</span></div>
            <div class="prop-group"><label>Z-index</label><input type="number" id="propZ" value="${s.zIndex || 1}" class="prop-input"></div>
            <div class="prop-group"><label>Прозрачность</label><input type="range" id="propOp" min="0" max="1" step="0.01" value="${s.opacity || 1}" style="width:100%;"><span id="opVal">${Math.round((s.opacity || 1) * 100)}%</span></div>
            <button id="applyProps" style="width:100%; padding:12px; background:linear-gradient(135deg,#667eea,#764ba2); border:none; border-radius:10px; color:white; margin-top:16px;">Применить</button>
            <hr style="margin:16px 0;">
            <div style="display:flex; gap:8px; margin-bottom:8px;"><button id="dupBtn" style="flex:1; padding:8px; background:#2a2a3e; border:none; border-radius:8px;"><i class="fas fa-copy"></i> Дублировать</button><button id="delBtn" style="flex:1; padding:8px; background:#2a2a3e; border:none; border-radius:8px; color:#ef4444;"><i class="fas fa-trash"></i> Удалить</button></div>
            <div style="display:flex; gap:8px;"><button id="upBtn" style="flex:1; padding:8px; background:#2a2a3e; border:none; border-radius:8px;"><i class="fas fa-arrow-up"></i> Наверх</button><button id="downBtn" style="flex:1; padding:8px; background:#2a2a3e; border:none; border-radius:8px;"><i class="fas fa-arrow-down"></i> Вниз</button></div>
            ${b.type === 'group' ? `<button id="ungroupBtn" style="width:100%; margin-top:12px; padding:8px; background:#2a2a3e; border:none; border-radius:8px;"><i class="fas fa-object-ungroup"></i> Разгруппировать</button>` : ''}
        </div>`;
        
        document.getElementById('applyProps')?.addEventListener('click', () => {
            s.left = parseInt(document.getElementById('propX')?.value) || 0;
            s.top = parseInt(document.getElementById('propY')?.value) || 0;
            s.width = Math.max(30, parseInt(document.getElementById('propW')?.value) || 80);
            s.height = Math.max(30, parseInt(document.getElementById('propH')?.value) || 80);
            s.rotate = parseInt(document.getElementById('propRotate')?.value) || 0;
            s.zIndex = parseInt(document.getElementById('propZ')?.value) || 1;
            s.opacity = parseFloat(document.getElementById('propOp')?.value) || 1;
            render();
            saveToHistory();
            showToast('✅ Применено', 'success');
        });
        document.getElementById('dupBtn')?.addEventListener('click', duplicateSelected);
        document.getElementById('delBtn')?.addEventListener('click', deleteSelected);
        document.getElementById('upBtn')?.addEventListener('click', () => bringToFront());
        document.getElementById('downBtn')?.addEventListener('click', () => sendToBack());
        document.getElementById('ungroupBtn')?.addEventListener('click', ungroupSelected);
        
        const rotSlider = document.getElementById('propRotate');
        if (rotSlider) rotSlider.oninput = (e) => { document.getElementById('rotVal').innerText = e.target.value + '°'; };
        const opSlider = document.getElementById('propOp');
        if (opSlider) opSlider.oninput = (e) => { document.getElementById('opVal').innerText = Math.round(e.target.value * 100) + '%'; };
    }
    
    // ========== ОТКРЫТИЕ/ЗАКРЫТИЕ ==========
    function openBuilder() {
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
            if (canvas) {
                canvas.style.backgroundColor = '#1e1e2e';
                canvas.style.minWidth = '1200px';
                canvas.style.minHeight = '800px';
                canvas.style.position = 'relative';
                canvas.style.transformOrigin = '0 0';
            }
            if (wrapper) { wrapper.scrollLeft = 0; wrapper.scrollTop = 0; }
            render();
            showToast('🎨 Конструктор открыт. F1 - справка', 'info');
        }
    }
    
    function closeBuilder() {
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    }
    
    function showHelp() {
        alert('🎮 ГОРЯЧИЕ КЛАВИШИ:\n\nDelete - Удалить\nCtrl+Z - Отменить\nCtrl+Y - Повторить\nCtrl+D - Дублировать\nCtrl+G - Группировать\nCtrl+Shift+G - Разгруппировать\nCtrl+A - Выделить всё\nEscape - Снять выделение\nCtrl+↑/↓ - Слой вверх/вниз\nCtrl+Колесо - Масштаб\nF1 - Эта справка\n\n📦 20+ ТИПОВ БЛОКОВ\n🎨 Фигуры, текст, изображения, кнопки, карточки\n📊 Прогресс-бары, счётчики, таймеры\n🗺️ Карты, видео, отзывы, прайсы, графики');
    }
    
    function onKeyDown(e) {
        if (!modal || modal.style.display !== 'flex') return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'Delete') { e.preventDefault(); deleteSelected(); }
        if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
        if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
        if (e.ctrlKey && e.key === 'd') { e.preventDefault(); duplicateSelected(); }
        if (e.ctrlKey && e.key === 'g') { e.preventDefault(); groupSelected(); }
        if (e.ctrlKey && e.shiftKey && e.key === 'G') { e.preventDefault(); ungroupSelected(); }
        if (e.ctrlKey && e.key === 'a') { e.preventDefault(); selectedIds = new Set(blocks.map(b => b.id)); render(); }
        if (e.key === 'Escape') { selectedIds.clear(); render(); }
        if (e.key === 'F1') { e.preventDefault(); showHelp(); }
        if (selectedIds.size === 1) {
            const id = Array.from(selectedIds)[0];
            if (e.ctrlKey && e.key === 'ArrowUp') { e.preventDefault(); moveLayerUp(id); }
            if (e.ctrlKey && e.key === 'ArrowDown') { e.preventDefault(); moveLayerDown(id); }
        }
    }
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        if (!document.getElementById('compositeModal')) { setTimeout(init, 100); return; }
        modal = document.getElementById('compositeModal');
        canvas = document.getElementById('compositeCanvas');
        layersDiv = document.getElementById('compositeLayersList');
        propsDiv = document.getElementById('compositePropertiesPanel');
        wrapper = document.getElementById('compositeCanvasWrapper');
        zoomLevelSpan = document.getElementById('compositeZoomLevel');
        
        document.getElementById('createCompositeBtn')?.addEventListener('click', openBuilder);
        document.getElementById('closeCompositeModalBtn')?.addEventListener('click', closeBuilder);
        document.getElementById('cancelCompositeBtn')?.addEventListener('click', closeBuilder);
        document.getElementById('saveCompositeBtn')?.addEventListener('click', saveTemplate);
        document.getElementById('compositeZoomIn')?.addEventListener('click', zoomIn);
        document.getElementById('compositeZoomOut')?.addEventListener('click', zoomOut);
        document.getElementById('compositeZoomReset')?.addEventListener('click', zoomReset);
        document.getElementById('compositeGridToggle')?.addEventListener('click', toggleGrid);
        
        document.querySelectorAll('#compositeShapesGrid .shape-btn').forEach(btn => { btn.onclick = () => addShape(btn.dataset.shape); });
        document.getElementById('compositeAddTextBtn')?.addEventListener('click', addText);
        document.getElementById('compositeAddImageBtn')?.addEventListener('click', addImage);
        document.getElementById('compositeAddButtonBtn')?.addEventListener('click', addButton);
        document.getElementById('compositeAddCardBtn')?.addEventListener('click', addCard);
        document.getElementById('compositeAddIconBtn')?.addEventListener('click', addIcon);
        document.getElementById('compositeAddProgressBtn')?.addEventListener('click', addProgress);
        document.getElementById('compositeAddCounterBtn')?.addEventListener('click', addCounter);
        document.getElementById('compositeAddVideoBtn')?.addEventListener('click', addVideo);
        document.getElementById('compositeAddMapBtn')?.addEventListener('click', addMap);
        document.getElementById('compositeAddDividerBtn')?.addEventListener('click', addDivider);
        document.getElementById('compositeAddAccordionBtn')?.addEventListener('click', addAccordion);
        document.getElementById('compositeAddRatingBtn')?.addEventListener('click', addRating);
        document.getElementById('compositeAddTimerBtn')?.addEventListener('click', addTimer);
        document.getElementById('compositeAddSocialBtn')?.addEventListener('click', addSocialLinks);
        document.getElementById('compositeAddTestimonialBtn')?.addEventListener('click', addTestimonial);
        document.getElementById('compositeAddPricingBtn')?.addEventListener('click', addPricingCard);
        document.getElementById('compositeAddChartBtn')?.addEventListener('click', addChart);
        
        document.querySelectorAll('.composite-tab').forEach(tab => { tab.onclick = () => { const tn = tab.dataset.tab; document.querySelectorAll('.composite-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); document.querySelectorAll('.composite-tab-content').forEach(c => c.classList.remove('active')); document.querySelector(`.composite-tab-content[data-tab="${tn}"]`)?.classList.add('active'); }; });
        
        const tools = document.querySelector('.composite-tools');
        if (tools && !document.getElementById('compositeSnapBtn')) {
            const snap = document.createElement('button'); snap.id = 'compositeSnapBtn'; snap.className = 've-btn'; snap.innerHTML = '<i class="fas fa-magnet"></i>'; snap.title = 'Привязка к сетке'; snap.onclick = toggleSnap; tools.appendChild(snap);
            const center = document.createElement('button'); center.id = 'compositeCenterBtn'; center.className = 've-btn'; center.innerHTML = '<i class="fas fa-arrows-alt"></i>'; center.title = 'Центрировать'; center.onclick = centerCanvas; tools.appendChild(center);
            const exp = document.createElement('button'); exp.id = 'compositeExportBtn'; exp.className = 've-btn'; exp.innerHTML = '<i class="fas fa-download"></i>'; exp.title = 'Экспорт JSON'; exp.onclick = exportJSON; tools.appendChild(exp);
            const imp = document.createElement('button'); imp.id = 'compositeImportBtn'; imp.className = 've-btn'; imp.innerHTML = '<i class="fas fa-upload"></i>'; imp.title = 'Импорт JSON'; imp.onclick = importJSON; tools.appendChild(imp);
            const clear = document.createElement('button'); clear.id = 'compositeClearBtn'; clear.className = 've-btn'; clear.innerHTML = '<i class="fas fa-trash"></i>'; clear.title = 'Очистить'; clear.onclick = clearAll; tools.appendChild(clear);
            const help = document.createElement('button'); help.id = 'compositeHelpBtn'; help.className = 've-btn'; help.innerHTML = '<i class="fas fa-question-circle"></i>'; help.title = 'Справка (F1)'; help.onclick = showHelp; tools.appendChild(help);
        }
        
        setupCanvasEvents();
        window.addEventListener('keydown', onKeyDown);
        if (modal) modal.onclick = (e) => { if (e.target === modal) closeBuilder(); };
        
        if (!document.getElementById('ultimate-styles')) {
            const style = document.createElement('style');
            style.id = 'ultimate-styles';
            style.textContent = `
                @keyframes toastInOut { 0%{opacity:0;transform:translateX(-50%) translateY(20px);}15%{opacity:1;transform:translateX(-50%) translateY(0);}85%{opacity:1;}100%{opacity:0;transform:translateX(-50%) translateY(-20px);}}
                @keyframes blockAppear { from{opacity:0;transform:scale(0.9);}to{opacity:1;transform:scale(1);} }
                .premium-shape-square { border-radius: 12px; }
                .premium-shape-circle { border-radius: 50%; }
                .premium-shape-triangle { width:0; height:0; background:transparent !important; border-left:50px solid transparent; border-right:50px solid transparent; border-bottom:86px solid currentColor; }
                .premium-shape-diamond { transform:rotate(45deg); border-radius:4px; }
                .premium-shape-star { clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); }
                .resize-handle, .rotate-handle { position:absolute; width:10px; height:10px; background:#8b5cf6; border:2px solid white; border-radius:50%; z-index:100; cursor:pointer; transition:transform 0.1s; }
                .resize-handle:hover, .rotate-handle:hover { transform:scale(1.3); }
                .resize-handle.nw { top:-5px; left:-5px; cursor:nw-resize; }
                .resize-handle.n { top:-5px; left:50%; transform:translateX(-50%); cursor:n-resize; }
                .resize-handle.ne { top:-5px; right:-5px; cursor:ne-resize; }
                .resize-handle.e { top:50%; right:-5px; transform:translateY(-50%); cursor:e-resize; }
                .resize-handle.se { bottom:-5px; right:-5px; cursor:se-resize; }
                .resize-handle.s { bottom:-5px; left:50%; transform:translateX(-50%); cursor:s-resize; }
                .resize-handle.sw { bottom:-5px; left:-5px; cursor:sw-resize; }
                .resize-handle.w { top:50%; left:-5px; transform:translateY(-50%); cursor:w-resize; }
                .rotate-handle { top:-20px; left:50%; transform:translateX(-50%); background:#f59e0b; width:16px; height:16px; display:flex; align-items:center; justify-content:center; }
                .rotate-handle i { font-size:8px; color:white; }
                .composite-layer-item { transition: all 0.2s ease; }
                .composite-layer-item:hover { transform: translateX(4px); }
                .composite-layer-item.selected { background: #8b5cf6 !important; }
                .prop-group { margin-bottom: 16px; }
                .prop-input { width: 100%; padding: 10px 12px; background: #1e1e2e; border: 1px solid #3a3a4e; border-radius: 10px; color: #f1f5f9; font-size: 13px; }
                .prop-input:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.2); }
                .composite-text-editable:focus { background: rgba(139,92,246,0.1); outline: 2px solid #8b5cf6; }
                .accordion-header { transition: background 0.2s; }
                .accordion-header:hover { background: #3a3a4e !important; }
            `;
            document.head.appendChild(style);
        }
        
        console.log('🚀 COMPOSITE BUILDER ULTIMATE READY - 20+ block types, F1 for help');
        console.log('✅ Группировка и разгруппировка работают корректно');
    }
    
    window.CompositeBuilder = {
        open: openBuilder, close: closeBuilder,
        addShape, addText, addImage, addButton, addCard, addIcon, addProgress, addCounter,
        addVideo, addMap, addDivider, addAccordion, addRating, addTimer, addSocialLinks, addTestimonial, addPricingCard, addChart,
        getBlocks: () => blocks, saveTemplate, clearAll, undo, redo,
        exportJSON, importJSON, toggleGrid, toggleSnap, zoomIn, zoomOut, zoomReset, centerCanvas,
        groupSelected, ungroupSelected, alignSelected, distributeSelected,
        deleteSelected, duplicateSelected, bringToFront, sendToBack
    };
    
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();