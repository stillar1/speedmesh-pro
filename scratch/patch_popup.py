import re

file_path = "/Users/daniilstalmakov/Desktop/speedmesh /speedmesh/popup.html"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

replacement = """<div class="section-title" style="margin-top: 15px;">Режим Разработчика / Сканер</div>
 <button id="runScannerBtn" class="btn" style="background: rgba(20, 184, 166, 0.2); color: #14b8a6; width: 100%; border: 1px solid #14b8a6; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold; margin-bottom: 5px; transition: 0.2s;" onmouseover="this.style.background='rgba(20, 184, 166, 0.3)'" onmouseout="this.style.background='rgba(20, 184, 166, 0.2)'"> Запустить Сканер Среды</button>
 <div class="card" style="--accent: #9b59b6;"><div class="card-header"><div class="card-title" style="color:#e056fd;"> API Шпион (Сниффер)</div><label class="switch"><input type="checkbox" id="apiSpyMode"><span class="slider"></span></label></div></div>
 <div class="card" style="--accent: #eab308;"><div class="card-header"><div class="card-title" style="color:#fcd34d;"> Архитектор</div><label class="switch"><input type="checkbox" id="architectMode"><span class="slider"></span></label></div></div>"""

code = code.replace("""<div class="section-title" style="margin-top: 15px;">Режим Разработчика / Сканер</div>
 <button id="runScannerBtn" class="btn" style="background: rgba(20, 184, 166, 0.2); color: #14b8a6; width: 100%; border: 1px solid #14b8a6; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold; margin-bottom: 15px; transition: 0.2s;" onmouseover="this.style.background='rgba(20, 184, 166, 0.3)'" onmouseout="this.style.background='rgba(20, 184, 166, 0.2)'"> Запустить Сканер Среды</button>
 <div class="card" style="--accent: #eab308;"><div class="card-header"><div class="card-title" style="color:#fcd34d;"> Архитектор</div><label class="switch"><input type="checkbox" id="architectMode"><span class="slider"></span></label></div></div>""", replacement)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Patched popup.html")
