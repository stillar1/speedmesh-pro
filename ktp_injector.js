// ==========================================
// 📅 MESH KTP Injector (Темы уроков при наведении)
// ==========================================
(function() {
    console.log("📅 MESH KTP Injector: Парсер тем запущен");

    let lessonTopics = {}; 
    
    // Восстанавливаем кэш тем, если страница перезагружалась
    try { const saved = sessionStorage.getItem('MESH_LESSON_TOPICS'); if (saved) lessonTopics = JSON.parse(saved); } catch(e){}

    // Перехват API для вытаскивания тем (lesson_topic / theme)
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
        
        if (url.includes('/api/') && args[1]?.method !== 'POST' && args[1]?.method !== 'DELETE') {
            try {
                const clone = response.clone();
                clone.json().then(data => {
                    let updated = false;
                    let strData = JSON.stringify(data);
                    
                    // Регулярки для поиска связок id урока и темы в сыром JSON
                    const regex = /"id":\s*(\d+).*?"lesson_topic":\s*"([^"]+)"/g;
                    const regexAlt = /"schedule_lesson_id":\s*(\d+).*?"theme":\s*"([^"]+)"/g;
                    
                    let match;
                    while ((match = regex.exec(strData)) !== null) { lessonTopics[match[1]] = match[2]; updated = true; }
                    while ((match = regexAlt.exec(strData)) !== null) { lessonTopics[match[1]] = match[2]; updated = true; }
                    
                    if (updated) sessionStorage.setItem('MESH_LESSON_TOPICS', JSON.stringify(lessonTopics));
                }).catch(()=>{});
            } catch(e){}
        }
        return response;
    };

    // UI Подсказки
    const tooltip = document.createElement('div');
    tooltip.style.cssText = 'position:fixed; display:none; z-index:9999999; background:rgba(155, 89, 182, 0.95); backdrop-filter:blur(5px); color:white; padding:8px 12px; border-radius:6px; font-size:12px; font-family:sans-serif; max-width:250px; text-align:center; box-shadow:0 4px 15px rgba(0,0,0,0.5); pointer-events:none; border:1px solid #8e44ad;';
    
    let initIvl = setInterval(() => { if (document.body) { clearInterval(initIvl); document.body.appendChild(tooltip); } }, 500);

    document.addEventListener('mouseover', (e) => {
        const th = e.target.closest('th, [role="columnheader"]');
        if (!th || !th.innerText.match(/\d{1,2}/)) return; // Реагируем только на шапки с датами

        // Ищем индекс колонки
        const tr = th.parentElement;
        const colIndex = Array.from(tr.children).indexOf(th);
        if (colIndex === -1) return;

        // Спускаемся в первую строку таблицы, чтобы найти ID урока для этой колонки
        const firstDataRow = document.querySelector('tbody tr, [role="row"]:not(:first-child)');
        if (!firstDataRow) return;

        const cell = firstDataRow.children[colIndex];
        if (!cell) return;

        const markEl = cell.querySelector('[data-test-component*="markCell"]');
        if (!markEl) return;

        // Парсим lessonId из атрибута (например: markCell-123_456789_null)
        const attr = markEl.getAttribute('data-test-component');
        const lessonId = attr.split('_')[1];

        if (lessonId && lessonTopics[lessonId]) {
            tooltip.innerHTML = `📚 <b>Тема урока:</b><br>${lessonTopics[lessonId]}`;
            const rect = th.getBoundingClientRect();
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.bottom + 5) + 'px';
            tooltip.style.display = 'block';
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('th, [role="columnheader"]')) tooltip.style.display = 'none';
    });
})();