// mentor_journals.js
(function() {
    let initInterval = setInterval(() => {
        if (!document.body) return;
        const isMentorJournals = window.location.href.includes('spo/teacher/mentor/journals');
        
        let p = document.getElementById('speedmesh-mentor-panel');
        if (!isMentorJournals) {
            if (p) p.remove();
            return;
        }

        if (p) {
            // Update group count if it changed
            let groupsStr = window.sessionStorage.getItem('MESH_MENTOR_GROUPS');
            if (groupsStr && p.dataset.groups !== groupsStr) {
                p.remove(); // Force recreate to update count
            } else {
                return;
            }
        }

        // Try to read groups from sessionStorage (saved by interceptor)
        let groupsStr = window.sessionStorage.getItem('MESH_MENTOR_GROUPS');
        let groups = [];
        if (groupsStr) {
            try { 
                let rawGroups = JSON.parse(groupsStr); 
                groups = rawGroups.filter(g => {
                    // 1. Официальный флаг метагруппы
                    if (g.is_metagroup) return false;
                    // 2. Если привязано больше одного класса
                    if (g.class_unit_ids && g.class_unit_ids.length > 1) return false;
                    
                    // 3. Проверка по названию на несколько номеров ИСП или РУПО
                    let normName = (g.name || "").toUpperCase().replace(/\s+/g, '');
                    let matches = normName.match(/(?:ИСП|РУПО)\d+/g) || [];
                    let uniqueGroups = new Set(matches);
                    if (uniqueGroups.size > 1) return false;
                    
                    return true;
                });
            } catch(e){}
        }

        const panel = document.createElement('div');
        panel.id = 'speedmesh-mentor-panel';
        panel.dataset.groups = groupsStr || '';
        panel.style.cssText = "position:fixed; bottom:20px; left:20px; z-index:9999999; background:rgba(20, 25, 30, 0.85); border: 1px solid #9b59b6; color:white; padding:15px; border-radius:12px; display:flex; flex-direction:column; gap:10px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); backdrop-filter: blur(10px); font-family: sans-serif;";
        
        let title = document.createElement('div');
        title.innerHTML = `📚 Журналы куратора <br><span style="font-size:11px; color:#bdc3c7;">Найдено групп: ${groups.length}</span>`;
        title.style.cssText = "font-size:14px; font-weight:bold; color:#9b59b6; text-align:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px;";
        panel.appendChild(title);

        if (groups.length > 0) {
            let btn = document.createElement('button');
            btn.innerText = '⬇️ Скачать все журналы (' + groups.length + ')';
            btn.style.cssText = "background:#27ae60; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; transition:0.2s;";
            btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
            btn.onmouseout = () => btn.style.transform = 'scale(1)';
            
            btn.onclick = async () => {
                btn.innerText = '⏳ Подготовка...';
                btn.style.pointerEvents = 'none';
                
                // Fetch authorization tokens (either from cookies or interceptor cache)
                let aupd_token = null; let profile_id = null; let meshStolenHeaders = {};
                const tk = document.cookie.match(/(?:^|; )aupd_token=([^;]*)/); 
                const pr = document.cookie.match(/(?:^|; )profile_id=([^;]*)/);
                if(tk) aupd_token = decodeURIComponent(tk[1]); 
                if(pr) profile_id = decodeURIComponent(pr[1]);
                try { meshStolenHeaders = JSON.parse(window.sessionStorage.getItem('MESH_KTP_HEADERS') || "{}"); let auth = meshStolenHeaders['Authorization'] || meshStolenHeaders['authorization']; if(auth && auth.includes('Bearer ')) aupd_token = auth.replace('Bearer ', ''); let pId = meshStolenHeaders['Profile-Id'] || meshStolenHeaders['profile-id'] || meshStolenHeaders['Profile-id']; if(pId) profile_id = pId; } catch(e) {}
                
                let reqHeaders = { "Accept": "application/json, text/plain, */*", "x-mes-subsystem": "profeducation" };
                if (aupd_token) reqHeaders["Authorization"] = `Bearer ${aupd_token}`;
                if (profile_id) reqHeaders["Profile-Id"] = profile_id;
                reqHeaders = { ...reqHeaders, ...meshStolenHeaders };

                let downloaded = 0;
                let failed = 0;

                let currentYear = new Date().getFullYear();
                let month = new Date().getMonth(); 
                let yearStart = month < 7 ? currentYear - 1 : currentYear;
                let yearEnd = yearStart + 1;
                let startAt = `${yearStart}-09-01T00:00:00.000Z`;
                let stopAt = `${yearEnd}-08-31T00:00:00.000Z`;

                // Инициализируем архиватор
                let zip = null;
                if (typeof JSZip !== 'undefined') {
                    zip = new JSZip();
                } else {
                    console.error("JSZip не загружен!");
                }

                for (let i = 0; i < groups.length; i++) {
                    const g = groups[i];
                    btn.innerText = `⏳ Собираем архивом ${i+1}/${groups.length}`;
                    try {
                        const url = `https://school.mos.ru/api/profeducation/core/teacher/v1/journals/export?group_ids=${g.id}&start_at=${startAt}&stop_at=${stopAt}`;
                        const res = await fetch(url, { headers: reqHeaders });
                        if (res.ok) {
                            const blob = await res.blob();
                            const safeName = g.name.replace(/[\/\\:\*\?"<>\|]/g, '').trim();
                            if (zip) {
                                zip.file(`Журнал_${safeName}.xlsx`, blob);
                            } else {
                                // Fallback на одиночное скачивание, если JSZip не прогрузился
                                const a = document.createElement('a');
                                a.href = URL.createObjectURL(blob);
                                a.download = `Журнал_${safeName}.xlsx`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                            }
                            downloaded++;
                        } else {
                            failed++;
                        }
                    } catch(e) {
                        failed++;
                    }
                    // Пауза 500мс для защиты от rate-limit
                    await new Promise(r => setTimeout(r, 500));
                }
                
                if (zip && downloaded > 0) {
                    btn.innerText = `📦 Формируем ZIP архив...`;
                    try {
                        const zipBlob = await zip.generateAsync({ type: "blob" });
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(zipBlob);
                        
                        // Определяем название группы из первого скачанного файла, если возможно
                        let courseName = "Журналы_Куратора";
                        let match = groups[0].name.match(/(?:ИСП|РУПО)\d+(\.\d+)?/);
                        if (match) courseName = match[0];
                        
                        a.download = `${courseName}_Журналы_${yearStart}-${yearEnd}.zip`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    } catch(e) {
                        console.error("Ошибка при создании ZIP", e);
                    }
                }
                
                btn.innerText = `✅ Успешно: ${downloaded}` + (failed > 0 ? `, ❌ Ошибок: ${failed}` : '');
                setTimeout(() => { btn.innerText = '⬇️ Скачать все журналы (' + groups.length + ')'; btn.style.pointerEvents = 'auto'; }, 3000);
            };
            panel.appendChild(btn);
        } else {
            let info = document.createElement('div');
            info.innerHTML = "<i>Выберите курс и подождите<br>загрузки списка предметов...</i>";
            info.style.cssText = "font-size:12px; color:#bdc3c7; text-align:center;";
            panel.appendChild(info);
        }

        document.body.appendChild(panel);
        
        // Make draggable if Window Manager is loaded
        if (window.makeMeshDraggable) {
            setTimeout(() => {
                if (window.makeMeshDraggable) window.makeMeshDraggable(panel, "📚");
            }, 1000);
        }

    }, 1500); // Check every 1.5s for page change
})();
