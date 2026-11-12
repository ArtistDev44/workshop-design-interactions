# Prompt 147 — Jeu : aucun texte « Lieu à préciser » à l'écran

Demande d'origine (12/11/2026) :

> Enlève tous les textes « Lieu à préciser ». Ils ne doivent jamais apparaitre à l'écran.

## À faire

- `site/public/carte-alertes.js` (~ligne 238) : supprimer la case « Lieu à préciser » dessinée dans la partie
  libre de la carte. Les signalements sans lieu connu restent des marqueurs regroupés (zone dédiée en haut de la
  carte ou liste), **sans aucun libellé « Lieu à préciser »**.
- `site/public/carte-alertes.js` (~ligne 331) et `site/public/sketch.js` (~ligne 481) : supprimer les décalages
  prévus pour réserver la place de cette case (les `84 px` conditionnels) ; recalculer la position des boutons
  de zoom et de l'indicateur de sauvegarde en conséquence.
- `site/public/i18n.js` : supprimer la clé `carte.lieuAPreciser` (FR et EN) et reformuler `tuto.2.texte`
  (« Sans lieu connu, il reste « Lieu à préciser » » → ex. « Sans lieu connu, le signalement est regroupé hors
  de la carte »), FR et EN.
- `site/public/immersion.js` (~ligne 545, commentaire « l'un “à préciser” en pointillés ») : si un repère de la
  fenêtre/loire affiche ce texte, le supprimer aussi.
- Aucun endroit de l'interface (carte, infobulles, tutoriel, aide, notifications, FR comme EN) ne doit plus
  contenir « Lieu à préciser ».

## Vérifications

- `grep -rni "préciser" site/public --include="*.js" --include="*.html"` : plus aucune occurrence visible à
  l'écran (les commentaires d'historique peuvent être laissés, mais pas le code affiché).
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN) ; capture de la
  carte avec des signalements sans lieu connu : aucun texte « Lieu à préciser ».
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
