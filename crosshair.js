(function() {
    console.log("🎯 MESH Crosshair: Умный прицел v4 (Полный крестик)");

    let initIvl = setInterval(() => {
        if (document.body) {
            clearInterval(initIvl);
            initCrosshair();
        }
    }, 100);

    function initCrosshair() {
        // Горизонтальная линия
        const xLine = document.createElement('div');
        xLine.id = 'mesh-crosshair-x';
        xLine.style.cssText = 'position:fixed; background:rgba(52, 152, 219, 0.15); pointer-events:none; z-index:99; display:none; transition: top 0.05s ease, height 0.05s ease; will-change: top, height, left, width; transform: translateZ(0); backface-visibility: hidden;';
        
        // Вертикальная линия
        const yLine = document.createElement('div');
        yLine.id = 'mesh-crosshair-y';
        yLine.style.cssText = 'position:fixed; background:rgba(52, 152, 219, 0.15); pointer-events:none; z-index:99; display:none; transition: left 0.05s ease, width 0.05s ease; will-change: left, width, top, height; transform: translateZ(0); backface-visibility: hidden;';

        document.body.appendChild(xLine);
        document.body.appendChild(yLine);

        let activeCell = null;
        let activeTarget = null; // Кэш для оптимизации
        let isEnabled = true;
        let isUpdating = false;

        // Синхронизация с тумблером (можно привязать к своему, сейчас привязан к autoGrader)
        chrome.storage.sync.get(['autoGrader'], (data) => {
            if (data && data.autoGrader === false) isEnabled = false;
        });
        
        chrome.runtime.onMessage.addListener((req) => {
            if (req.action === "updateSettings" && req.settings.autoGrader !== undefined) {
                isEnabled = req.settings.autoGrader !== false;
                if (!isEnabled) { xLine.style.display = 'none'; yLine.style.display = 'none'; }
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isUpdating || e.target === activeTarget) return;
            activeTarget = e.target;
            isUpdating = true;

            requestAnimationFrame(() => {
                isUpdating = false;
                
                if (!isEnabled || !window.location.href.includes('journal')) {
                    xLine.style.display = 'none';
                    yLine.style.display = 'none';
                    return;
                }

                // Ищем ячейку под курсором
                const cell = e.target.closest('td, th, [role="cell"], [role="gridcell"], .ant-table-cell');
                
                // Не рисуем, если навели на самую верхнюю шапку с датами
                if (!cell || cell.closest('thead') || cell.closest('.ant-table-thead')) {
                    xLine.style.display = 'none';
                    yLine.style.display = 'none';
                    activeCell = null;
                    return;
                }

                if (activeCell === cell) return;
                activeCell = cell;

                const rect = cell.getBoundingClientRect();

                // Ищем границы самой таблицы, чтобы крестик не вылезал за её пределы
                const tableWrapper = cell.closest('.ant-table-wrapper, .Dnevnik-grid, table') || document.querySelector('main') || document.querySelector('.ant-layout-content') || document.body;
                const wrapRect = tableWrapper.getBoundingClientRect();

                // ГОРИЗОНТАЛЬНАЯ ЛИНИЯ 
                xLine.style.left = Math.max(wrapRect.left, 0) + 'px';
                xLine.style.width = wrapRect.width + 'px';
                xLine.style.top = rect.top + 'px';
                xLine.style.height = rect.height + 'px';
                xLine.style.display = 'block';

                // ВЕРТИКАЛЬНАЯ ЛИНИЯ
                yLine.style.top = Math.max(wrapRect.top, 0) + 'px';
                const visibleHeight = Math.min(wrapRect.bottom, window.innerHeight) - Math.max(wrapRect.top, 0);
                yLine.style.height = visibleHeight + 'px';
                yLine.style.left = rect.left + 'px';
                yLine.style.width = rect.width + 'px';
                yLine.style.display = 'block';
            });
        });

        // Прячем при уходе мыши со страницы
        document.addEventListener('mouseleave', () => {
            xLine.style.display = 'none';
            yLine.style.display = 'none';
            activeCell = null;
        });
    }
})();