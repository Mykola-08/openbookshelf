import os, json

history_dir = r"C:\Users\Mykola\AppData\Roaming\Code\User\History"
target_file_pattern = r"app\page.tsx"

best_file = None
best_mtime = 0

for root, dirs, files in os.walk(history_dir):
    if "entries.json" in files:
        entries_path = os.path.join(root, "entries.json")
        try:
            with open(entries_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                resource = data.get("resource", "")
                if "openbookshelf" in resource and ("app/page.tsx" in resource or r"app\page.tsx" in resource):
                    # Found the history folder for app/page.tsx!
                    print(f"Found history folder matching {resource} at {root}")
                    for entry in data.get("entries", []):
                        if "id" in entry:
                            entry_file = os.path.join(root, entry["id"])
                            if os.path.exists(entry_file):
                                mtime = os.path.getmtime(entry_file)
                                size = os.path.getsize(entry_file)
                                if mtime > best_mtime and size > 0 and size < 100000:
                                    # Ensure it's not a python script
                                    with open(entry_file, "r", encoding="utf-8") as rf:
                                        t = rf.read()
                                        if "import os" not in t and "import sys" not in t:
                                            best_file = entry_file
                                            best_mtime = mtime
        except Exception as e:
            pass

print("Best file for app/page.tsx:", best_file)
if best_file:
    with open(best_file, "r", encoding="utf-8") as rf:
        content = rf.read()
    with open(r"C:\Users\Mykola\Projects\openbookshelf\app\page.tsx", "w", encoding="utf-8") as wf:
        wf.write(content)
    print("app/page.tsx restored.")
else:
    print("Could not find a valid backup for app/page.tsx.")
