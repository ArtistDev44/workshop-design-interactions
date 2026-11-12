# Prompt 180 — Jeu : laisser plus de temps aux écrans « Jour N sur N »

Demande d'origine (prise de notes du 12/11/2026) :

> Rajouter du temps pour les écrans « jour N sur N ».

## À faire

- Écran de transition de journée (`immersion.js` ~l.192, textes `transition.jour`, `transition.jourArchive`,
  `transition.jourDirect`) : **allonger la durée d'affichage** pour que le titre soit lu sans effort — viser
  ≈ 3,5 s de texte pleinement lisible (hors fondus), contre la durée actuelle à relever et à citer dans le compte
  rendu.
- Le joueur pressé peut **passer l'écran** (clic, Entrée ou Espace) ; avec `prefers-reduced-motion` ou « Réduire
  les animations », pas de fondu mais la même durée de lecture.
- Le temps de jeu reste suspendu pendant l'écran ; le texte est annoncé une fois au lecteur d'écran.
- Mode exposition (prompt 160) : vérifier que l'allongement ne déclenche pas le voile d'inactivité.

## Vérifications

- Chronométrer l'écran avant / après ; le passage manuel fonctionne au clavier et à la souris.
- `npm run build` puis `npm test` dans `site/` (adapter les attentes de `test-jeu.mjs` si elles dépendent de la
  durée).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
