import re

file_path = "/Users/daniilstalmakov/Desktop/speedmesh /speedmesh/popup.html"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# Remove google fonts link
code = re.sub(r'<link href="https://fonts.googleapis.com[^>]+>\s*', '', code)
# Change font-family to system-ui
code = code.replace("font-family: 'Inter', sans-serif;", "font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Patched popup.html for speed")
