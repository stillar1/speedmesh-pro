import re

file_path = "/Users/daniilstalmakov/Desktop/speedmesh /speedmesh/popup.js"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("'speedUp', 'spyMode', 'architectMode', 'randomizerMode'", "'speedUp', 'apiSpyMode', 'architectMode', 'randomizerMode'")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Patched popup.js")
