# Prompt 20 — Jeu « Nantes en régulation », étape 7 : couche d'immersion

Objectif : rendre le jeu plus immersif **sans toucher aux décisions verrouillées Q1–Q61**
(jauges, actions, fins inchangées) ni à la vue bureau pixel art déjà en place
(`jeu/12-bureau-pixel.md`, `bureau.js`). On ajoute une couche de mise en scène par-dessus :
intro SMS, temps simulé compressé, sieste, alertes visuelles, mail de fin de journée,
ressources consultables.

Fichiers concernés : `site/public/oeuvres/pxe-nte001-g01-w01/` (`bureau.js`, `sketch.js`,
`game.js`, `confort.js`, `style.css`, `index.html`), plus une mise à jour de `jeu/` et
`journal.md`.

Règle absolue : rien n'est inventé côté données. Tout incident cité dans un texte
(SMS, mail) vient exclusivement des dossiers réellement joués pendant la partie
(ligne, retard, heure, météo du moment). Les textes de médiation (SMS, mails) sont de
la fiction d'encadrement, mais leurs contenus factuels proviennent du jeu.

## 1. S'appuyer sur le bureau existant (rien à refaire)

- La vue bureau pixel art (`bureau.js`) reste l'entrée du jeu : PC affichant le jeu en
  direct, zoom pour s'installer, Échap pour se lever. Le PC et le décor sont réutilisés
  tels quels.
- **Échap au bureau** : aujourd'hui Échap sert à se lever depuis l'écran ; au niveau
  bureau, un second Échap ouvre le **menu** (reprendre, paramètres, quitter). Afficher
  l'action d'Échap discrètement en bas d'écran (« Échap : se lever » /
  « Échap : menu »).
- Au bureau, la partie continue : le temps passe, les incidents arrivent, les bips
  restent audibles.

## 2. Intro SMS (premier jour)

- Au lancement d'une partie, avant le bureau : interface de messagerie séparée (bulles
  type SMS, même direction artistique, fond distinct).
- 4 à 6 messages courts qui ancrent le joueur : « Premier jour au travail, faut pas
  que je me loupe. », récapitulatif des responsabilités (réguler le réseau, traiter les
  incidents, garder les trois jauges au vert), consigne finale « Ouverture à 6h, on y
  va. »
- Textes écrits une seule fois (statiques), en français, sans incident inventé.
- Passer d'un message à l'autre par clic ou Entrée ; bouton « Commencer » après le
  dernier message. Cette intro ne rejoue pas en cas de « Rejouer » immédiat.

## 3. Horloge simulée et compression du temps

- Introduire une **heure simulée de la journée de travail** (6h → fin de journée),
  distincte de l'heure réelle du décor. L'horloge du bureau et le ciel de la fenêtre
  suivent désormais l'heure simulée ; l'heure réelle reste affichée uniquement en mode
  « aujourd'hui en temps réel ».
- Quand aucun incident n'est actif et qu'aucune décision n'est en cours : le temps
  simulé s'écoule **10× plus vite**, et l'horloge le montre (chiffres qui avancent vite,
  éventuel léger flou sur le décor).
- À l'arrivée d'un incident : retour immédiat au rythme normal (la journée reste bornée
  par les 15 dossiers et les durées de décision existantes).
- `prefers-reduced-motion` : pas de flou ni d'animation d'aiguille, la compression du
  temps reste purement logique.

## 4. Sieste et « Se réveiller »

- Après 20 secondes simulées sans incident ni interaction : animation du personnage
  assis qui se prélasse (mains derrière la tête, yeux mi-clos, silhouette en bas de
  l'écran bureau, même style pixel art que le décor).
- Puis une alerte arrive : triple bip. Un bouton **« Se réveiller »** apparaît avec une
  fenêtre de réaction calée sur le timer de la semaine 60/30/15 s : respectivement
  3/2/1 s.
- Presser le bouton (clic ou barre d'espace) : le joueur reprend la main, l'incident
  est traité normalement.
- Ne pas presser à temps : malus de −5 sur la jauge concernée par l'incident, traité
  comme « ne rien faire » (conséquences naturelles, Q25).
- `prefers-reduced-motion` : animation de sieste remplacée par un état statique ; le
  bouton et le délai restent identiques.

## 5. Alertes : bordures rouges

- Incident important (retard ≥ 20 min ou conflit de deux lignes Q27) : **bordures
  rouges pulsantes autour du cadre du moniteur**, visibles dans les deux niveaux
  (bureau et plein écran), jamais plus de 3 flashs par seconde.
- Au bureau, la bordure rouge signale qu'il faut cliquer sur l'écran du PC pour zoomer
  et traiter l'incident.
- Rouge cohérent avec la palette du jeu (rouge déjà utilisé pour les incidents actifs
  sur la carte Q29), contraste ≥ 4,5:1.

## 6. Mail de fin de journée (dans l'ordinateur)

- Chaque journée se conclut par un **mail affiché sur l'écran du PC**, avant l'écran de
  fin de la semaine (le bilan de fin de semaine Q54 reste inchangé).
- Le mail ne parle que de ce qui ne va pas : il cite les incidents réellement mal
  gérés de la journée, heure par heure, au format « 8h12 — ligne 4, retard 18 min :
  personne n'a réagi. » Les incidents bien gérés sont résumés en une ligne neutre.
- Le mail mentionne l'état des trois jauges concernées (« La satisfaction usagers est
  au point mort suite à trois incidents non traités. »), en reprenant les valeurs
  réelles et l'ordre chronologique des événements de la partie.
- Journée parfaite : mail court et positif, toujours ancré dans les incidents réels.
- Un bouton « Journée suivante » passe au jour suivant de la semaine.

## 7. Ressources au bureau

- Deux **livres cliquables posés sur le plan de travail** : « Tutoriel » (règles du jeu,
  actions et effets, reprend l'écran d'aide H existant) et « Bien gérer son stress »
  (texte court de médiation, statique, français). Ces livres s'ajoutent aux pistes
  d'objets interactifs listées dans `jeu/12-bureau-pixel.md`.
- Cliquer sur un livre ouvre une vue lecture simple (texte + bouton fermer, Échap pour
  revenir au bureau). La lecture ne met pas le jeu en pause : le temps continue de
  couler et le joueur assume le risque (le mail de fin de journée le montrera).
- Couvertures : placeholder simple (rectangle pixel art, titre, dos) pour cette étape ;
  couvertures soignées explicitement reportées à une étape ultérieure.
- Livres accessibles au clavier (tabulation + Entrée) et lisibles au focus.

## 8. Vérifications

- Vérifier par `npm run build` dans `site/`, pas par captures répétées.
- Tester : une partie complète avec sieste déclenchée (délai réduit pour le test puis
  remis à la valeur cible), un incident raté, un mail de fin de journée citant les
  incidents réels, les deux comportements d'Échap, la lecture d'un livre, le mode
  hors ligne (fallback), `prefers-reduced-motion`, le clavier seul, 1920×1080.
- Contraste ≥ 4,5:1 pour tous les nouveaux éléments ; aucun flash > 3/s ; aucun
  fichier image ajouté (tout est dessiné par le code, comme `bureau.js`).
- Documenter les décisions dans `jeu/13-immersion.md` et ajouter la ligne
  correspondante au sommaire de `jeu/README.md`.
- Travailler sur une branche `jeu/prompt-20-immersion`. À chaque push : une entrée en
  tête du tableau de `journal.md` (date, commit, fichiers, résumé). Ne pas fusionner
  dans `main` sans demande.
