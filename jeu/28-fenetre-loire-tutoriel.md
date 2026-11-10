# 28 — Fenêtre sur la Loire, perspective du bureau, livre « Commande » et tutoriel (prompt 34)

> **Révision du 10/11/2026** : la grue est plus petite (≈ 40 px, l'échelle des immeubles) et sa silhouette est pleine et opaque. La souris et le téléphone sont pivotés vers l'écran. Le tutoriel s'affiche dans le livre « Commande » ouvert. Voir `29-correctifs-plein-ecran-livres.md`.

Décisions verrouillées. Les décisions Q1–Q61 et la boucle de jeu ne changent pas. Le tutoriel suspend l'horloge simulée, comme les SMS de l'intro.

Note de numérotation : le prompt demandait `jeu/18-fenetre-loire-tutoriel.md`, mais le n° 18 est déjà pris (multi-langue). Ce fichier prend donc le n° 28.

## 1. Vue par la baie vitrée (`dessinerVueNantes`, `bureau.js`)
- Sont retirés : le quai et le trottoir (`#a49c8b`), les quatre arbres, le château des ducs (appel **et** fonction `dessinerChateauDesDucs`, douves, pont).
- La grue Titan est posée sur `HORIZON_VILLE = 122`, le bas des immeubles lointains. Elle prend leur teinte : `#8b96a3` / ombre `#7a8592` le jour, `#0f1626` / `#1a2336` la nuit, avec la vitre de la cabine allumée la nuit. Elle se fond dans la silhouette de la ville.
- La Loire (`dessinerLoire`) occupe toute la largeur jusqu'au bas de la baie :
  - reflet du ciel en surface et eau plus sombre vers la baie ;
  - 4 rangées de vaguelettes qui dérivent en sens alternés ;
  - une péniche (coque, timonerie, sillage) qui descend le fleuve.
  - Animations réduites : vaguelettes et péniche figées.
- Entre la ville et l'eau, le mur de quai de la rive d'en face : la hauteur visible de ce mur montre le niveau du fleuve.

## 2. Hauteur de la Loire (API Hub'Eau, repli local)
- Source : Hub'Eau Hydrométrie v2, `observations_tr`, station **M800001010 « La Loire à Nantes - Pont Anne de Bretagne »**, grandeur H (mm → m), sans clé, CORS ouvert. La v1 répond 403. Détail dans `jeu/api.md` § 6.
- Lecture : `demarrerLoire()` est appelé dans `setup()`, puis toutes les 10 min (`setInterval`), jamais dans `draw()`. Délai max 6 s, valeur acceptée entre −2 et 15 m. Pas d'appel en mode « hors ligne forcé ».
- Mapping :
  - la hauteur est bornée au minimum et au maximum réels de la période de référence (0,755 – 6,832 m) ;
  - elle donne un bandeau d'eau de 8 à 26 px pixel art (de 30 à 100 px à l'écran) ;
  - le passage d'une valeur à l'autre est lissé (8 % par rendu, immédiat en animations réduites).
- Repli (`data/loire.json` + `data/loire.js`) : instantané réel du 10/11/2026, médiane **4,1385 m** sur 3 970 relevés (11/10 → 10/11/2026). Utilisé hors ligne ou si l'API échoue, sans clignotement : la dernière valeur connue reste affichée.
- Test : en ligne, 5,096 m (API, 10/11/2026 15:00 UTC) ; API bloquée, 4,1385 m (repli).

## 3. Souris et téléphone en perspective
- `trapeze()` dessine chaque ligne un peu plus large vers l'avant, comme le clavier, avec une ombre tramée sur le plateau.
- Souris : coins arrondis, séparation des boutons, molette.
- Smartphone récent : coque fine, écran bord à bord, point caméra, barre gestuelle, reflet diagonal, sans bouton physique.
- Clavier, tasse, dossiers, plante, horloge et applique ne changent pas.

## 4. Livre « Commande » et tutoriel
- Le livre « tuto » (`OBJETS_BUREAU[1]`) devient `commande`, même zone. Couverture marine avec liseré doré et titre « COMMANDE » (glyphe `M` ajouté). Label `objet.commande`. Le clic ou Tab + Entrée ouvre le tutoriel.
- Le tutoriel (`lancerTutoriel`, `immersion.js`) comporte 5 étapes, superposées à l'écran et dessinées après tout le reste :
  1. objectif et jauges ;
  2. dossier et compteur ;
  3. les 3 actions + « ne rien faire » et leurs effets ;
  4. raccourcis et pause ;
  5. le bilan.
- Tous les textes passent par `t('tuto.*')` en FR et en EN et ne reprennent que les règles réelles du jeu (seuils 40 / 20, compteurs 60 / 30 / 15 s, dé à 6 faces, score 0–300, 3 fins).
- Boutons : Suivant / Terminer, Passer, Précédent.
- Clavier : Entrée active le bouton qui a le focus, Tab change de focus (cadre `#1c2733` visible), → suivant, ← précédent, Échap passe. L reste actif (langue). Chaque étape est annoncée en `aria-live`.
- Déclenchement :
  - automatique à la première partie, juste après les SMS (ou au lancement si l'intro a déjà été vue) ;
  - relance par le livre « Commande », le bouton « Tutoriel (T) » de l'aide, ou T dans l'aide.
- Persistance : `localStorage` `pxe-nte001-tutoriel-vu = "oui"` à la fin ou quand on passe le tutoriel. La sauvegarde de partie (prompt 33) n'y touche pas.
- Pendant le tutoriel, l'horloge simulée ne tourne pas (`avancerTemps`) et seuls ses boutons sont cliquables.

## Vérifications
- `npm run build` OK (1 page) et `npm test` OK.
- Test automatisé (Chromium, 1920×1080), sans erreur console, en FR (en ligne) et en EN (API bloquées) :
  - Loire : API 5,096 m / repli 4,1385 m ;
  - tutoriel lancé après les SMS, temps suspendu, Entrée et → avancent, Tab + Entrée passe, `tutoriel-vu = oui` ;
  - relance par le livre et par T dans l'aide.
- Captures : jour pluvieux et nuit. Plus de château, d'arbres ni de quai ; grue grise au niveau des immeubles ; péniche sur la Loire.

## Mise à jour (prompt 59, check-up du 10/11/2026)
- `dessinerChateauDesDucs` n'existe plus dans `bureau.js` : la vue par la baie (`dessinerVueNantes`) garde la ville, la grue Titan, la Loire et la péniche.
