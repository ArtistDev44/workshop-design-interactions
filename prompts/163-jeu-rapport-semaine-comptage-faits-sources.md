# Prompt 163 — Jeu : le rapport de fin de semaine compte juste et cite ses sources

Source : revue UX du 12/11/2026 (`ux-informations-2026-11-12.md`, constat 6 ; volet D constats 1 et 3, § 8, § 12,
§ 13, § 14, § 15). Suite n° 4 proposée par la revue.

Choix retenu pour l'arbitrage n° 9 de la revue (« écran `dessinerFin` ») : **migrer ses informations dans le rapport**,
qui est l'écran réellement vu ; ne pas rétablir `dessinerFin` dans le parcours.

## Constats

- `statsSemaine` (`game.js` ~l.2140) compte `h.action` avec les anciennes clés (devier / retenir / renfort / rien) :
  la page 2 affiche Dévier 0, Retenir 0, Renfort 0, Ne rien faire 0 pour 16 dossiers traités. `profilPartie` lit
  déjà `h.famille`.
- `finDeSemaine` pose toujours `RAPPORT` : `dessinerFin` (`sketch.js` ~l.837), seul écran qui cite le pire retard
  réel, la composition de la semaine (dont « 1 incident (fictif) »), les sources, le record et la mauvaise source, est
  inatteignable.

## À faire

1. **Comptage** : `statsSemaine` compte par famille de réponse actuelle (celle qu'utilise `profilPartie`) ; la page 2
   affiche ces familles avec les mots que le joueur a vus.
2. **Page « Sources et faits de la semaine »** dans le rapport (3ᵉ page, ou bloc de la page 2 si la place suffit,
   navigation Tab cohérente) reprenant de `dessinerFin` :
   - pire retard réel (ou « non renseigné par les archives ») ;
   - composition : n perturbations réelles · n événements de l'agenda · n alertes météo · 1 incident (fictif) ;
   - sources : Open Data Nantes Métropole (GTFS Naolib, agenda), Open-Meteo — avec la mention de l'incident fictif
     (texte aligné sur le prompt 162 s'il est déjà fusionné) ;
   - « Nouveau meilleur bilan ! » / meilleur bilan, mauvaise source retenue n fois, malus le plus fréquent.
3. **Défis** : un défi dont la valeur est 0/0 (aucune plainte) est « sans objet », pas « tenu » avec bonus.
4. **Décisions clés** (page 1) : classer meilleure / pire d'après l'évaluation (bon / moyen / mauvais) puis l'écart,
   pas la seule somme des écarts ; ne plus tronquer l'action (« Ne rien », « — » vide) ; ajouter les écarts de jauges.
5. **Textes et mise en page** : période en jj/mm (« du 14/09 au 20/09/2026 · 6 jours joués ») ; `fin.*.texte`
   « ces sept jours » → « cette semaine » ; nommer le type de fin (bonne / moyenne / mauvaise) près du tampon avec son
   seuil (≥ 240 / ≥ 150) ; supprimer les doublons de la page 2 (jauges finales, profil, défis déjà en page 1 ou
   l'inverse : un seul endroit) ; corriger le débordement « Équipes envoyées » ; retirer « (Q25) ».
6. Le mail de fin de semaine cite une donnée de la source (pire retard ou événement marquant).

## Vérifications

- Semaine jouée jusqu'au rapport : les familles comptées somment au nombre de dossiers traités ; la page des sources
  s'affiche ; aucun texte ne déborde (audit des textes, 3 tailles, FR/EN).
- `npm run build` puis `npm test` ; ajouter à `test-jeu.mjs` un contrôle `statsSemaine` (somme = traités) ;
  `prompts/README.md` et `journal.md`.
