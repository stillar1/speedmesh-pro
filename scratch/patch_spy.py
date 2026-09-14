import re

file_path = "/Users/daniilstalmakov/Desktop/speedmesh /speedmesh/spy_content.js"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

injection_code = """
    try {
        const autoKtp = document.createElement('script');
        autoKtp.src = chrome.runtime.getURL('auto_ktp.js');
        autoKtp.onload = function() { this.remove(); };
        (document.head || document.documentElement).appendChild(autoKtp);
    } catch (e) {}
"""

if "auto_ktp.js" not in code:
    code += injection_code
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("Patched spy_content.js")
