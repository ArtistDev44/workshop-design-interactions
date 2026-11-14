# Prompt 212 — Jeu : retirer l'heure numérique sous l'horloge murale

Origine : revue `ux-informations-2026-11-14.md` § 3 (l'heure était affichée trois fois au bureau). C'était un des points
« à trancher » du prompt 211. Décision du 14/11/2026 : « retire l'heure numérique sous l'horloge murale ».
Statut : **à exécuter**.

## Étape

Dans `site/public/bureau.js`, ne plus dessiner l'étiquette « hh:mm » (ni « ▶▶ ×n » en temps accéléré) sous
l'horloge murale. L'heure reste lisible :
- sur l'horloge à aiguilles, au bureau ;
- dans le coin supérieur droit, au poste (`dessinerDateCoin`) ;
- sur le téléphone.

Le temps accéléré se voit aux aiguilles qui tournent vite.

## Vérification

`npm run build`, `npm test`. Audit des textes : 0 défaut en 1920 × 1080 et 1366 × 768 ; en 412 × 915, pas plus de
défauts « T » qu'avant. Capture du bureau.
