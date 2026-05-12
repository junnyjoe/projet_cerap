import re
import os

def clean_html(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    # Fix broken characters
    replacements = {
        'Ã©': 'é', 'Ã‰': 'É', 'Ã ': 'à', 'Ã¨': 'è', 'Ã®': 'î', 'Ã´': 'ô', 'Ã¹': 'ù',
        'Ã«': 'ë', 'Ã¯': 'ï', 'Ã»': 'û', 'Ã': 'à', 'â€”': '—', 'Â·': '·',
        'ðŸ“ ': '📍', 'ðŸ“ž': '📞', 'âœ‰ï¸ ': '✉️', 'ðŸ• ': '🕒', 'ðŸŽ“': '🎓',
        'ðŸŒ ': '🌍', 'ðŸ“–': '📖', 'ðŸ’¡': '💡', 'ðŸ•Šï¸ ': '🕊️', 'ðŸ ›ï¸ ': '🏛️',
        'âš–ï¸ ': '⚖️', 'ðŸ‘¥': '👥', 'ðŸœ ': '🌟', 'ðŸ“ˆ': '📈', 'ðŸ“Š': '📊'
    }
    for old, new in replacements.items():
        content = content.replace(old, new)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Cleaned {filepath}")

files = [
    r"c:\Users\HP\Desktop\CERAP_UI\ligne-editoriale.html",
    r"c:\Users\HP\Desktop\CERAP_UI\contact.html",
    r"c:\Users\HP\Desktop\CERAP_UI\conditions-publication.html",
    r"c:\Users\HP\Desktop\CERAP_UI\revue-debats.html",
    r"c:\Users\HP\Desktop\CERAP_UI\index.html",
    r"c:\Users\HP\Desktop\CERAP_UI\librairie.html"
]

for f in files:
    if os.path.exists(f):
        clean_html(f)
