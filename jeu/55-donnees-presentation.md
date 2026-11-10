# 55 — Appli « Données » et page /presentation (prompt 61)

## Appli « Données » (RégulOS)
Code : `donnees.js` ; ouverture dans `os.js` (`ouvrirIconeOS`, `dessinerOS`). Règles Q1–Q61 inchangées.
- **8ᵉ icône** du bureau, dans la colonne de droite (case libre de `GRILLE_OS`), et dans la barre des tâches ;
  clic, ou sélection au clavier puis Entrée. L'appli s'ouvre **en plein écran** sur l'écran du PC (barre des
  tâches comprise) ; croix carrée ou **Échap** pour revenir au bureau. Annonce `aria-live` à l'ouverture.
- **Selon le mode** (même convention que la météo du prompt 49) :
  - partie **en direct** : retards temps réel Naolib (lignes ≥ 10 min, heure du relevé), météo du jour
    (prévision Open-Meteo), agenda du jour (chargé à l'ouverture, délai 6 s, repli), Loire ;
  - **semaine passée** (ou hors ligne) : incidents rejoués de la semaine (par type), météo de la semaine
    (valeurs **journalières** de l'archive ERA5 préparées par `preparer-semaines.mjs` — le jeu ne stocke pas
    d'heure par heure, donc rien de plus n'est affiché), agenda de la semaine, Loire.
- Chaque bloc : nom, valeurs réelles, état (« en direct · … », « archive du … au … », « hors ligne → repli
  local »), source, licence (Licence Ouverte Nantes Métropole, CC BY 4.0 Open-Meteo ; Hub'Eau : à vérifier
  par le groupe) et **« Ouvrir l'API ↗ »** (la requête réelle dans un nouvel onglet).
- La Loire n'a pas d'archive dans le jeu : en semaine passée, l'appli le dit (« valeur du moment »).
- Lecture des valeurs déjà chargées par le jeu : aucun appel réseau dans `draw()`.

## Page `/presentation/` et `slides.md`
- `slides.md` (racine du dépôt) : 11 slides séparées par `---` — titre, question, chaîne source → grammaire →
  système → œuvre, sources réelles (liens et licences), grammaire, système (règles, 3 jauges, 3 fins,
  démission), œuvre, interactions (clavier, souris, toucher, micro, webcam), accessibilité et hors ligne,
  livrables, crédits. Auteurs et part humaine : `[À COMPLÉTER]`.
- `site/src/pages/presentation.astro` lit `slides.md` au build (comme `making-of.astro`) et rend un diaporama
  au Pixel Design System : une slide à la fois, ← / →, Début / Fin, boutons, compteur annoncé, sommaire,
  lien direct `#slide-n`, focus visible, responsive ; sans JavaScript, toutes les slides restent lisibles.
  Styles globaux (`is:global`) : le HTML généré depuis `slides.md` n'a pas les attributs des styles scopés.
- Liens vers `/presentation/` depuis `/cartel/` et `/making-of/` ; page vérifiée par le smoke test.

## Vérifications
- `npm run build`, `npm test` (123 + 152 contrôles) ; 4 pages générées, aucun lien interne cassé.
- Chromium : icône Données (clic réel et clavier) → plein écran, mode archive sur la semaine du 02/11
  (2 incidents, 7 jours de météo, 26 événements, Loire 4,96 m en direct), lien d'API ouvert, Échap → bureau.
  Présentation : → → (3/11), Fin (11/11), sommaire (4/11), Début (précédente désactivée), mobile 390 px sans
  défilement horizontal ; aucune erreur console.
