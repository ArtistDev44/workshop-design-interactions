# Prompt 219 — Jeu : carte sans les trois boutons de navigation

Origine : demande du 15/11/2026 (« sur la carte, enlève les 3 boutons de navigation de la carte »). Statut : **exécuté le 15/11/2026**.

## À faire

1. Retirer les boutons + / − / Recentrer (`dessinerNavigationCarte`, `carte-alertes.js`) sous les cases des équipes,
   leurs infobulles et leur place dans le panneau ; textes `carte.zoomer`, `carte.dezoomer` gardés s'ils servent ailleurs.
2. Le zoom reste possible sans eux :
   - ordinateur : molette sur la carte, touches + / −, Origine pour recentrer (inchangés) ;
   - mobile (portrait et paysage, recomposés) : **pincement à deux doigts** sur la carte, centré entre les doigts ; le
     défilement de la colonne est suspendu pendant le pincement.
3. L'aide (onglet Raccourcis) et le guide ne doivent plus parler de boutons de zoom ; vérifier les textes.

## Vérification

`npm run build`, `npm test` (test : plus de `dessinerNavigationCarte` appelée, pincement câblé) ; audit des textes à 0
en 1920 × 1080, 1366 × 768, 412 × 915 et 915 × 412 ; pincement essayé dans Chromium (émulation tactile, deux doigts).
