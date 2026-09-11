// ==========================================
// 🔍 MESH Feature Scanner (Режим разработчика)
// ==========================================
(function() {
    if (window._meshScannerInjected) return;
    window._meshScannerInjected = true;

    console.log("🚀 MESH Feature Scanner Injected");

    function scanEnvironment() {
        console.log("🔎 Начинаю глубокое сканирование окружения МЭШ...");

        let report = {
            localStorageKeys: [],
            sessionStorageKeys: [],
            interestingGlobals: [],
            apiEndpoints: window.sessionStorage.getItem('MESH_API_DUMP') ? "Доступен дамп API" : "Дамп API пуст",
            frameworks: []
        };

        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key) report.localStorageKeys.push(key);
        }
        for (let i = 0; i < sessionStorage.length; i++) {
            let key = sessionStorage.key(i);
            if (key) report.sessionStorageKeys.push(key);
        }

        const keywords = ['store', 'state', 'profile', 'mesh', 'user', 'token', '__REACT', 'vue'];
        for (let key in window) {
            try {
                let lowerKey = key.toLowerCase();
                if (keywords.some(k => lowerKey.includes(k))) report.interestingGlobals.push(key);
            } catch(e) {}
        }

        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) report.frameworks.push("React");
        if (window.__VUE__) report.frameworks.push("Vue");
        
        console.table(report);
        console.log("📂 Полный сырой отчет:", report);

        let msg = document.createElement('div');
        msg.innerHTML = `✅ Сканирование завершено!<br><br>Найдено ключей LocalStorage: <b>${report.localStorageKeys.length}</b><br>Глобальных переменных: <b>${report.interestingGlobals.length}</b><br><br><i>Открой консоль (F12) для просмотра.</i>`;
        msg.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#2c3e50; color:#ecf0f1; padding:20px; border-radius:12px; z-index:999999; box-shadow:0 10px 30px rgba(0,0,0,0.5); border:1px solid #34495e; font-family:sans-serif; text-align:center;";
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 6000);
    }

    chrome.runtime.onMessage.addListener((req) => {
        if (req.action === "runFeatureScanner") {
            scanEnvironment();
        }
    });
})();
