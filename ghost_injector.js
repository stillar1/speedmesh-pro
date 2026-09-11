// Проверяем настройки до полной загрузки страницы
chrome.storage.sync.get(['ghostMode'], (data) => {
    // По умолчанию сделаем его включенным, если настройки еще нет
    const isEnabled = data.ghostMode !== undefined ? data.ghostMode : false;
    
    if (isEnabled) {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('ghost_mode.js');
        // Вставляем скрипт максимально высоко в иерархию документа
        (document.head || document.documentElement).appendChild(script);
        script.onload = () => script.remove(); // Убираем следы из HTML
    }
});