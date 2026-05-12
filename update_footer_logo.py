import os
import glob

def update_footer_logo():
    for filepath in glob.glob(r"c:\Users\HP\Desktop\CERAP_UI\*.html"):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find the footer logo pattern
        old_pattern = '<div class="footer-logo">\n            <img src="./assets/images/logo-uja.png" alt="Logo UJA">'
        new_pattern = '<div class="footer-logo">\n            <div class="footer-logo-mark"><img src="./assets/images/logo-uja.png" alt="Logo UJA"></div>'
        
        if old_pattern in content:
            new_content = content.replace(old_pattern, new_pattern)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {os.path.basename(filepath)}")
        else:
            # Try a slightly different indentation or format
            old_pattern_v2 = '<div class="footer-logo">\n          <img src="./assets/images/logo-uja.png" alt="Logo UJA">'
            if old_pattern_v2 in content:
                new_content = content.replace(old_pattern_v2, new_pattern)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {os.path.basename(filepath)} (v2)")

update_footer_logo()
