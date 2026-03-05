import os

fpath = 'utils/supabase/demo-client.ts'
with open(fpath, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    "const DEMO_USER_ID = \"00000000-0000-0000-0000-000000000001\";\nconst DEMO_GLOBAL_KEY = \"__openbookshelf_demo_store__\";",
    "const DEMO_USER_ID = \"00000000-0000-0000-0000-000000000001\";\nconst DEMO_GLOBAL_KEY = \"__openbookshelf_demo_store__\";\n\nlet isNode = typeof window === 'undefined';\nlet fs: any = isNode ? require('fs') : null;\nlet path: any = isNode ? require('path') : null;\n\nconst DB_FILENAME = '.demo-db.json';\n\nconst saveStore = (store: DemoStore) => {\n  try {\n    if (isNode && fs) {\n        fs.writeFileSync(path.join(process.cwd(), DB_FILENAME), JSON.stringify(store, null, 2));\n    } else if (!isNode) {\n        window.localStorage.setItem(DEMO_GLOBAL_KEY, JSON.stringify(store));\n    }\n  } catch (e) {\n    console.error('Failed to save local store', e);\n  }\n};"
)

code = code.replace(
    "const getGlobalStore = (): DemoStore => {\n  const runtimeGlobal = globalThis as unknown as Record<string, unknown>;",
    "const getGlobalStore = (): DemoStore => {\n  const runtimeGlobal = globalThis as unknown as Record<string, unknown>;\n\n  let loaded: DemoStore | null = null;\n  try {\n      if (isNode && fs) {\n          const dbPath = path.join(process.cwd(), DB_FILENAME);\n          if (fs.existsSync(dbPath)) {\n              loaded = JSON.parse(fs.readFileSync(dbPath, 'utf8'));\n          }\n      } else if (!isNode) {\n          const items = window.localStorage.getItem(DEMO_GLOBAL_KEY);\n          if (items) loaded = JSON.parse(items);\n      }\n  } catch(e) {\n      console.error(e);\n  }\n\n  if (loaded && loaded.tables) {\n      runtimeGlobal[DEMO_GLOBAL_KEY] = loaded;\n      return loaded;\n  }\n"
)

code = code.replace(
    "  runtimeGlobal[DEMO_GLOBAL_KEY] = seededStore;\n  return seededStore;\n};",
    "  runtimeGlobal[DEMO_GLOBAL_KEY] = seededStore;\n  saveStore(seededStore);\n  return seededStore;\n};"
)

code = code.replace("table.push(...insertedRows);", "table.push(...insertedRows);\n      saveStore(this.store);")
code = code.replace("upsertedRows.push(cloneRow(primaryCandidate));", "upsertedRows.push(cloneRow(primaryCandidate));\n          saveStore(this.store);")
code = code.replace("upsertedRows.push(cloneRow(conflictRow));", "upsertedRows.push(cloneRow(conflictRow));\n          saveStore(this.store);")
code = code.replace("table.push(prepared);\n          upsertedRows.push(cloneRow(prepared));", "table.push(prepared);\n          upsertedRows.push(cloneRow(prepared));\n          saveStore(this.store);")
code = code.replace("updatedRows.push(cloneRow(row));", "updatedRows.push(cloneRow(row));\n      saveStore(this.store);")
code = code.replace("this.store.tables[this.tableName] = keep;", "this.store.tables[this.tableName] = keep;\n      saveStore(this.store);")
code = code.replace("aliases.push(newAlias);", "aliases.push(newAlias);\n      saveStore(this.store);")
code = code.replace("existingVote.updated_at = nowIso();", "existingVote.updated_at = nowIso();\n      saveStore(this.store);")
code = code.replace("alias.updated_at = nowIso();", "alias.updated_at = nowIso();\n      saveStore(this.store);")

# And any aliaseVote pushes:
code = code.replace("updated_at: nowIso(),\n        });\n      }", "updated_at: nowIso(),\n        });\n      }\n      saveStore(this.store);")

with open('utils/supabase/demo-client.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print("Patched demo-client")
