# Prompt 178 — Jeu : plusieurs sauvegardes et écran « Reprendre une partie »

Demande d'origine (prise de notes du 12/11/2026) :

> Avoir différentes sauvegardes de parties. Renommer le bloc « reprendre la partie » par « reprendre une partie ».
> Ici, on peut récupérer sa sauvegarde.

À exécuter avec le prompt 177 (plus de modale de rappel à la création d'une partie).

## À faire

1. **Plusieurs emplacements de sauvegarde** (`sauvegarde.js`) : chaque nouvelle partie crée son emplacement ;
   sauvegarde automatique dans l'emplacement de la partie en cours. Limite raisonnable (par ex. 5 parties, la plus
   ancienne proposée à la suppression au-delà) pour tenir dans `localStorage` (une partie pèse 6 à 45 ko).
2. **Migration** : la sauvegarde unique actuelle devient le premier emplacement, sans perte ; format versionné.
3. **Menu principal** : l'entrée devient **« Reprendre une partie »** (`mp.reprendre`, FR/EN, sans raccourci entre
   parenthèses — voir prompt 174) ; grisée s'il n'y a aucune sauvegarde.
4. **Écran « Reprendre une partie »** : liste des sauvegardes, la plus récente d'abord — mode, semaine, jour
   atteint, date et heure de la dernière sauvegarde, état des trois jauges. Actions : **Reprendre** (Entrée) et
   **Supprimer** (avec confirmation). C'est ici qu'on récupère sa sauvegarde ; aucune donnée inventée, un champ
   absent d'une ancienne sauvegarde s'affiche `[À COMPLÉTER]` ou est masqué.
5. Retirer l'ancienne modale de rappel / d'écrasement et ses textes i18n devenus inutiles.
6. Mode exposition (prompt 160) : vérifier que la purge de fin de session reste compatible avec les emplacements.

## Vérifications

- Créer trois parties, quitter, reprendre la deuxième : état identique (jour, jauges, dossiers) ; supprimer la
  première ne touche pas aux autres.
- Une sauvegarde au format d'avant la mise à jour est reprise sans erreur.
- Écran utilisable au clavier et annoncé au lecteur d'écran (« sauvegarde 2 sur 3 : … »).
- `npm run build` puis `npm test` dans `site/` (ajouter un test de migration dans `test-jeu.mjs`) ; audit des textes.
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
