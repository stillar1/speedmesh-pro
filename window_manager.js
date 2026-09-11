// ==========================================
// 🪟 MESH Window Manager (Перемещение и сворачивание UI)
// ==========================================
(function() {
    if (window._meshWindowManagerInjected) return;
    window._meshWindowManagerInjected = true;

    console.log("🪟 MESH Window Manager загружен");

    window.makeMeshDraggable = function(panel, iconHtml = "⚙️") {
        if (!panel) return;
        
        // Предотвращаем повторную инициализацию
        if (panel.dataset.dragInitialized) return;
        panel.dataset.dragInitialized = "true";

        // Добавляем стили для плавности
        panel.style.transition = 'opacity 0.3s, transform 0.3s';
        
        let isCollapsed = false;
        let originalContent = [];
        let originalCss = '';
        let originalWidth = '';
        let originalHeight = '';
        let originalPadding = '';
        
        // Создаем кнопку/ручку для перетаскивания и сворачивания
        const handle = document.createElement('div');
        handle.innerHTML = iconHtml;
        handle.style.cssText = `
            position: absolute; top: -10px; left: -10px; width: 28px; height: 28px; 
            background: #2980b9; color: white; border-radius: 50%; cursor: grab; 
            display: flex; align-items: center; justify-content: center; font-size: 14px; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.5); z-index: 10000; border: 2px solid #1e272e;
            user-select: none;
        `;
        
        // Добавляем ручку в панель
        if (getComputedStyle(panel).position === 'static') {
            panel.style.position = 'relative';
        }
        panel.appendChild(handle);

        // --- Логика Сворачивания (Клик по ручке) ---
        let clickTimeout = null;
        let isDragging = false;
        
        handle.addEventListener('mousedown', (e) => {
            isDragging = false;
        });

        handle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isDragging) return; // Если было перетаскивание, не сворачиваем
            isCollapsed = !isCollapsed;
            
            if (isCollapsed) {
                // Сохраняем оригинальные стили
                originalCss = panel.style.cssText;
                originalWidth = panel.style.width;
                originalHeight = panel.style.height;
                originalPadding = panel.style.padding;
                
                // Скрываем всех детей кроме ручки
                Array.from(panel.children).forEach(child => {
                    if (child !== handle) {
                        child.dataset.originalDisplay = getComputedStyle(child).display;
                        child.style.display = 'none';
                    }
                });
                
                // Превращаем панель в кругляшок-иконку
                panel.style.width = '45px';
                panel.style.height = '45px';
                panel.style.padding = '0';
                panel.style.background = 'transparent';
                panel.style.border = 'none';
                panel.style.boxShadow = 'none';
                
                handle.style.top = '5px';
                handle.style.left = '5px';
                handle.style.width = '35px';
                handle.style.height = '35px';
                handle.style.fontSize = '18px';
                
            } else {
                // Восстанавливаем оригинальные стили
                panel.style.cssText = originalCss;
                panel.style.width = originalWidth;
                panel.style.height = originalHeight;
                panel.style.padding = originalPadding;
                
                handle.style.top = '-10px';
                handle.style.left = '-10px';
                handle.style.width = '28px';
                handle.style.height = '28px';
                handle.style.fontSize = '14px';
                
                // Возвращаем детей
                Array.from(panel.children).forEach(child => {
                    if (child !== handle) {
                        child.style.display = child.dataset.originalDisplay || '';
                    }
                });
            }
        });

        // --- Логика Перетаскивания (Drag & Drop) ---
        let startX, startY, initialLeft, initialTop;
        
        panel.addEventListener('mousedown', (e) => {
            // Игнорируем клики по кнопкам, полям ввода и чекбоксам
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.closest('button')) return;
            if (e.target === handle) return; // Ручка обрабатывается отдельно для сворачивания
            
            e.preventDefault();
            startX = e.clientX;
            startY = e.clientY;
            
            let rect = panel.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            panel.style.bottom = 'auto';
            panel.style.right = 'auto';
            panel.style.left = initialLeft + 'px';
            panel.style.top = initialTop + 'px';
            panel.style.transform = 'none'; 
            
            panel.style.cursor = 'grabbing';
            panel.style.transition = 'none'; 
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // Отдельный слушатель для ручки, чтобы можно было за нее таскать тоже
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startX = e.clientX;
            startY = e.clientY;
            
            let rect = panel.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            panel.style.bottom = 'auto';
            panel.style.right = 'auto';
            panel.style.left = initialLeft + 'px';
            panel.style.top = initialTop + 'px';
            panel.style.transform = 'none'; 
            
            handle.style.cursor = 'grabbing';
            panel.style.transition = 'none'; 
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            isDragging = true;
            let dx = e.clientX - startX;
            let dy = e.clientY - startY;
            
            let newX = initialLeft + dx;
            let newY = initialTop + dy;
            
            // Ограничения экрана
            if (newX < 0) newX = 0;
            if (newY < 0) newY = 0;
            if (newX + panel.offsetWidth > window.innerWidth) newX = window.innerWidth - panel.offsetWidth;
            if (newY + panel.offsetHeight > window.innerHeight) newY = window.innerHeight - panel.offsetHeight;

            panel.style.left = newX + 'px';
            panel.style.top = newY + 'px';
        }

        function onMouseUp(e) {
            handle.style.cursor = 'grab';
            panel.style.transition = 'opacity 0.3s, transform 0.3s, width 0.3s, height 0.3s';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            // Даем клику шанс сработать, если мышка почти не сдвинулась
            setTimeout(() => { isDragging = false; }, 50);
        }
    };
})();
