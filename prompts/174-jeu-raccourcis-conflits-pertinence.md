# Prompt 174 — Jeu : revoir les raccourcis clavier (conflits, pertinence)

Demande d'origine (prise de notes du 12/11/2026) :

> Revoir les conflits de raccourcis et vérifier leurs pertinences.

À exécuter après les prompts qui suppriment des écrans ou des boutons (140, 142, 171, 175, 183), pour ne pas
auditer des touches déjà retirées.

## À faire

1. **Inventaire** : relever toutes les touches écoutées (`keyPressed` de `sketch.js`, `toucheMenu`, `toucheAide`,
   `touchePatron`, `toucheTelephone`, `touchePartage`, journal, carte, community, paramètres, guide…) dans un tableau
   `contexte · touche · action · libellé affiché`.
2. **Conflits** : une même touche ne doit pas déclencher deux actions dans le même contexte, ni changer de sens
   entre deux écrans voisins (ex. C « Reprendre » au menu et C « Copier » au journal ; H, G, S, K, T, J). Vérifier
   aussi les collisions avec le navigateur et les lecteurs d'écran, et la saisie dans les champs de texte.
3. **Pertinence** : supprimer les raccourcis d'actions rares ou supprimées ; garder les universels (flèches, Tab,
   Entrée, Échap, chiffres 1–3 pour les répliques, Origine sur la carte). Retirer la touche des libellés quand le
   raccourci disparaît (« (C) », « (H) », « touche {k} »).
4. Mettre à jour l'onglet **Raccourcis** de l'aide (`aide.js`, `carteRaccourcisAide`) à partir du même tableau, pour
   que l'aide et le code ne divergent plus.

## Vérifications

- Tableau avant / après dans le compte rendu ; aucun doublon par contexte.
- Parcours complet au clavier seul (menu → partie → décision → fin de journée) sans touche morte ni action double.
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
