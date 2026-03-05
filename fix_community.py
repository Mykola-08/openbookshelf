import os
fpath = 'app/community/page.tsx'
if os.path.exists(fpath):
    with open(fpath, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace("You're  books away from your goal. Keep it up!", "`You're ${MY_GOAL - readCount} books away from your goal. Keep it up!`")
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(c)
