# Prompt 75 — le bouton démarrer de la barre des tâches reprend le logo du chargement

Le carré rouge « REGUL » en bas à gauche de la barre des tâches est remplacé par le **même pictogramme
que l'écran de chargement** (`index.html`, `#chargement .logo`, viewBox `0 0 24 20` : moniteur blanc à
écran rouge, ligne de bus blanche, deux fenêtres, pied) :

- `dessinerLogoPXE(x, y, taille)` (`os.js`) dessine en pixel art les **mêmes formes** que le SVG de
  chargement — une seule source de vérité ; si le logo de chargement évolue, le bouton suit.
- Le texte « REGUL » est déplacé à côté du logo ; le bouton reste large (140 px), cliquable (ouvre le
  menu des applis, comme avant), avec infobulle FR + EN (`os.boutonDemarrer`).
- Le logo du démarrage du PC (`dessinerDemarrage`) n'est pas concerné.
