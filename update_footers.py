import os
import re

def update_footer(filename):
    path = os.path.join(r'c:\Users\HP\Desktop\CERAP_UI', filename)
    if not os.path.exists(path):
        return
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_footer = """  <footer>
    <div class="footer-inner">
      <div class="footer-grid">
        <div class="footer-col">
          <div class="footer-logo">
            <img src="./assets/images/logo-uja.png" alt="Logo UJA">
            <strong>CERAP Éditions</strong>
          </div>
          <p>Maison d'édition universitaire de l'Université Jésuite d'Afrique. Excellence, Recherche et Action.</p>
        </div>
        <div class="footer-col">
          <h4>Navigation</h4>
          <ul>
            <li><a href="./index.html">Accueil</a></li>
            <li><a href="./librairie.html">Librairie</a></li>
            <li><a href="./ligne-editoriale.html">Ligne Éditoriale</a></li>
            <li><a href="./contact.html">Contact</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <ul>
            <li>Cocody, Mermoz, Abidjan</li>
            <li>editions@cerap-inades.org</li>
            <li>(+225) 27 22 40 47 20</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 CERAP Éditions. Tous droits réservés.</p>
      </div>
    </div>
  </footer>"""
    
    # regex to match <footer ...> ... </footer>
    pattern = re.compile(r'<footer.*?>.*?</footer>', re.DOTALL)
    
    matches = list(pattern.finditer(content))
    if not matches:
        print(f"No footer found in {filename}")
        return

    # Replace the last one
    last_match = matches[-1]
    new_content = content[:last_match.start()] + new_footer + content[last_match.end():]
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'Updated footer in {filename}')

files = ['index.html', 'librairie.html', 'ligne-editoriale.html', 'contact.html', 'revue-debats.html', 'conditions-publication.html']
for f in files:
    update_footer(f)
