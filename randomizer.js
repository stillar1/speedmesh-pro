(function() {
    console.log("🎲 MESH Randomizer: Загружен (Строгая привязка к Журналу)");

    if (!document.getElementById('mesh-randomizer-styles')) {
        const s = document.createElement('style');
        s.id = 'mesh-randomizer-styles';
        s.innerHTML = `
            @keyframes mesh-pulse-overlay {
                0% { background-color: rgba(155, 89, 182, 0.4); box-shadow: inset 0 2px 0 #9b59b6, inset 0 -2px 0 #9b59b6; }
                100% { background-color: rgba(155, 89, 182, 0); box-shadow: inset 0 0 0 transparent; }
            }
            html body .mesh-highlight-winner { position: relative !important; }
            html body .mesh-highlight-winner::after {
                content: "" !important; position: absolute !important;
                top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
                pointer-events: none !important; z-index: 99 !important;
                animation: mesh-pulse-overlay 4s ease-out forwards !important;
            }
            html body td.mesh-highlight-winner:first-child::after,
            html body th.mesh-highlight-winner:first-child::after {
                border-left: 5px solid #9b59b6 !important;
            }
        `;
        document.head.appendChild(s);
    }

    let isEnabled = true;
    let lastTargetCells = []; 
    let resetTimeout = null;
    let removeClassTimeout = null;

    chrome.storage.sync.get(['randomizerMode'], (data) => {
        if (data && data.randomizerMode === false) isEnabled = false;
    });

    chrome.runtime.onMessage.addListener((req) => {
        if (req.action === "updateSettings" && req.settings.randomizerMode !== undefined) {
            isEnabled = req.settings.randomizerMode;
        }
    });

    // ⚡ Постоянно проверяем URL, чтобы кнопка показывалась ТОЛЬКО в журнале
    document.addEventListener('SpeedmeshDOMReady', () => {
        const btn = document.getElementById('mesh-randomizer-btn');
        const isJournal = window.location.href.includes('journal');

        if (isEnabled && isJournal) {
            if (!btn) initRandomizer();
            else btn.style.display = 'flex';
        } else {
            if (btn) btn.style.display = 'none';
        }
    }, 1000);

    function initRandomizer() {
        if (document.getElementById('mesh-randomizer-btn')) return;
        
        const btn = document.createElement('div');
        btn.id = 'mesh-randomizer-btn';
        
        btn.style.cssText = `
            position: fixed; bottom: 30px; left: 30px; background: rgba(20, 25, 30, 0.65); backdrop-filter: blur(16px);
            color: white; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px;
            padding: 12px 24px; font-size: 14px; font-weight: bold;
            font-family: "Segoe UI", sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            cursor: pointer; z-index: 2147483646; display: flex; align-items: center; justify-content: center;
            gap: 10px; transition: all 0.3s ease; user-select: none;
        `;
        
        btn.innerHTML = `<span id="mesh-randomizer-text" style="pointer-events: none; display: flex; gap: 10px;"><span>🎲</span> Кого спросить?</span>`;
        
        btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)';  };

        btn.onclick = (e) => {
            const allNameCells = Array.from(document.querySelectorAll('td, th, [role="gridcell"], [role="rowheader"]')).filter(c => {
                const t = c.innerText.trim();
                return /^(?:\d+\s+)?[А-ЯЁ][а-яё\-]+\s+[А-ЯЁ][а-яё\-]+/.test(t) && !t.includes('Тема') && !t.includes('Итог');
            });

            if (allNameCells.length > 0) {
                if (lastTargetCells.length > 0) {
                    clearTimeout(removeClassTimeout);
                    lastTargetCells.forEach(c => c.classList.remove('mesh-highlight-winner'));
                    lastTargetCells = [];
                }

                const winnerCell = allNameCells[Math.floor(Math.random() * allNameCells.length)];
                winnerCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                let row = winnerCell.closest('tr');
                let rowKey = row ? row.getAttribute('data-row-key') : null;
                
                let targetRows = rowKey ? Array.from(document.querySelectorAll(`tr[data-row-key="${rowKey}"]`)) : [row];

                targetRows.forEach(tr => {
                    Array.from(tr.querySelectorAll('td, th')).forEach(td => lastTargetCells.push(td));
                });
                if (lastTargetCells.length === 0) lastTargetCells = [winnerCell];

                lastTargetCells.forEach(c => void c.offsetWidth); 
                lastTargetCells.forEach(c => c.classList.add('mesh-highlight-winner'));
                
                const nameText = winnerCell.innerText.replace(/^\d+\s+/, '').trim();
                const textSpan = document.getElementById('mesh-randomizer-text');
                if (textSpan) textSpan.innerHTML = `<span style="color: #e056fd;">🎯 ${nameText}</span>`;
                
                clearTimeout(resetTimeout);
                resetTimeout = setTimeout(() => { if(textSpan) textSpan.innerHTML = `<span>🎲</span> Кого спросить?`; }, 3000);

                const currentCells = lastTargetCells;
                removeClassTimeout = setTimeout(() => { currentCells.forEach(c => c.classList.remove('mesh-highlight-winner')); }, 4000);

            } else {
                const textSpan = document.getElementById('mesh-randomizer-text');
                if (textSpan) textSpan.innerHTML = `❌ Ученики не найдены`;
                clearTimeout(resetTimeout);
                resetTimeout = setTimeout(() => { if(textSpan) textSpan.innerHTML = `<span>🎲</span> Кого спросить?`; }, 2000);
            }
        };

        document.body.appendChild(btn);
        
        // Подключаем Window Manager для перемещения и сворачивания!
        setTimeout(() => { if (window.makeMeshDraggable) window.makeMeshDraggable(btn, "🎲"); }, 500);
    }
})();