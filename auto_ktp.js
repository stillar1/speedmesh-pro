(function() {
    if (window._autoKtpInjectedV2) return;
    window._autoKtpInjectedV2 = true;

    const style = document.createElement('style');
    style.innerHTML = `
        .mesh-auto-ktp-panel {
            position: fixed; bottom: 30px; left: 350px; z-index: 2147483647;
            background: rgba(20, 25, 30, 0.85); backdrop-filter: blur(16px);
            border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px;
            padding: 15px; color: white; font-family: sans-serif;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 220px;
        }
        .mesh-auto-ktp-btn {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white; border: none; padding: 10px; border-radius: 8px;
            font-weight: bold; cursor: pointer; width: 100%; transition: 0.2s;
            display: flex; align-items: center; justify-content: center; font-size: 13px;
        }
        .mesh-auto-ktp-btn:hover { filter: brightness(1.2); }
        .mesh-auto-ktp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .mesh-auto-ktp-title { font-size: 14px; font-weight: bold; color: #10b981; margin-bottom: 10px; text-align: center; }
    `;
    document.head.appendChild(style);

    function findKtpIdFromUrl() {
        const match = location.href.match(/programs\/(\d+)/);
        return match ? match[1] : null;
    }

    function extractRpFromSpy() {
        try {
            const dump = JSON.parse(sessionStorage.getItem('MESH_API_DUMP') || '{}');
            for (let key in dump) {
                if (key.includes('didactic-themes')) return dump[key].response;
            }
        } catch (e) {}
        return null;
    }

    async function generateKTP() {
        const ktpId = findKtpIdFromUrl();
        if (!ktpId) return alert("❌ Сохраните пустой КТП хотя бы 1 раз (чтобы в URL появился номер).");

        const rpData = extractRpFromSpy();
        if (!rpData || !rpData.themes || !rpData.didactic_units) {
            return alert("❌ РП не найдена! Включите 'API Шпион' и обновите страницу КТП (F5), чтобы МЭШ скачал РП.");
        }

        const btn = document.getElementById('btn-auto-ktp-run');
        if (btn) { btn.disabled = true; btn.innerHTML = "⏳ Создаю пары..."; }

        try {
            const planRes = await fetch(`https://school.mos.ru/api/profeducation/plan/teacher/v1/lesson_plans/${ktpId}`);
            if (!planRes.ok) throw new Error("Не удалось скачать текущий КТП");
            const planData = await planRes.json();
            const ktp = planData.lesson_plan;

            const newModules = [];
            let moduleOrdinal = 1;

            rpData.themes.forEach(theme => {
                const units = rpData.didactic_units.filter(u => u.theme_id === theme.id);
                if (units.length === 0) return;

                const newLessons = [];
                let lessonOrdinal = 1;

                units.forEach(unit => {
                    const titleLow = unit.title.toLowerCase();
                    const isPractice = titleLow.includes('практическ') || titleLow.includes('лабораторн') || titleLow.includes('выполнени');
                    const lessonType = isPractice ? 3 : 1; 

                    newLessons.push({
                        name: unit.title,
                        ordinal: lessonOrdinal++,
                        theme_frame_ids: [unit.id],
                        controllable_items: [], eom_urls: [],
                        is_hw_planned: false, is_test_planned: false,
                        lesson_type_spo_id: lessonType, is_intermediate_attestation: false, scripts: "[]"
                    });
                    
                    newLessons.push({
                        name: unit.title + " (ч.2)",
                        ordinal: lessonOrdinal++,
                        theme_frame_ids: [unit.id],
                        controllable_items: [], eom_urls: [],
                        is_hw_planned: false, is_test_planned: false,
                        lesson_type_spo_id: lessonType, is_intermediate_attestation: false, scripts: "[]"
                    });
                });

                newModules.push({
                    id: null,
                    name: theme.title,
                    ordinal: moduleOrdinal++,
                    topics: [{
                        id: null, ordinal: 1, name: theme.title, repeatable: false,
                        theme_frame_id: theme.id, color: "#EF5350", lessons: newLessons
                    }]
                });
            });

            const payload = {
                academic_year_id: ktp.academic_year_id, modules: newModules,
                is_template: ktp.template || false, is_system: ktp.system || false,
                class_level_id: ktp.class_level_id, course_lesson_plan_spo_id: ktp.course_lesson_plan_spo_id,
                name: ktp.name, status: "published", knowledge_field_id: ktp.knowledge_field_id,
                parent_subject_id: ktp.parent_subject_id, owner_ids: ktp.owner_ids,
                study_level_id: ktp.study_level_id, subject_id: ktp.subject_id, id: ktp.id
            };

            const saveRes = await fetch(`https://school.mos.ru/api/profeducation/plan/teacher/v1/lesson_plans/${ktp.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!saveRes.ok) throw new Error("Сервер отклонил сохранение");

            if (btn) btn.innerHTML = "✅ Готово!";
            alert("🎉 КТП сгенерирован! Обновите страницу (F5).");

        } catch (err) {
            console.error(err);
            if (btn) { btn.disabled = false; btn.innerHTML = "❌ Ошибка"; }
            alert("Ошибка: " + err.message);
        }
    }

    function checkDrawPanel() {
        if (!location.href.includes('planning/programs')) { const p = document.getElementById('mesh-auto-ktp'); if (p) p.remove(); return; }
        
        if (!document.getElementById('mesh-auto-ktp')) {
            const p = document.createElement('div');
            p.id = 'mesh-auto-ktp';
            p.className = 'mesh-auto-ktp-panel';
            p.innerHTML = `
                <div class="mesh-auto-ktp-title">⚡ Авто-генератор КТП</div>
                <button id="btn-auto-ktp-run" class="mesh-auto-ktp-btn">Собрать пары из РП</button>
            `;
            document.body.appendChild(p);
            document.getElementById('btn-auto-ktp-run').onclick = generateKTP;
        }
    }

    setInterval(checkDrawPanel, 1000);
})();
