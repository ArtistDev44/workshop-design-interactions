# Prompt 199 — Jeu : audit et suppression du code désormais inutile

Demande d'origine (13/11/2026) :

> Fais moi un audit qui vise à supprimer le code désormais inutile. Aussi, après cela, fais un audit
> général du gameplay avec ce qui est à améliorer.

Ce prompt couvre la première moitié de la demande ; l'audit du gameplay est le prompt 200.

## À faire

1. **Recenser** le code que plus rien n'atteint dans `site/public/` : fonctions, constantes et membres
   d'API sans référence (preuve par `grep` dans `site/public`, `site/scripts`, `site/src`), branches
   rendues inatteignables par les refontes successives (cartes de réponse, glisser-déposer, briefing au
   choix, tâche « info trafic », fausses erreurs système, onglet Équipes, Corbeille), options proposées
   dans les Paramètres que plus aucun code ne lit, clés de traduction orphelines.
2. **Supprimer** ce qui est certain, en gardant ce qui sert encore ailleurs (`sourisPC`, `causeDe`,
   `ligneDe`, `dureeDe`, `resteAvantExpiration`).
3. **Ne pas toucher** aux règles du jeu : aucune valeur d'effet, aucun tirage, aucun texte affiché ne
   change. Les migrations de sauvegarde et les outils `audit-*.js` restent.
4. **Hors du jeu** : scripts cassés ou sans usage, doublons binaires, caches suivis par git.
5. **Adapter les tests** (`site/scripts/test-jeu.mjs`) : retirer les vérifications du code supprimé,
   les remplacer par un garde-fou d'absence quand c'est utile.
6. **Consigner** dans `jeu/199-audit-suppression-code-inutile.md` : ce qui a été retiré, ce qui a été
   gardé et pourquoi, ce qui reste à trancher par le groupe.

## Vérification

- `grep` de chaque nom retiré : aucune occurrence restante.
- `npm run build` puis `npm test` dans `site/`.
- Parcours sans interface (`?audit=textes&parcours=1`, `?audit=densite&parcours=1`, puis une partie
  jouée par les vraies fonctions) : aucune erreur de page.
