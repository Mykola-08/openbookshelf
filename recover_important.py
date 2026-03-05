import os, glob

history_dir = r"C:\Users\Mykola\AppData\Roaming\Code\User\History"
target_dir = r"C:\Users\Mykola\Projects\openbookshelf"

# We want the latest from history for these files
targets = [
    "app/layout.tsx",
    "app/page.tsx",
    "app/globals.css",
    "app/connections/page.tsx",
    "app/connections/add/page.tsx",
    "app/connections/[id]/browse/page.tsx",
    "components/BookCard.tsx",
    "components/MatchingInbox.tsx",
    "components/ModulesMarketplace.tsx",
    "components/Reader.tsx",
    "components/SourceBadge.tsx",
    "components/StatusPill.tsx",
    "components/connections/RemoteBookItem.tsx",
    "components/AppThemeRuntime.tsx",
    "components/AIGenerateButtons.tsx",
    "components/AliasReviewBoard.tsx", 
    "components/DemoModeBanner.tsx",
    "components/OnboardingDialog.tsx"
]

best = {t: {"file": "", "size": 0, "mtime": 0} for t in targets}

for root, dirs, files in os.walk(history_dir):
    for fn in files:
        if fn != "entries.json":
            file_path = os.path.join(root, fn)
            try:
                size = os.path.getsize(file_path)
                mtime = os.path.getmtime(file_path)
                if size > 0 and size < 200000:
                    with open(file_path, "r", encoding="utf-8") as f:
                        text = f.read()
                        
                        # Use simple content heuristics to identify files
                        if "from \"@/components/Navbar\"" in text and "export default function RootLayout" in text:
                            if mtime > best["app/layout.tsx"]["mtime"]:
                                best["app/layout.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
                        elif "export default async function Home" in text and ("Recent Local Books" in text or "Connect" in text):
                            if mtime > best["app/page.tsx"]["mtime"]:
                                best["app/page.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
                        elif "export default async function AddConnectionPage" in text:
                            if mtime > best["app/connections/add/page.tsx"]["mtime"]:
                                best["app/connections/add/page.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
                        elif "export default async function ConnectionsPage" in text:
                            if mtime > best["app/connections/page.tsx"]["mtime"]:
                                best["app/connections/page.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
                        elif "export function RemoteBookItem" in text:
                            if mtime > best["components/connections/RemoteBookItem.tsx"]["mtime"]:
                                best["components/connections/RemoteBookItem.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
                        elif "export function AppThemeRuntime" in text or ("document.documentElement.classList" in text and "useTheme" in text):
                            if mtime > best["components/AppThemeRuntime.tsx"]["mtime"]:
                                best["components/AppThemeRuntime.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
                        elif "export function DemoModeBanner" in text:
                            if mtime > best["components/DemoModeBanner.tsx"]["mtime"]:
                                best["components/DemoModeBanner.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
                        elif "export function AliasReviewBoard" in text:
                            if mtime > best["components/AliasReviewBoard.tsx"]["mtime"]:
                                best["components/AliasReviewBoard.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
                        elif "export function BookCard" in text:
                            if mtime > best["components/BookCard.tsx"]["mtime"]:
                                best["components/BookCard.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
                        elif "export function MatchingInbox" in text:
                            if mtime > best["components/MatchingInbox.tsx"]["mtime"]:
                                best["components/MatchingInbox.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
                        elif "export function ModulesMarketplace" in text:
                            if mtime > best["components/ModulesMarketplace.tsx"]["mtime"]:
                                best["components/ModulesMarketplace.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
                        elif "export function Reader(" in text:
                            if mtime > best["components/Reader.tsx"]["mtime"]:
                                best["components/Reader.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
                        elif "export function SourceBadge" in text:
                            if mtime > best["components/SourceBadge.tsx"]["mtime"]:
                                best["components/SourceBadge.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
                        elif "export function StatusPill" in text:
                            if mtime > best["components/StatusPill.tsx"]["mtime"]:
                                best["components/StatusPill.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
                        elif "export function OnboardingDialog" in text:
                            if mtime > best["components/OnboardingDialog.tsx"]["mtime"]:
                                best["components/OnboardingDialog.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
                        elif "export function GenerateDescriptionButton" in text:
                            if mtime > best["components/AIGenerateButtons.tsx"]["mtime"]:
                                best["components/AIGenerateButtons.tsx"] = {"file": file_path, "size": size, "mtime": mtime}
            except Exception as e:
                pass

for t, info in best.items():
    if info["file"]:
        print(f"Recovering {t} from {info['file']}")
        with open(info["file"], "r", encoding="utf-8") as source:
            content = source.read()
            # ensuring paths
            dest_path = os.path.join(target_dir, t.replace("/", "\\"))
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            with open(dest_path, "w", encoding="utf-8") as dest:
                dest.write(content)
print("Done!")
