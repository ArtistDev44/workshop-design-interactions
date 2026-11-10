# Prompt 34 — Jeu « Nantes en régulation », étape 21 : fond derrière la fenêtre, Loire vivante, perspective du bureau, livre « Commandes » et vrai tutoriel

Objectif : corriger le fond vu par la baie vitrée et quelques objets du bureau selon les
retours de rendu — **sans le trottoir, la route ni les arbres, sans le château**, la **grue
ramenée au même niveau que les bâtiments et de leur couleur**, et **la Loire à sa place,
avec une hauteur calculée depuis une API** pour qu'on comprenne que c'est un fleuve ; au
passage, **téléphone et souris redessinés en perspective comme le clavier** (téléphone plus
récent), le **livre « tuto » remplacé par un livre « commande »**, et un **vrai tutoriel**
ajouté pour expliquer le jeu — sans toucher aux décisions verrouillées Q1–Q61 ni à la
boucle de jeu.

S'appuie sur les prompts 14–33 (décor pixel art de la baie vitrée dans `bureau.js`,
cadrage « sur la chaise » du prompt 31, style épuré du prompt 32, livres du prompt 20,
i18n du prompt 24, sauvegarde du prompt 33).

Fichiers concernés : `site/public/` (`bureau.js` pour la baie vitrée et les objets du
bureau, `immersion.js` pour les livres cliquables et le tutoriel, `game.js`/`sketch.js`
pour le déroulement du tutoriel, `i18n.js` pour tous les nouveaux textes, `data/` pour le
fallback de la hauteur de la Loire), plus une mise à jour de `jeu/` et `journal.md`.

Règles absolues : aucun fichier image ajouté (tout reste dessiné par le code, pixel art) ;
toute lecture API se fait dans `setup()` + `setInterval`, jamais dans `draw()`, avec
**fallback local obligatoire** (hauteur figée si l'API est injoignable, mode hors ligne
compris) ; aucun texte inventé hors `t(...)` (`i18n.js`, FR + EN) ; contraste ≥ 4,5:1 et
cibles de clic inchangées ou plus grandes ; `prefers-reduced-motion` respecté.

## 1. Fond derrière la fenêtre (`dessinerVueNantes` dans `bureau.js`)

- **Supprimer le trottoir, la route et les arbres** : retirer la bande de quai
  (`#a49c8b`, y ≈ 138–150) et tout éventuel tracé de chaussée, ainsi que les quatre
  arbres des quais ; le bas de la baie donne directement sur l'eau.
- **Supprimer le château** : retirer l'appel à `dessinerChateauDesDucs(...)` et la
  fonction elle-même (plus de douves ni de pont).
- **Grue au niveau des bâtiments** : `dessinerGrueTitan(...)` a sa base **au même niveau
  que le bas des immeubles de la ville lointaine** (ligne d'horizon commune), et non plus
  enfoncée dans l'eau/les quais.
- **Grue de la couleur des bâtiments** : remplacer le jaune (`#f2c230` / `#9c8634`) par
  la teinte des immeubles (`#8b96a3` le jour, `#0f1626` la nuit, tons voisins pour
  l'ombre) — la grue se fond dans la silhouette de la ville.
- **La Loire à la place** : la bande d'eau occupe toute la largeur en bas de la baie
  vitrée, avec vagues/lignes d'écume animées doucement (sauf `prefers-reduced-motion`),
  reflets du ciel, et éventuellement une péniche ou deux silhouettes de bateaux pour que
  l'on comprenne **que c'est un fleuve** (large, horizontal, navigable).

## 2. Hauteur de la Loire calculée avec une API

- Hauteur d'eau réelle de la **Loire à Nantes** via l'API publique **Hub'Eau /
  Vigicrues** (eaufrance, `hubeau.eaufrance.fr`, API hydrométrie, station de la Loire à
  Nantes, champ hauteur en mètres) — aucune clé requise, CORS ouvert, lecture dans
  `setup()` puis `setInterval` (~10 min), jamais dans `draw()`.
- **Mapping lisible** : la hauteur d'eau réelle pilote la **hauteur du bandeau d'eau
  dans la baie vitrée** (plus le fleuve est haut, plus il occupe la vue ; échelle bornée
  et lissée pour rester dans le cadre de la baie à 1920×1080).
- **Fallback obligatoire** : si l'API est injoignable (hors ligne compris), utiliser une
  hauteur médiane figée dans `data/fallback` ; aucun clignotement ni trou dans le dessin.
- Documenter la source dans `jeu/api.md` (section « Hors portail Nantes Métropole »).

## 3. Perspective du bureau : souris, téléphone (et clavier inchangé)

- **Souris et téléphone redessinés en perspective comme le clavier**
  (`dessinerObjetsBureau`) : trapèzes fuivant le plateau (bord arrière étroit, bord avant
  large/hors champ), avec ombre tramée au sol, comme le clavier existant.
- **Téléphone plus récent** : smartphone moderne — bords arrondis, écran bord à bord,
  encoche ou point caméra discret, plus de gros cadre ni de bouton physique ; toujours
  dessiné par le code.
- Le clavier reste tel quel (déjà en perspective) ; la tasse, la lampe, l'horloge de
  bureau, les dossiers et la plante gardent leur style.

## 4. Livre « tuto » → livre « commande » + vrai tutoriel

- Dans `immersion.js` (`OBJETS_BUREAU`, `dessinerLivres`), **remplacer le livre « tuto »
  par un livre « commande »** (nouvelle couverture dessinée par le code, nouveau label
  i18n FR + EN) ; le livre « stress » reste. Le livre « commande » ouvre le tutoriel.
- **Vrai tutoriel** (nouveau, déclenché à la première partie et relançable depuis le
  livre « commande » et l'aide `H`) : séquence guidée en plusieurs étapes superposées à
  l'écran du PC — (1) l'objectif (garder les trois jauges au vert), (2) un dossier et
  son chrono, (3) les 3 actions + « ne rien faire » et leurs effets, (4) les raccourcis
  clavier et la pause, (5) le bilan de fin — avec « Suivant / Passer », focus clavier
  complet, textes 100 % `t(...)` FR + EN, aucune donnée inventée, `prefers-reduced-motion`
  (pas d'animation superflue), et persistance « tutoriel vu » dans le `localStorage`
  existant (prompt 33) pour ne plus le rejouer automatiquement.

## 5. Vérifications

- `npm run build` dans `site/`.
- Test visuel à 1280/1600/1920 px, jour/nuit/pluie : plus de trottoir/route/arbres ni de
  château par la fenêtre, grue au niveau des bâtiments et de leur couleur, Loire bien
  lisible comme un fleuve dont la hauteur varie avec l'API (vérifier avec et sans réseau
  : fallback fixe), souris et téléphone en perspective, téléphone moderne, livre
  « commande » cliquable (souris + clavier).
- Tutoriel : se lance à la première partie, se passe étape par étape au clavier, se
  relance depuis le livre « commande » et `H`, FR + EN, `prefers-reduced-motion`, hors
  ligne.
- Aucune régression des prompts 14–33 (partie complète rejouée, sauvegarde comprise) ;
  contraste ≥ 4,5:1 ; aucune image ajoutée.
- Documenter dans `jeu/18-fenetre-loire-tutoriel.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-34-fenetre-loire-tutoriel`. À chaque push : entrée en tête de
  `journal.md`. Ne pas fusionner dans `main` sans demande.
