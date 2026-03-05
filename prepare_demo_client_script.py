import os

fpath = 'utils/supabase/demo-client.ts'
with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

# We will inject some lines at the top and replace getGlobalStore
# Also we need to sync persist inside DemoQueryBuilder.execute() operations that mutate.

new_get_store = """
let isNode = typeof window === 'undefined';
let fs = isNode ? require('fs') : null;
let path = isNode ? require('path') : null;

const DB_FILENAME = '.demo-db.json';

const saveStore = (store: DemoStore) => {
  try {
    if (isNode && fs) {
        fs.writeFileSync(path.join(process.cwd(), DB_FILENAME), JSON.stringify(store, null, 2));
    } else if (!isNode) {
        window.localStorage.setItem(DEMO_GLOBAL_KEY, JSON.stringify(store));
    }
  } catch (e) {
    console.error("Failed to save local store", e);
  }
};

const getGlobalStore = (): DemoStore => {
  const runtimeGlobal = globalThis as unknown as Record<string, unknown>;       
  
  if (runtimeGlobal[DEMO_GLOBAL_KEY]) {
    return runtimeGlobal[DEMO_GLOBAL_KEY] as DemoStore;
  }

  let loaded: DemoStore | null = null;
  try {
      if (isNode && fs) {
          const dbPath = path.join(process.cwd(), DB_FILENAME);
          if (fs.existsSync(dbPath)) {
              loaded = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          }
      } else if (!isNode) {
          const items = window.localStorage.getItem(DEMO_GLOBAL_KEY);
          if (items) loaded = JSON.parse(items);
      }
  } catch(e) {
      console.error(e);
  }

  if (loaded && loaded.tables) {
      runtimeGlobal[DEMO_GLOBAL_KEY] = loaded;
      return loaded;
  }

  const seededStore: DemoStore = { // ... keep old tables
"""

content = content.replace("const getGlobalStore = (): DemoStore => {", new_get_store)

# Also intercept end of getGlobalStore to save the store
end_of_get_global = """  runtimeGlobal[DEMO_GLOBAL_KEY] = seededStore;
  saveStore(seededStore);
  return seededStore;
};"""

content = content.replace("  runtimeGlobal[DEMO_GLOBAL_KEY] = seededStore;\n  return seededStore;\n};", end_of_get_global)

# Now inject saveStore(this.store) in mutating methods
mutations = [
    "table.push(...insertedRows);",
    "upsertedRows.push(cloneRow(primaryCandidate));",
    "upsertedRows.push(cloneRow(conflictRow));",
    "table.push(prepared);",
    "updatedRows.push(cloneRow(row));",
    "this.store.tables[this.tableName] = keep;"
]

for mut in mutations:
    content = content.replace(mut, mut + "\n      saveStore(this.store);")

# Update RPCs
rpc_muts = [
    "aliases.push(newAlias);",
    "existingVote.updated_at = nowIso();",
    "aliasVotes.push({",
    "alias.updated_at = nowIso();"
]
for mut in rpc_muts:
    content = content.replace(mut, mut + "\n      saveStore(this.store);")


# Special case for aliasVotes.push({ ... }) since it spans multiple lines. Wait, that's brittle.
# I will use a regex or just replace the whole execute function and rpc manually.

with open('patch_demo.py', 'w', encoding='utf-8') as f:
    f.write("import re\nimport os\n")

"""

# It's better to rewrite the whole file with our enhanced `demo-client.ts`, preserving the exact type definitions.
