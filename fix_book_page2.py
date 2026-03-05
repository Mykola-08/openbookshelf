import re

with open('app/book/[id]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace normalizeStatus function entirely
new_func = '''const normalizeStatus = (status: string | null | undefined): "toread" | "reading" | "finished" | "abandoned" => {
  if (!status) return "toread";
  if (status === "plan_to_read") return "toread";
  if (status === "dropped") return "abandoned";
  if (status === "toread" || status === "reading" || status === "finished" || status === "abandoned") {
    return status;
  }
  return "toread";
};'''

shorter_func = '''const normalizeStatus = (status: string | null | undefined): "toread" | "reading" | "finished" | "abandoned" => {
  if (!status) return "toread";
  // Transition map for legacy string constants
  const map: Record<string, "toread" | "reading" | "finished" | "abandoned"> = {
    plan_to_read: "toread",
    dropped: "abandoned",
    toread: "toread",
    reading: "reading",
    finished: "finished",
    abandoned: "abandoned"
  };
  return map[status] || "toread";
};'''

content = content.replace(new_func, shorter_func)

# And in the line: status: normalizeStatus(userBookRaw.status || userBookRaw.reading_state),
# Replace with status: normalizeStatus(userBookRaw.status),
content = content.replace('status: normalizeStatus(userBookRaw.status || userBookRaw.reading_state)', 'status: normalizeStatus(userBookRaw.status)')

with open('app/book/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
