import re

def safe_replace(file_path, replacements):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    changed = False
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            changed = True
    if changed:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Patched {file_path}")

safe_replace(
    "/Users/daniilstalmakov/Desktop/speedmesh /speedmesh/achievements.js",
    [
        ("chrome.storage.sync.get(['speedUp'], (data) => { if (data.speedUp) unlockBadge('turbo'); });",
         "try { chrome.storage.sync.get(['speedUp'], (data) => { if (data.speedUp) unlockBadge('turbo'); }); } catch(e) {}")
    ]
)

with open("/Users/daniilstalmakov/Desktop/speedmesh /speedmesh/timer.js", "r", encoding="utf-8") as f:
    timer_content = f.read()

timer_content = timer_content.replace(
    "setInterval(() => { if (document.body) { if(!isTimerInitialized)",
    "let timerInterval = setInterval(() => { try { if (document.body) { if(!isTimerInitialized)"
)
timer_content = timer_content.replace(
    "isTimerInitialized = true; } updateTimer(); } }, 1000);",
    "isTimerInitialized = true; } updateTimer(); } } catch(e) { if(e.message && e.message.includes('context')) clearInterval(timerInterval); } }, 1000);"
)

with open("/Users/daniilstalmakov/Desktop/speedmesh /speedmesh/timer.js", "w", encoding="utf-8") as f:
    f.write(timer_content)

