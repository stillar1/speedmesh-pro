(function() {
    if (window._autoKtpInjected) return;
    window._autoKtpInjected = true;

    // Стили для кнопки и лоадера
    const style = document.createElement('style');
    style.innerHTML = `
        .speedmesh-ktp-btn {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white; border: none; padding: 10px 15px; border-radius: 8px;
            font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center;
            gap: 8px; font-size: 13px; width: 100%; transition: 0.2s; box-shadow: 0 4px 10px rgba(16,185,129,0.3);
            margin-top: 10px;
        }
        .speedmesh-ktp-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .speedmesh-ktp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
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
                if (key.includes('didactic-themes')) {
                    return dump[key].response;
                }
            }
        } catch (e) {}
        return null;
    }

    async function generateKTP() {
        const ktpId = findKtpIdFromUrl();
        if (!ktpId) {
            alert("❌ Ошибка: Вы должны находиться внутри КТП (URL должен содержать номер плана). Сохраните план хотя бы один раз.");
            return;
        }

        const rpData = extractRpFromSpy();
        if (!rpData || !rpData.themes || !rpData.didactic_units) {
            alert("❌ Ошибка: Не удалось найти скачанную Рабочую Программу (РП). Пожалуйста, включите 'Шпион', обновите страницу КТП (чтобы МЭШ загрузил РП) и попробуйте снова.");
            return;
        }

        const btn = document.getElementById('btn-auto-ktp');
        if (btn) { btn.disabled = true; btn.innerHTML = "⏳ Генерация..."; }

        try {
            // 1. Fetch current KTP structure
            const planRes = await fetch(`https://school.mos.ru/api/profeducation/plan/teacher/v1/lesson_plans/${ktpId}`);
            if (!planRes.ok) throw new Error("Не удалось получить текущий КТП");
            const planData = await planRes.json();
            const ktp = planData.lesson_plan;

            // 2. Build new Modules array
            const newModules = [];
            let moduleOrdinal = 1;

            rpData.themes.forEach(theme => {
                // Find units for this theme
                const units = rpData.didactic_units.filter(u => u.theme_id === theme.id);
                if (units.length === 0) return;

                const newLessons = [];
                let lessonOrdinal = 1;

                units.forEach(unit => {
                    const titleLow = unit.title.toLowerCase();
                    const isPractice = titleLow.includes('практическ') || titleLow.includes('лабораторн') || titleLow.includes('выполнени');
                    const lessonType = isPractice ? 3 : 1; // 3 - ПЗ, 1 - УЗ

                    // Урок 1 (Пара часть 1)
                    newLessons.push({
                        name: unit.title,
                        ordinal: lessonOrdinal++,
                        theme_frame_ids: [unit.id],
                        controllable_items: [],
                        eom_urls: [],
                        is_hw_planned: false,
                        is_test_planned: false,
                        lesson_type_spo_id: lessonType,
                        is_intermediate_attestation: false,
                        scripts: "[]"
                    });
                    
                    // Урок 2 (Пара часть 2) - Копия
                    newLessons.push({
                        name: unit.title + " (продолжение)",
                        ordinal: lessonOrdinal++,
                        theme_frame_ids: [unit.id],
                        controllable_items: [],
                        eom_urls: [],
                        is_hw_planned: false,
                        is_test_planned: false,
                        lesson_type_spo_id: lessonType,
                        is_intermediate_attestation: false,
                        scripts: "[]"
                    });
                });

                newModules.push({
                    id: null, // Let MESH assign new IDs
                    name: theme.title,
                    ordinal: moduleOrdinal++,
                    topics: [
                        {
                            id: null,
                            ordinal: 1,
                            name: theme.title,
                            repeatable: false,
                            theme_frame_id: theme.id,
                            color: "#EF5350",
                            lessons: newLessons
                        }
                    ]
                });
            });

            // 3. Prepare payload for PUT
            const payload = {
                academic_year_id: ktp.academic_year_id,
                modules: newModules,
                is_template: ktp.template || false,
                is_system: ktp.system || false,
                class_level_id: ktp.class_level_id,
                course_lesson_plan_spo_id: ktp.course_lesson_plan_spo_id,
                name: ktp.name,
                status: "published", // Let's keep it published or what it was
                knowledge_field_id: ktp.knowledge_field_id,
                parent_subject_id: ktp.parent_subject_id,
                owner_ids: ktp.owner_ids,
                study_level_id: ktp.study_level_id,
                subject_id: ktp.subject_id,
                id: ktp.id
            };

            // 4. Send PUT request
            const saveRes = await fetch(`https://school.mos.ru/api/profeducation/plan/teacher/v1/lesson_plans/${ktp.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!saveRes.ok) throw new Error("Сервер отклонил сохранение КТП");

            if (btn) { btn.innerHTML = "✅ Успешно! Обновите страницу"; }
            alert("🎉 КТП успешно сгенерирован и разбит на ПАРЫ (1 пара = 2 урока). Обновите страницу, чтобы увидеть изменения!");

        } catch (err) {
            console.error(err);
            if (btn) { btn.disabled = false; btn.innerHTML = "❌ Ошибка (см. консоль)"; }
            alert("Произошла ошибка: " + err.message);
        }
    }

    function injectButton() {
        const targetPanel = document.getElementById('speedmesh-ktp-panel');
        if (targetPanel && !document.getElementById('btn-auto-ktp')) {
            const btn = document.createElement('button');
            btn.id = 'btn-auto-ktp';
            btn.className = 'speedmesh-ktp-btn';
            btn.innerHTML = '⚡ Авто-генерация КТП (Пары)';
            btn.onclick = generateKTP;
            
            // Вставляем кнопку после заголовка панели
            targetPanel.insertBefore(btn, targetPanel.childNodes[1]);
        }
    }

    // Слушаем появление панели КТП
    setInterval(injectButton, 1000);
})();
