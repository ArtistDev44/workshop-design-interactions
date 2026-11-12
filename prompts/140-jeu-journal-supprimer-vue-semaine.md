# Prompt 140 — Jeu : appli Journal, supprimer le bouton « Semaine » et toute la vue Semaine

Demande d'origine (12/11/2026) :

> Enlève le bouton « semaine » et le code qui sert pour les visuels une fois celui-ci cliqué.

## À faire

- `site/public/journal.js` :
  - supprimer le bouton « Semaine » à droite de la barre des journées (~ligne 126) ; la vue « Jour » devient la
    seule vue, le sélecteur Jour / Semaine disparaît ;
  - supprimer `vueSemaine(z)` (~ligne 455) et tout son code : grille des journées, courbe de la semaine,
    décisions clés, carnet de la semaine ;
  - simplifier `choisirVueJournal` et `JOURNAL.vue` (une seule valeur possible) ainsi que toutes les branches
    `JOURNAL.vue === 'semaine'` (~lignes 89, 751…) ;
  - supprimer les raccourcis qui basculaient vers la vue Semaine : touches `S` et `K` (~lignes 741–742) et
    `Échap` en vue Semaine (~ligne 745) — la touche `K` ouvrait le carnet de la semaine (le carnet lui-même est
    supprimé par le prompt 142) ;
  - `JOURNAL.carnet` n'a plus de raison d'être.
- `site/public/journal-donnees.js` : supprimer `semaine()` et ce qui ne sert qu'à elle (`courbes` si elle n'est
  plus utilisée par la vue jour) ; vérifier que `tuiles`, `cartes`, `compteurs`, `filtrer` restent utilisés.
- `site/public/sauvegarde.js` : ne plus enregistrer ni restaurer la vue (jour / semaine) si elle n'existe plus.
- `site/public/i18n.js` : supprimer les clés devenues mortes (`journal.vue.semaine`, `journal.courbeSemaine`,
  `carnet.*` — voir prompt 142), en FR et EN.
- Dépendance : à exécuter avec (ou après) le prompt 142, qui supprime le carnet affiché dans la vue Semaine.

## Vérifications

- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- Partie réelle de 2–3 jours : la barre des journées n'a plus qu'un bouton « Jour », les touches S / K ne font
  plus rien, aucune vue hebdomadaire n'est accessible (souris, clavier, sauvegarde rechargée).
- `grep -rn "semaine" site/public/journal*.js` : plus que des mentions de la semaine de jeu (données), pas de vue.
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
