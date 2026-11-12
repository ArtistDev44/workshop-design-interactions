# Prompt 144 — Jeu : bandeau, fusionner priorités et objectif, date en haut à droite de l'écran

Demande d'origine (12/11/2026) :

> Mets ensemble priorités et objectifs. La date doit être en haut à droite de l'écran (coin supérieur).
> Fusionne priorités et objectifs.

## À faire

- `site/public/panneau.js`, `dessinerBandeau`, seconde ligne (`morceaux`) : fusionner « Priorités : … »
  (`bandeau.priorites`) et « Objectif : … » (`bandeau.objectifCourt`) en **un seul élément**, par exemple
  « Priorités : … · Objectif : … ✓ » (sans la valeur chiffrée `({v})`, retirée par le prompt 143). Le thème du
  jour, quand il existe, peut rejoindre le même morceau ou rester à part.
- **Date en haut à droite de l'écran** : la date du jour en cours affichée dans le bandeau (seconde ligne, avec
  l'heure du jeu) est déplacée dans le **coin supérieur droit de l'écran de jeu**, hors du bandeau ; un seul
  endroit de l'écran affiche la date. L'heure du jeu (hh:mm + état ▶/▶▶/pause) monte avec la date ou reste dans
  le bandeau — au choix, mais un seul groupe date + heure, en haut à droite, lisible en 1920×1080 et 1366×768.
- `site/public/i18n.js` : clés ajustées (ex. `bandeau.prioritesObjectif` ou réutilisation de `bandeau.priorites` +
  `bandeau.objectifCourt` sans `{v}` ; nouvelle clé pour la date du jour en coin, ex. `bandeau.dateJour` avec
  `jourDate(...)`), FR et EN.
- À exécuter avec le prompt 145 (même zone du bandeau) pour ne refaire la mise en page qu'une fois.

## Vérifications

- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN, la date en coin
  ne doit couper aucun élément : vérifier survol des notifications en haut).
- Capture 1920×1080 de l'écran de jeu : une seule ligne « priorités · objectif » dans le bandeau ; date (et heure)
  lisible en haut à droite de l'écran, nulle part ailleurs.
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
