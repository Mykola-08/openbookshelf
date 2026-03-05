import os
import glob

def fix():
    files = glob.glob('app/**/*.tsx', recursive=True)
    files.append('app/page.tsx')
    
    for f in set(files):
        if not os.path.exists(f): continue
        with open(f, 'r', encoding='utf-8') as file:
            c = file.read()
        
        c = c.replace('"unread"', '"toread"')
        c = c.replace("'unread'", "'toread'")
        
        if '<option value="toread">Unread</option>' in c:
            c = c.replace('<option value="toread">Unread</option>', '<option value="toread">To Read</option>')
            
        with open(f, 'w', encoding='utf-8') as file:
            file.write(c)

fix()
