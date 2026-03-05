import os, glob

history_dir = r"C:\Users\Mykola\AppData\Roaming\Code\User\History"
target_dir = r"C:\Users\Mykola\Projects\openbookshelf"

best = {"file": "", "size": 0, "mtime": 0} 

for root, dirs, files in os.walk(history_dir):
    for fn in files:
        if fn != "entries.json":
            file_path = os.path.join(root, fn)
            try:
                size = os.path.getsize(file_path)
                mtime = os.path.getmtime(file_path)
                if size > 0 and size < 100000:
                    with open(file_path, "r", encoding="utf-8") as f:
                        text = f.read()
                        if "export default async function Home" in text and ("Recent Local Books" in text or "Connect" in text) and "import os" not in text and "python" not in text:
                            if mtime > best["mtime"]:
                                best = {"file": file_path, "size": size, "mtime": mtime}
            except: pass

print("Best page from:", best["file"])
if best["file"]:
    with open(best["file"], "r", encoding="utf-8") as rf:
        content = rf.read()
    with open("app/page.tsx", "w", encoding="utf-8") as wf:
        wf.write(content)
