import os, json, glob, urllib.parse

history_dir = r"C:\Users\Mykola\AppData\Roaming\Code\User\History"
target_dir = r"C:\Users\Mykola\Projects\openbookshelf"

# Get all 0-byte files
os.chdir(target_dir)
zero_files = [f for f in glob.glob("**/*.tsx", recursive=True) if os.path.getsize(f) == 0]

latest_versions = {}

for root, _, files in os.walk(history_dir):
    if "entries.json" in files:
        with open(os.path.join(root, "entries.json"), "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                resource = data.get("resource", "")
                if resource.startswith("file:///"):
                    # Extract local path from file URI
                    local_path = resource.replace("file:///", "").replace("/", "\\").replace("%3A", ":")
                    # unquote %5B -> [ etc
                    local_path = urllib.parse.unquote(local_path)
                    
                    for zf in zero_files:
                        abs_zf = os.path.join(target_dir, zf)
                        if abs_zf.lower() == local_path.lower():
                            entries = data.get("entries", [])
                            # Find the latest entry that has non-zero size
                            entries.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
                            
                            for entry in entries:
                                file_id = entry.get("id")
                                history_file = os.path.join(root, file_id)
                                if os.path.exists(history_file) and os.path.getsize(history_file) > 0:
                                    # this is a non-empty version!
                                    if zf not in latest_versions or entry.get("timestamp", 0) > latest_versions[zf]["timestamp"]:
                                        latest_versions[zf] = {
                                            "timestamp": entry.get("timestamp", 0),
                                            "path": history_file
                                        }
                                    break
            except Exception as e:
                pass

print(f"Found {len(latest_versions)} files to recover out of {len(zero_files)} zero files.")
for zf, info in latest_versions.items():
    print(f"Recovering {zf}...")
    with open(info["path"], "r", encoding="utf-8") as rf:
        content = rf.read()
    with open(zf, "w", encoding="utf-8") as wf:
        wf.write(content)
                  