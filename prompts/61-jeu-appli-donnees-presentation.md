# Prompt 61 — Jeu « Nantes en régulation », étape 45 : appli « Données » fullscreen + page /presentation (slides.md)

Demande d'origine (10/11/2026) :

> Créer une nouvelle application à part, à droite du bureau, nommée « Données » : une fois ouverte, elle
> se met en plein écran et permet aux joueurs de voir les différentes données (actuelles ou passées selon
> le mode de jeu), avec les liens vers les API. Ajouter aussi des slides (`slides.md`) pour la page
> `/presentation`, au design system pixel, qui présente le projet en correspondant au brief initial.

Deux chantiers indépendants. Règles Q1–Q61 inchangées : `game.js` non touché, `test-jeu.mjs` reste vert.

## Partie 1 — Appli « Données » du bureau RégulOS
1. **Icône « Données »** dans la grille du bureau (`GRILLE_OS`, à droite — colonne de droite, case libre),
   style Pixel Design System comme les 7 autres applis, libellé FR + EN. Clic (ou clavier) → l'appli
   s'ouvre en **plein écran** sur l'écran du PC (comportement fullscreen de l'ancienne appli Régulation,
   bouton fermer carré → retour au bureau), avec aussi une icône dans la barre des tâches.
2. **Contenu selon le mode de jeu** (même convention que la météo du prompt 49) :
   - **mode direct** : données actuelles — retards temps réel Naolib (GTFS-RT/SIRI), météo du jour
     (Open-Meteo forecast), hauteur de la Loire (Hub'Eau, station M800001010), agenda du jour ;
   - **mode semaine passée** : données archivées de la semaine jouée — météo horaire réelle (Open-Meteo
     archive ERA5), agenda de la semaine, incidents rejoués de `data/semaines/`.
   Chaque bloc affiche : **nom de la donnée, valeur réelle affichée, libellé « en direct » ou
   « archive du … » selon le mode, nom de la source avec lien cliquable vers l'API**, licence (Licence
   Ouverte Nantes Métropole / ODbL / CC BY 4.0 Open-Meteo), et « hors ligne → repli local » si applicable.
   Sources et URLs : `jeu/api.md`. Aucune donnée inventée.
3. **Lecture des données** : jamais dans `draw()` — `setup()` + `setInterval`, délai borné, repli local
   (`data/fallback/`, `data/loire.js`) si API injoignable, sans clignotement.
4. **Accessibilité** : textes ≥ 20 px, contraste ≥ 4,5:1, fermeture au clavier (Échap), annonce
   `aria-live` à l'ouverture, FR + EN (`i18n.js`), animations réduites respectées. Aucun effet sur les
   jauges, le compteur, les décisions.

## Partie 2 — Page `/presentation` et `slides.md`
5. **`slides.md`** à la racine du dépôt, lu au build par la page (même pattern que `making-of.astro` qui
   lit `../prompts/README.md`) : une slide par section séparée par `---`, en français.
6. **`site/src/pages/presentation.astro`** : génère la page **`/presentation/`** qui rend `slides.md` en
   diaporama au **Pixel Design System** (fond #0D0C0C, primaire #D4031C, arrondi 0, JetBrains Mono /
   Bitsy Pixels — prompt 39) : navigation ← / → (et boutons), numéro de slide, sommaire, responsive,
   contraste ≥ 4,5:1, focus visible. Lien vers `/presentation/` depuis `/cartel/` et `/making-of/`.
7. **Contenu des slides, conforme au brief initial** (livret PATRIMOINE.EXE NTE001 : restituer œuvre,
   cartel, documentation, démonstration) : phrase-problématique et concept ; la chaîne
   **source → grammaire → système → œuvre** ; les données réelles utilisées + liens API + licences ;
   les règles du jeu (boucle incident → décision, 3 jauges, 3 fins, compteur) ; les interactions
   (clavier, souris, micro, webcam) ; l'accessibilité et le hors ligne ; les livrables (cartel, captures,
   QR, version archivée) ; crédits (musiques CC0, `audio/CREDITS.md`).

## Vérifications
- `npm run build`, `npm test` ; essai réel : icône « Données » (clic + clavier), ouverture plein écran,
  contenu direct vs semaine passée, liens cliquables, repli hors ligne, fermeture ; page `/presentation/`
  générée, navigation clavier, liens internes 0 cassé, FR. Aucune erreur console. Documenter dans
  `jeu/51-…`. Fusion `main` sur demande.
