(function() {
    console.log("🔥 MESH KTP Module v145: Native Clone Mode + Full Logging");

    try {
        if (!document.querySelector('script[src*="ktp_interceptor.js"]')) {
            const s = document.createElement('script');
            s.src = chrome.runtime.getURL('ktp_interceptor.js');
            s.onload = function() { this.remove(); };
            (document.head || document.documentElement).appendChild(s);
        }
    } catch (e) {}

    let isKtpRunning = false;

    document.addEventListener('SpeedmeshDOMReady', () => {
        if (!document.body || isKtpRunning) return; 
        if (window.sessionStorage.getItem('MESH_KTP_HIDDEN') === 'true') return;

        chrome.storage.sync.get(null, (data) => {
            if (data.ktpModule !== false && window.location.href.includes('planning')) {
                if (!document.getElementById('mesh-ktp-panel')) drawKtpPanel();
                updatePanelUI();
            } else {
                const p = document.getElementById('mesh-ktp-panel');
                if (p) p.remove();
            }
        });
    }, 1000);

    function drawKtpPanel() {
        if (document.getElementById('mesh-ktp-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'mesh-ktp-panel';
        panel.style.cssText = 'position:fixed !important; bottom:30px !important; left:30px !important; background:rgba(20, 25, 30, 0.8) !important; backdrop-filter: blur(16px) !important; color:white !important; padding:20px 25px 15px 25px !important; border-radius:16px !important; box-shadow:0 10px 30px rgba(0,0,0,0.5) !important; z-index:2147483647 !important; display:flex !important; flex-direction:column !important; gap:10px !important; font-family:sans-serif !important; border:1px solid rgba(255,255,255,0.15) !important; width:300px !important; min-height:80px !important;';
        
        // Кнопка закрытия
        const closeBtn = document.createElement('div');
        closeBtn.id = 'mesh-ktp-close';
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = 'position:absolute !important; top:5px !important; right:12px !important; cursor:pointer !important; color:rgba(255,255,255,0.6) !important; font-size:24px !important; font-weight:bold !important; z-index:2147483647 !important; line-height:1 !important; padding:5px !important;';
        
        closeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            panel.remove();
            window.sessionStorage.setItem('MESH_KTP_HIDDEN', 'true');
            console.log("📅 КТП панель скрыта пользователем");
        };

        // Эффект при наведении
        closeBtn.onmouseover = () => closeBtn.style.color = '#ff4d4f';
        closeBtn.onmouseout = () => closeBtn.style.color = 'rgba(255,255,255,0.6)';

        panel.appendChild(closeBtn);
        document.body.appendChild(panel);
        
        // Подключаем Window Manager
        setTimeout(() => { if (window.makeMeshDraggable) window.makeMeshDraggable(panel, "📅"); }, 500);
    }

    function updatePanelUI() {
        if (window.sessionStorage.getItem('MESH_KTP_HIDDEN') === 'true') return;
        const panel = document.getElementById('mesh-ktp-panel');
        if (!panel || isKtpRunning) return;

        let ids = [];
        try {
            const stored = window.sessionStorage.getItem('MESH_KTP_IDS');
            if (stored) ids = JSON.parse(stored);
        } catch(e) {}

        if (ids.length === 0) {
            panel.innerHTML = `
                <div style="font-size:16px; font-weight:bold; color:#3498db;">🗓️ Ассистент КТП</div>
                <div style="font-size:12px; color:#f39c12; margin-top:5px;">⏳ Ожидание данных...</div>
                <div style="font-size:11px; color:#bdc3c7; line-height:1.4; margin-top:5px; padding:8px; background:rgba(255,255,255,0.05); border-radius:6px;">
                    Разверните пункт 3 <b>"Календарно-тематическое планирование"</b>.
                </div>
            `;
        } else {
            panel.innerHTML = `
                <div style="font-size:16px; font-weight:bold; color:#3498db; display:flex; justify-content:space-between;">
                    <span>🗓️ Ассистент КТП</span>
                    <span style="color:#2ecc71;">${ids.length} шт.</span>
                </div>
                <button id="ktp-btn-run" style="background:#2ecc71; color:white; border:none; border-radius:6px; padding:10px; cursor:pointer; font-weight:bold; width:100%; transition:0.2s; margin-top:5px;">🚀 Запустить авто-обновление</button>
            `;
            setTimeout(() => {
                const btn = document.getElementById('ktp-btn-run');
                if (btn) btn.onclick = () => runApiProcess(ids);
            }, 50);
        }
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // Функция отправки с перехватом текста ответа сервера
    async function apiRequest(planId, action) {
        let stolenHeaders = {};
        try {
            stolenHeaders = JSON.parse(window.sessionStorage.getItem('MESH_KTP_HEADERS') || "{}");
        } catch(e) {}

        if (Object.keys(stolenHeaders).length === 0) {
            let cookies = document.cookie.split('; ').reduce((acc, v) => {
                let parts = v.split('='); 
                if(parts[0]) acc[parts[0].trim()] = parts.slice(1).join('='); 
                return acc;
            }, {});
            stolenHeaders = {
                "Authorization": `Bearer ${decodeURIComponent(cookies['aupd_token'] || "")}`,
                "Profile-Id": decodeURIComponent(cookies['profile_id'] || ""),
                "x-mes-subsystem": "profeducation",
                "x-mes-role": "teacher"
            };
        }

        const headersToUse = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...stolenHeaders 
        };

        try {
            const res = await fetch(`https://school.mos.ru/api/profeducation/plan/teacher/v1/calendar_plans/${planId}/${action}?ignore_IA=true`, {
                method: 'POST',
                headers: headersToUse,
                body: JSON.stringify({})
            });
            // Сохраняем текстовый ответ сервера для логов
            return { ok: res.ok, status: res.status, text: await res.text().catch(()=>"") };
        } catch (e) {
            return { ok: false, status: "Network Error", err: e.message };
        }
    }

    async function runApiProcess(ids) {
        isKtpRunning = true;
        const panel = document.getElementById('mesh-ktp-panel');
        let success = 0; let fail = 0;
        let processLogs = []; // Хранилище ПОЛНОГО лога

        for (let i = 0; i < ids.length; i++) {
            const planId = ids[i];
            
            let row = document.querySelector(`tr[data-row-key="${planId}"]`);
            if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.style.backgroundColor = "rgba(52, 152, 219, 0.2)";
            }

            panel.innerHTML = `<div style="text-align:center; font-size:14px;">КТП <b>${i+1} из ${ids.length}</b><br><span style="color:#f39c12;">⏳ Достроение...</span></div>`;
            let r1 = await apiRequest(planId, 'finish');
            await sleep(600);

            panel.innerHTML = `<div style="text-align:center; font-size:14px;">КТП <b>${i+1} из ${ids.length}</b><br><span style="color:#3498db;">⏳ Пересчет...</span></div>`;
            let r2 = await apiRequest(planId, 'recalc');

            let logMsg = `=======================================\nКТП (ID: ${planId})\n`;

            if (r1.ok && r2.ok) {
                success++;
                if (row) row.style.backgroundColor = "rgba(46, 204, 113, 0.4)";
                logMsg += `✅ Успешно (Достроение: ${r1.status}, Пересчет: ${r2.status})\n`;
            } else {
                fail++;
                if (row) row.style.backgroundColor = "rgba(231, 76, 60, 0.4)";
                logMsg += `❌ ОШИБКА\n`;
                if (!r1.ok) logMsg += `[Достроение] Статус: ${r1.status}. Ответ сервера: ${r1.text || r1.err}\n`;
                if (!r2.ok) logMsg += `[Пересчет] Статус: ${r2.status}. Ответ сервера: ${r2.text || r2.err}\n`;
                
                console.error(`❌ Ошибка КТП ${planId}: Достроение=${r1.status}, Пересчет=${r2.status}`);
            }
            
            processLogs.push(logMsg);
            await sleep(500); 
        }

        // Кнопка логов теперь появляется ВСЕГДА
        let logBtnColor = fail > 0 ? "#e74c3c" : "#f39c12"; // Красная, если есть ошибки, иначе оранжевая
        let logBtnHtml = `<button id="ktp-btn-log" style="background:${logBtnColor}; color:white; border:none; border-radius:6px; padding:8px; cursor:pointer; width:100%; font-weight:bold; margin-bottom:8px; transition:0.2s;">📄 Скачать лог процесса</button>`;

        panel.innerHTML = `
            <div style="font-size:16px; font-weight:bold; color:#2ecc71; text-align:center;">✅ Готово!</div>
            <div style="text-align:center; font-size:13px; margin: 5px 0 10px 0;">Успешно: ${success} | Ошибок: ${fail}</div>
            ${logBtnHtml}
            <button id="ktp-btn-reload" style="background:#2ecc71; color:white; border:none; border-radius:6px; padding:10px; cursor:pointer; width:100%; font-weight:bold;">🔄 Обновить страницу</button>
        `;
        
        document.getElementById('ktp-btn-reload').onclick = () => window.location.reload();
        
        // Логика скачивания файла .txt
        document.getElementById('ktp-btn-log').onclick = () => {
            const header = `Лог обработки КТП МЭШ (Сгенерировано: ${new Date().toLocaleString()})\nУспешно: ${success} | Ошибок: ${fail}\n\n`;
            const blob = new Blob([header + processLogs.join('\n')], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `MESH_KTP_Log_${new Date().toISOString().slice(0,10)}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
    }
})();