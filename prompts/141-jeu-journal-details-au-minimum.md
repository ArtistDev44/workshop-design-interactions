# Prompt 141 — Jeu : appli Journal, « Détails » réduit aux signalements, bons choix et objectif du jour

Demande d'origine (12/11/2026) :

> Masque les détails (supprime le contenu qui y apparait sauf les signalements N/N, avec les bons choix et
> l'objectif du jour).

## À faire

- `site/public/journal.js`, `vueJour` : quand `JOURNAL.details` est ouvert, la rangée de tuiles ne garde que
  trois tuiles :
  - **Signalements** `traités/reçus` (+ non traités) ;
  - **Bonnes décisions** `n/total` avec sa petite barre de proportion ;
  - **Objectif du jour** : libellé + badge ✓ / ✗ / • en cours.
  Supprimer de cette rangée les tuiles « Jauges du jour » (sparklines), « Équipes », « Thème du jour » et
  « Patron » (avertissements), ainsi que `sparkline()` si elle n'est plus appelée nulle part.
- La frise de la journée reste affichée en dessous, inchangée ; le bouton « Détails » (touche V) et la ligne de
  résumé repliée restent en place.
- `site/public/journal-donnees.js` : `tuiles()` peut cesser de calculer ce qui n'est plus affiché (points des
  courbes, équipes, thème, avertissements, xp) — ne garder que ce que la vue jour utilise encore (frise,
  enquête, ligne de résumé), sans casser les compteurs des filtres.
- `site/public/i18n.js` : retirer en FR et EN les clés des tuiles supprimées si elles ne servent plus ailleurs.

## Vérifications

- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- Capture de la vue « Détails » ouverte : exactement trois tuiles (signalements N/N, bons choix N/N, objectif).
- La frise et l'enquête (4 volets) fonctionnent toujours ; le résumé copié contient toujours signalements,
  bons choix et objectif.
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
