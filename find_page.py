import os

history_dir = r"C:\\Users\\Mykola\\AppData\\Roaming\\Code\\User\\History"
output_file = r"C:\\Users\\Mykola\\Projects\\openbookshelf\\found_page.txt"

with open(output_file, 'w', encoding='utf-8') as out:
    for root, dirs, files in os.walk(history_dir):
        if "entries.json" in files:
            try:
                with open(os.path.join(root, "entries.json"), "r", encoding="utf-8") as f:
                    content = f.read()
                    if "app/page.tsx" in content or "app\\\\page.tsx" in content:
                        out.write(content + "\\n\\n")
                        # also print the latest file size
                        import json
                        data = json.loads(content)
                        for entry in data.get("entries", []):
                            entry_file = os.path.join(root, entry["id"])
                            if os.path.exists(entry_file):
                                with open(entry_file, "r", encoding="utf-8") as ef:
                                    t = ef.read()
                                    if "import os" not in t and "export default " in t:
                                        out.write("FOUND GOOD FILE: " + entry_file + "\\n")
                                        out.write(t)
                                        out.write("\\n\\n=======================\\n\\n")
            except Exception as e:
                pass
