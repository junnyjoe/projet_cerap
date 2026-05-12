import os

def fix_mojibake(content):
    # Common UTF-8 characters misread as ISO-8859-1
    replacements = {
        'Ã©': 'é',
        'Ã‰': 'É',
        'Ã ': 'à',
        'Ã€': 'À',
        'Ã¨': 'è',
        'Ãˆ': 'È',
        'Ã«': 'ë',
        'Ã®': 'î',
        'Ã¯': 'ï',
        'Ã´': 'ô',
        'Ã¹': 'ù',
        'Ã»': 'û',
        'Â©': '©',
        'â†’': '→',
        'â€”': '—',
        'Â·': '·',
        'â€¦': '…',
        'Ã§': 'ç',
        'Ã‡': 'Ç',
        'Ã¢': 'â',
        'Ã‚': 'Â',
        'Ãª': 'ê',
        'ÃŠ': 'Ê',
        'Ã®': 'î',
        'ÃŽ': 'Î',
        'Ã´': 'ô',
        'Ã”': 'Ô',
        'Ã»': 'û',
        'Ã›': 'Û',
        'Ã«': 'ë',
        'Ã‹': 'Ë',
        'Ã¯': 'ï',
        'Ã ': 'Ï',
        'Â ': ' ', # Non-breaking space
        'â€œ': '“',
        'â€': '”',
        'â€™': "’",
        'Â«': '«',
        'Â»': '»',
        'â€“': '–',
        'â€¢': '•',
    }
    
    for bad, good in replacements.items():
        content = content.replace(bad, good)
    return content

files_to_fix = [
    'index.html',
    'librairie.html',
    'ligne-editoriale.html',
    'conditions-publication.html',
    'contact.html',
    'revue-debats.html',
    'login.html',
    'success.html',
    'admin.html'
]

base_path = r'c:\Users\HP\Desktop\CERAP_UI'

for filename in files_to_fix:
    path = os.path.join(base_path, filename)
    if os.path.exists(path):
        print(f"Fixing {filename}...")
        try:
            # Read as binary to avoid encoding issues during read
            with open(path, 'rb') as f:
                content = f.read().decode('utf-8', errors='ignore')
            
            fixed_content = fix_mojibake(content)
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
        except Exception as e:
            print(f"Error fixing {filename}: {e}")

print("Done!")
