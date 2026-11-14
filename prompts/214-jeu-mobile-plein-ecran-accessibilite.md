# Prompt 214 — Jeu : mobile en plein écran par défaut, bouton plein écran retiré du menu, accessibilité mobile vérifiée

Origine : demande du 14/11/2026 — « en mode mobile, vérifie l'accessibilité, le jeu doit de base se mettre en plein
écran. Enlève le bouton dédié "fullscreen" dans le menu ». Statut : **exécuté le 14/11/2026** — compte rendu dans
`jeu/214-mobile-plein-ecran-accessibilite.md`.

## Étapes

1. **Bouton plein écran retiré du menu principal** (pile en haut à droite, prompts 193 / 199), sur ordinateur comme
   sur mobile. Le plein écran reste à la touche F et dans Paramètres → Écran. Textes `mp.pleinEcran*` retirés (plus
   utilisés), région portrait de la pile recalculée (deux rangées : FR / EN, télécharger).
2. **Plein écran automatique sur mobile** (`mobile.js`) : le navigateur exige un geste qui active la page ; la demande
   part du premier toucher (`touchend`). Une seule réussite par chargement (si le joueur sort du plein écran, on ne
   l'y remet pas) ; un refus est retenté au toucher suivant ; rien sans l'API (Safari sur iPhone) ni sur ordinateur.
   Une seule logique d'entrée (`entrerPleinEcran`, `sketch.js`).
3. **Accessibilité mobile vérifiée** — audit des textes en 412 × 915 et 915 × 412, et nouvelle mesure de la taille
   RÉELLE des cibles tactiles en px CSS (`audit-textes.js`, `petitesCiblesCSS`) : échelle du canevas en paysage,
   échelle de la région recomposée en portrait. Corriger ce qui est à portée :
   - défauts de texte présents sur `main` (liste du tutoriel de l'aide hors de la fenêtre en portrait) ;
   - cibles du portrait sous 44 px CSS dans les Paramètres et sur le bureau.
   Le reste est décrit dans le rapport, avec des chiffres.

## Vérification

`npm run build`, `npm test` ; audit des textes à 0 aux 4 tailles ; plein écran vérifié dans Chromium (toucher réel en
émulation mobile) ; mesure des cibles avant / après.
