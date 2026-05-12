import os
import glob

def add_favicon():
    favicon_tag = '  <link rel="icon" type="image/png" href="./assets/images/logo-uja.png" />\n'
    for filepath in glob.glob(r"c:\Users\HP\Desktop\CERAP_UI\*.html"):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        if '<link rel="icon"' in content:
            # Already has a favicon, update it if necessary
            print(f"Skipped {os.path.basename(filepath)} - already has favicon tag.")
            continue

        # Insert before the first stylesheet link or at the end of head
        if '<link rel="stylesheet"' in content:
            new_content = content.replace('<link rel="stylesheet"', favicon_tag + '  <link rel="stylesheet"')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Added favicon to {os.path.basename(filepath)}")
        elif '</head>' in content:
            new_content = content.replace('</head>', favicon_tag + '</head>')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Added favicon to {os.path.basename(filepath)} (before head end)")

add_favicon()
