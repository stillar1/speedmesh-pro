import json

file_path = "/Users/daniilstalmakov/Desktop/speedmesh /speedmesh/manifest.json"
with open(file_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

res = manifest["web_accessible_resources"][0]["resources"]
if "auto_ktp.js" not in res:
    res.append("auto_ktp.js")

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

print("Patched manifest.json")
