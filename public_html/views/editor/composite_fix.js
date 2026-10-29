/**
 * Фикс Drag & Drop для конструктора составных блоков
 * Подключить в index.php перед закрывающим тегом </body>
 */

(function() {
    console.log('🔧 Загрузка фикса Drag & Drop для композитных блоков...');
    
    // Функция форсированной инициализации DnD
    window.forceCompositeDragAndDrop = function() {
        const container = document.getElementById('compositeCanvas');
        if (!container) {
            console.log('⚠️ compositeCanvas не найден');
            return;
        }
        
        const blocks = container.querySelectorAll('.composite-block');
        if (blocks.length === 0) {
            return;
        }
        
        console.log(`🔧 Инициализация DnD для ${blocks.length} композитных блоков`);
        
        blocks.forEach(block => {
            block.style.position = 'absolute';
            block.style.cursor = 'move';
            block.setAttribute('data-drag-inited', 'true');
            
            // Удаляем старые обработчики
            block.removeEventListener('mousedown', window._compositeMouseDownHandler);
            // Добавляем новый
            block.addEventListener('mousedown', window._compositeMouseDownHandler);
        });
    };
    
    // Обработчик mousedown для композитных блоков
    window._compositeMouseDownHandler = function(e) {
        const block = e.target.closest('.composite-block');
        if (!block) return;
        
        // Предотвращаем конфликт с основным DnD редактора
        e.preventDefault();
        e.stopPropagation();
        
        const blockId = block.dataset.id;
        if (!blockId) return;
        
        // Получаем текущие координаты
        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = parseInt(block.style.left) || 0;
        const startTop = parseInt(block.style.top) || 0;
        const width = block.offsetWidth;
        const height = block.offsetHeight;
        
        let isDragging = false;
        let ghost = null;
        
        console.log(`🖱️ Начат Drag для блока ${blockId}`);
        
        function onMouseMove(moveEvent) {
            moveEvent.preventDefault();
            moveEvent.stopPropagation();
            
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            
            // Активируем перетаскивание только после смещения > 3px
            if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
                isDragging = true;
                
                // Создаём призрак
                ghost = block.cloneNode(true);
                ghost.style.cssText = `
                    position: fixed;
                    left: ${moveEvent.clientX - width/2}px;
                    top: ${moveEvent.clientY - height/2}px;
                    width: ${width}px;
                    height: ${height}px;
                    opacity: 0.5;
                    pointer-events: none;
                    z-index: 100000;
                    transform: scale(0.98);
                    transition: none;
                `;
                document.body.appendChild(ghost);
                block.classList.add('dragging');
                
                console.log(`🔄 Перетаскивание активировано`);
            }
            
            if (isDragging && ghost) {
                // Перемещаем призрак
                ghost.style.left = (moveEvent.clientX - width/2) + 'px';
                ghost.style.top = (moveEvent.clientY - height/2) + 'px';
                
                // Перемещаем оригинальный блок
                const newLeft = startLeft + dx;
                const newTop = startTop + dy;
                
                // Ограничиваем границы канваса
                const canvas = document.getElementById('compositeCanvas');
                if (canvas) {
                    const maxLeft = canvas.clientWidth - width;
                    const maxTop = canvas.clientHeight - height;
                    block.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
                    block.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
                } else {
                    block.style.left = newLeft + 'px';
                    block.style.top = newTop + 'px';
                }
                
                // Обновляем данные в tempPageData (если существует)
                if (typeof window.tempPageData !== 'undefined' && window.tempPageData.blocks) {
                    const blockData = window.tempPageData.blocks.find(b => b.id === blockId);
                    if (blockData) {
                        if (!blockData.styles) blockData.styles = {};
                        blockData.styles.left = block.style.left;
                        blockData.styles.top = block.style.top;
                    }
                }
            }
        }
        
        function onMouseUp(upEvent) {
            // Удаляем призрак
            if (ghost) ghost.remove();
            block.classList.remove('dragging');
            
            if (isDragging) {
                console.log(`✅ Drag завершён для блока ${blockId}`);
                if (typeof window.saveCompositeState === 'function') {
                    window.saveCompositeState();
                }
                if (typeof window.showToast === 'function') {
                    window.showToast('Блок перемещён');
                }
            }
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
    
    // Переопределяем функцию рендера композитного холста
    if (typeof window.renderCompositeCanvas === 'function') {
        const originalRenderCompositeCanvas = window.renderCompositeCanvas;
        window.renderCompositeCanvas = function() {
            originalRenderCompositeCanvas();
            setTimeout(() => window.forceCompositeDragAndDrop(), 50);
        };
    }
    
    // Переопределяем открытие модального окна
    if (typeof window.openCompositeModal === 'function') {
        const originalOpenCompositeModal = window.openCompositeModal;
        window.openCompositeModal = function() {
            originalOpenCompositeModal();
            setTimeout(() => window.forceCompositeDragAndDrop(), 100);
        };
    }
    
    // Добавляем наблюдатель за появлением блоков
    const compositeObserver = new MutationObserver(function(mutations) {
        let needInit = false;
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && (node.classList?.contains('composite-block') || node.querySelector?.('.composite-block'))) {
                        needInit = true;
                        break;
                    }
                }
            }
        }
        if (needInit) {
            setTimeout(() => window.forceCompositeDragAndDrop(), 50);
        }
    });
    
    // Запускаем наблюдатель
    const checkCanvas = setInterval(function() {
        const canvas = document.getElementById('compositeCanvas');
        if (canvas) {
            compositeObserver.observe(canvas, { childList: true, subtree: true });
            clearInterval(checkCanvas);
            console.log('🔍 MutationObserver для compositeCanvas активирован');
            
            // Первичная инициализация
            setTimeout(() => window.forceCompositeDragAndDrop(), 100);
        }
    }, 500);
    
    console.log('✅ Фикс Drag & Drop для композитных блоков загружен');
})();