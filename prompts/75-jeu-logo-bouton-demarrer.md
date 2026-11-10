# Prompt 75 — Jeu « Nantes en régulation », étape 57 : le bouton en bas à gauche de la barre des tâches reprend le logo de l'écran de chargement

Demande d'origine (11/11/2026) :

> Change l'élément rouge en base à gauche du PC (équivalent de l'emplacement Windows) pour le
> remplacer par le même logo que celui du chargement.

Aujourd'hui, la barre des tâches du PC affiche en bas à gauche un **carré rouge plein** avec le texte
« REGUL » (`os.js` : `dessinerBarreTaches()`, `fill(DS.primaire); rect(8, tb + 10, 140, BARRE_OS - 20)`).
L'écran de chargement, lui, montre un **vrai logo** : le pictogramme SVG « moniteur + ligne de bus » de
`index.html` (`#chargement .logo`, viewBox `0 0 24 20`).

## Attendu

1. Le bouton en bas à gauche de la barre des tâches affiche **le même pictogramme que l'écran de
   chargement** (moniteur blanc à écran rouge, ligne blanche, deux fenêtres, pied) — dessiné en pixel
   art dans le canvas (mêmes formes, mis à l'échelle du bouton, `shape-rendering` crisp), à la place
   du carré rouge uni.
2. Le texte « REGUL » est supprimé ou déplacé à côté du logo (le bouton reste large, cliquable, même
   comportement : ouvrir le menu des applis / revenir à l'accueil du PC — ne pas changer sa fonction).
3. Cohérence : si le logo de chargement évolue, le bouton de la barre des tâches suit (même source de
   vérité, ex. une fonction `dessinerLogoPXE(x, y, taille)` partagée, ou les deux dessinés depuis les
   mêmes coordonnées de formes).
4. Le logo du démarrage du PC (`dessinerDemarrage()`, carré rouge à croix blanche) n'est **pas**
   concerné par ce prompt.

## Contraintes

- Cible cliquable ≥ 44 px, focus clavier visible, infobulle existante conservée (FR + EN).
- Contraste et lisibilité conservés sur le fond de la barre des tâches.
- `prefers-reduced-motion` sans objet ici (élément statique).

## Vérifications

- `npm run build`, `npm test` dans `site/` ; visuellement, à 1920×1080 et en mobile portrait : le bouton
  bas gauche reprend le pictogramme du chargement, clic toujours fonctionnel, aucun résidu de l'ancien
  carré rouge ; aucune erreur console.
- Doc : `jeu/71-…` (nouvelle doc), `jeu/README.md`, `prompts/README.md`, `journal.md` à jour.
- Branche `jeu/prompt-75-logo-bouton-demarrer`. À chaque push : entrée en tête de `journal.md`.
  Fusion `main` sur demande.
