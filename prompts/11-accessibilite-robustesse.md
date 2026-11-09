# Prompt 11 — Contrôles d'accessibilité et checklist de robustesse

## Objectif
Appliquer au site les exigences d'accessibilité et de robustesse du livret
(sections 13 et 14) avant toute mise en ligne.

## Instructions
1. **Accessibilité** : vérifier et corriger — contraste ≥ 4,5:1 ; aucun flash rapide
   ni effet stroboscopique ; navigation clavier complète (liens, filtres) ; `alt`
   descriptifs sur toutes les images ; `lang="fr"` ; titres de page uniques ; version
   fonctionnelle sans audio (le site n'utilise pas de son).
2. **Robustesse** (checklist du livret) : le site se relance après un refresh ; affiche
   du contenu avec JavaScript désactivé (rendu statique) ; assets en chemins relatifs ;
   aucune clé privée dans le code ; aucune dépendance à une API distante (fallback
   implicite = données locales) ; test en 1920×1080 ; console sans erreur continue ;
   `dist/` régénérable proprement (`rm -rf dist && npm run build`).
3. Corriger tout manquement trouvé et lister les corrections dans le README.

## Vérifications
- `npm run build` puis ouverture de `dist/index.html` en local (file:// ou serveur
  statique local) : le site s'affiche sans réseau.
- Audit rapide (Lighthouse ou inspection manuelle) : pas d'erreur d'accessibilité
  bloquante.
