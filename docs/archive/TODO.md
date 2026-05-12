# TODO — CERAP Éditions UI (index.html)

## Étape 1 — Setup & conformité
- [x] Vérifier la présence de `LICENSE.txt` (création si absent).
- [ ] Lancer une passe d’audit UI/UX sur `index.html` (motion, accessibilité, cohérence visuelle).

## Étape 2 — Architecture logicielle adaptée au projet
- [x] Introduire une structure JS modulaire (état central `AppState`).
- [x] Déplacer les handlers inline (cart/books) vers `addEventListener`.

- [x] Encapsuler le rendu (cart/books) pour éviter les duplications.


## Étape 3 — Design premium
- [x] Ajouter une couche de texture/grain + atmosphère (sans casser la lisibilité).
- [x] Ajouter des micro-interactions (focus visibles, cohérence hover/états, style panier amélioré).
- [x] Ajuster le design selon `prefers-reduced-motion` (et cohérence d’accessibilité).

## Étape 4 — Accessibilité
- [x] Ajouter `aria-expanded`, `aria-controls` et `role` pour menu mobile + panier.
- [x] Gérer le focus (ouvrir/fermer panier, fermeture sur Escape + focus management basique).


## Étape 5 — Vérification
- [x] Tester : filtres livres, panier (ajout/suppression/total), revue subscription, formulaire contact.
- [x] Tester responsive à 900px et 600px.


