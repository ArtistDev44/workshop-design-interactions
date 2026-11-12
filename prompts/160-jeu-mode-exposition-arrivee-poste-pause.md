# Prompt 160 — Jeu : le mode exposition tient ses promesses à l'écran

Source : revue UX du 12/11/2026 (`ux-informations-2026-11-12.md`, constat 7 ; volet A § 12, § 2, § 13).
Suite n° 1 proposée par la revue : correction d'un défaut du prompt 132, exécutable sans arbitrage.

## Constats à corriger

1. **Le visiteur n'arrive pas « assis devant la carte ».** En `?expo=1`, `expoAuPoste()` (`expo.js`) règle
   `vue = 'poste'`, puis `fermerMenuPrincipal()` (`sketch.js:171` → `menu.js:48`) remet `vue = 'bureau'` à l'image
   suivante. Résultat mesuré : vue bureau + bulle « Prise en main 1/8 · Cliquez sur l'écran du PC » + bandeau
   « Incident en cours : cliquez sur l'écran du PC » (deux consignes identiques superposées).
2. **« Partie en pause » ne met pas le jeu en pause.** Sous le voile d'inactivité, l'horloge file (10:02 → 10:10
   mesuré). Le compte à rebours est annoncé en `aria-live="assertive"` à chaque mise à jour (bavard).
3. **Liens externes sur le kiosque.** Livrables, Dépôt du code, Partager, Présentation (menu) et les sorties des
   Crédits ouvrent un nouvel onglet : le visiteur suivant trouve GitHub ou Slidev au lieu du jeu.
4. **Marque « EXPO » absente** de l'écran titre, alors que le prompt 132 la demandait.
5. Bouton « Installer l'application » et bandeau « Nouvelle version disponible » proposés sur le kiosque.

## À faire

- Corriger l'ordre `expoAuPoste()` / `fermerMenuPrincipal()` pour que la partie démarre réellement en `vue = 'poste'`
  (appli carte ouverte) ; vérifier qu'aucune bulle de guide « Cliquez sur l'écran du PC » ni consigne de bureau ne
  s'affiche alors.
- Sous le voile « Partie en pause », **suspendre réellement l'horloge du jeu** (même mécanisme que la pause P) et la
  rétablir au toucher ; passer l'annonce du voile en `aria-live="polite"`, annoncée une fois (pas à chaque seconde).
- En `?expo=1` : masquer le bloc Livrables / Dépôt / Partager / Présentation du menu, les boutons externes des Crédits
  (Lire la licence, Making-of, Dépôt du code), « Installer l'application » et le bandeau de nouvelle version.
  Hors exposition, rien ne change.
- Ajouter une marque discrète « EXPO » (petite, coin de l'écran titre, contraste ≥ 4,5:1) quand `EXPO.actif`.

## Vérifications

- Build servi, `?expo=1` : après « Nouvelle partie », la vue est le poste avec la carte, sans consigne « cliquez sur
  l'écran du PC » ; sous le voile, l'heure du bandeau ne bouge pas pendant 20 s.
- Sans `?expo=1` : menu, liens et installation inchangés.
- `npm run build` puis `npm test` dans `site/` ; `prompts/README.md` et `journal.md` mis à jour.
