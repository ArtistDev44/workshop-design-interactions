# Prompt 145 — Jeu : bandeau, barres de jauges compactes à la même hauteur que la ligne du dessous

Demande d'origine (12/11/2026) :

> Les barres de variables doivent prendre assez peu d'espace. Elles doivent être à la même hauteur que le
> contenu actuellement ci-dessous (priorités, objectif & date).

## À faire

- `site/public/panneau.js`, `dessinerBandeau` : les trois barres de jauges (actuellement ligne 1, piste de
  16 px de haut sous un libellé à `z.y + 8`) doivent être **plus fines et plus basses** : hauteur de piste
  réduite (ex. 16 → 10–12 px) et les barres ramenées **à la même hauteur que la seconde ligne** du bandeau
  (priorités, objectif, date/heure) — l'objectif est une seule ligne horizontale où les trois barres côtoient
  le texte, ou deux lignes très rapprochées dont les barres sont alignées sur la ligne de texte.
- `BANDEAU.h` (84 px) réduit d'autant ; vérifier que ce qui est dessiné sous le bandeau (`PANNEAU`, la carte
  `dessinerCarteAlertes`, la file des signalements) démarre bien sous le nouveau bandeau sans chevauchement
  ni trou noir (1920×1080 et 1366×768, avec et sans dossier ouvert).
- La barre blanche de seuil d'objectif (prompt 143) et les seuils 20/40 suivent la nouvelle hauteur.
- À exécuter avec le prompt 144 (fusion priorités/objectif, date en haut à droite) : même zone, une seule passe
  de mise en page.

## Vérifications

- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- Captures avant/après 1920×1080 : le bandeau gagne au moins la moitié de sa hauteur ; barres de jauges à la
  hauteur de la ligne priorités · objectif · date.
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
