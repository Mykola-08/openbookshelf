import os, glob

history_dir = r"C:\Users\Mykola\AppData\Roaming\Code\User\History"
targets = ["AIGenerateButtons", "AliasReviewBoard", "AppThemeRuntime", "DemoModeBanner", "OnboardingDialog"]

best = {t: {"file": "", "size": 0, "mtime": 0} for t in targets}

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
                        for t in targets:
                            if f"export default function {t}" in text or f"export function {t}" in text or f"const {t}" in text:
                                if mtime > best[t]["mtime"]:
                                    best[t] = {"file": file_path, "size": size, "mtime": mtime}
            except Exception as e:
                pass

for t, info in best.items():
    if info["file"]:
        print(f"Recovering {t} from {info['file']}")
        with open(info["file"], "r", encoding="utf-8") as source:
            content = source.read()
            with open(f"components/{t}.tsx", "w", encoding="utf-8") as dest:
                dest.write(content)