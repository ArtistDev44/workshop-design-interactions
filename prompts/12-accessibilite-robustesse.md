# Prompt 12 — Contrôles d'accessibilité et checklist de robustesse

## Objectif
Appliquer au site les exigences d'accessibilité et de robustesse du livret
(sections 13 et 14) avant toute mise en ligne — y compris la page `/donnees/`
(prompt 11) et le lien vers le jeu (prompt 14) s'il existe déjà.

## Instructions
1. **Accessibilité** : vérifier et corriger — contraste ≥ 4,5:1 ; aucun flash rapide
   ni effet stroboscopique ; `prefers-reduced-motion` respecté ; navigation clavier
   complète (liens, filtres, boutons « Mettre à jour ») avec focus visible ; `alt`
   descriptifs sur toutes les images ; `lang="fr"` ; titres de page uniques ;
   tableaux avec `<th scope>` ; badges de données en `aria-live="polite"`.
2. **Robustesse** (checklist du livret) :
   - le site se relance après un refresh ;
   - toutes les pages affichent leur contenu avec JavaScript désactivé (rendu statique),
     sauf les valeurs live de `/donnees/` qui affichent alors un message explicite ;
   - **API coupée / hors ligne** : `/donnees/` affiche les instantanés locaux
     (`public/data/fallback/`) avec le badge « Données locales du JJ/MM/AAAA » —
     c'est le fallback exigé par le livret ;
   - les API ne sont **jamais** appelées au build ni dans une boucle de rendu ;
   - assets via `import.meta.env.BASE_URL`, aucune image cassée ;
   - aucune clé privée ni secret dans le code ;
   - test en 1920×1080 et en mobile ; console sans erreur continue ;
   - `dist/` régénérable proprement (`rm -rf dist && npm run build`).
3. Corriger tout manquement trouvé. Noter les corrections dans une section
   « Robustesse » de `site/README.md` (créer le fichier s'il n'existe pas ; il sera
   complété au prompt 13).

## Vérifications
- `npm run build` puis **`npm run preview`** (et non l'ouverture de `dist/index.html`
  depuis le Finder : avec la `base` du prompt 02, les liens et styles ne se chargent
  pas en `file://`). Ouvrir l'URL affichée par `preview`.
- Test hors ligne : couper le Wi-Fi, recharger `/donnees/` → instantanés locaux affichés.
- Audit Lighthouse (onglet du navigateur) ou inspection manuelle : aucune erreur
  d'accessibilité bloquante.
