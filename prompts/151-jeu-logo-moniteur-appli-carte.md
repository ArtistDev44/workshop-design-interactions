# 151 — Jeu : l'appli « carte » garde le logo d'origine (moniteur)

## Demande
« Remets le logo d'origine pour le logo de l'application carte. »

## Fait
- `site/public/ds.js` : `LOGO_MONITEUR` reprend les formes du moniteur d'origine (prompt 75) ; `dessinerLogoPXE`
  accepte une liste de formes en 4e argument (`LOGO_PXE`, la bulle-pin, par défaut).
- `site/public/menu-app.js` : l'entrée « carte » du menu de l'appli de jeu dessine `LOGO_MONITEUR`.
- Le reste du prompt 150 est inchangé : bulle-pin sur le bouton de la barre des tâches, l'écran de chargement,
  le favicon et les icônes de la webapp.

## Vérification
`npm run build` puis `npm test` verts (un contrôle ajouté : l'appli carte dessine `LOGO_MONITEUR`).
