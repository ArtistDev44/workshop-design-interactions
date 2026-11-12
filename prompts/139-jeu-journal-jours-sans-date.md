# Prompt 139 — Jeu : appli Journal, supprimer la date JJ/MM sous les pastilles J1, J2

Demande d'origine (12/11/2026) :

> Dans l'application journal : il n'est pas nécessaire de mettre JJ/MM en dessous de J1, J2, etc. C'est redondant.

## À faire

- `site/public/journal.js` : dans la barre des journées (boucle des pastilles, ~ligne 114), supprimer
  l'affichage `dsTexte(dateCourte(j.date), x + 10, z.y + 22, 14, …)` sous le libellé `J1`, `J2`… La pastille ne
  garde que son nom de jour et sa pastille d'état (✓ ✗ •). Si la hauteur de la pastille (52 px) laisse alors un
  vide, la réduire d'autant (les zones clavier et les boutons qui suivent sont ancrés sur `z.y`).
- Ne pas supprimer la fonction `dateCourte` tant qu'elle est utilisée ailleurs (vue Semaine, carnet de la
  semaine — supprimés par les prompts 140 et 142) ; la retirer avec eux si plus rien ne l'appelle.
- Aucune clé i18n supprimée ici.

## Vérifications

- `npm run build` puis `npm test` dans `site/` ; audit des textes `index.html?audit=textes&parcours=1`
  à 0 défaut en 1920×1080, 1366×768 et mobile portrait, FR et EN.
- Capture de la barre des journées de l'appli Journal : « J1 » seul, sans date dessous.
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
