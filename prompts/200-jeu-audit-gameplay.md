# Prompt 200 — Jeu : audit général du gameplay, ce qui est à améliorer

Demande d'origine (13/11/2026) :

> Fais moi un audit qui vise à supprimer le code désormais inutile. Aussi, après cela, fais un audit
> général du gameplay avec ce qui est à améliorer.

Ce prompt couvre la seconde moitié de la demande, après le nettoyage du prompt 199.

## À faire

1. **Décrire l'état réel du code**, pas celui des documents `jeu/` : boucle d'une journée, jauges,
   génération des dossiers, décisions offertes, mécaniques annexes, fins.
2. **Mesurer** avec les vrais fichiers du jeu : composition des trois semaines d'archives, et résultat
   de quatre façons de jouer (meilleure réplique, autre réplique, clash, hasard). Livrer le script
   (`site/scripts/simuler-equilibrage.mjs`) pour que chaque chiffre soit reproductible.
3. **Vérifier en jeu** tout bug avancé avant de l'écrire.
4. **Classer** les constats par priorité, chacun avec `fichier:ligne` et une piste d'amélioration.
   Distinguer ce qui est mesuré, lu dans le code, ou seulement relevé sans vérification.
5. **Ne modifier aucune règle du jeu** : les corrections feront l'objet de prompts suivants, à choisir
   par le groupe. Aucune valeur d'équilibrage inventée : les pistes sont des hypothèses à tester.
6. **Livrer** `jeu/200-audit-gameplay.md`, avec une feuille de route ordonnée.

## Vérification

- `cd site && node scripts/simuler-equilibrage.mjs` redonne les tableaux du document.
- `npm run build` puis `npm test` : inchangés par rapport au prompt 199.
