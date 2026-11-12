# Prompt 190 — Doc : définir le public cible et l'objectif de session dans le concept du jeu

Demande d'origine (12/11/2026) : audit croisé avec le guide wikiHow « Comment concevoir un jeu vidéo », Partie 1
étape 2 « Déterminez votre public ». Constat : aucun document ne dit explicitement pour qui est le jeu ni
quelle expérience de session il vise.

## À faire

### 1. Dans `jeu/00-concept.md`

Ajouter une section « Public cible et session » après la phrase-problématique :

- **Public** : joueurs de 12 ans et plus, amateurs de jeux de gestion et de simulation
  (façon *Papers, Please*), cherchant une session courte et intense. Jouable au clavier seul, à la souris,
  ou sur mobile.
- **Session** : 10 à 20 minutes (une semaine rejouée = ~15 décisions). Une partie complète du mode histoire
  (3 semaines) = 30 à 45 minutes.
- **Ce que le joueur ressent** : la tension d'un régulateur qui doit trancher vite et bien, la satisfaction
  d'avoir bien lu la situation, la fierté d'une bonne fin.
- **Plateformes** : PC (1920×1080, clavier + souris) et mobile (portrait, tactile). Hors ligne après
  installation PWA.

### 2. Dans `README.md` (racine) et `site/README.md`

Ajouter une ligne dans la section de présentation du jeu : public visé et durée de session, en FR.
Dans `site/README.md`, section « Lancer le projet » ou équivalente, ajouter la durée estimée d'une partie.

### 3. Dans le menu principal du jeu (`menu.js`)

Sur l'écran d'accueil, sous le titre ou dans la carte « Nouvelle partie », ajouter une ligne du type :
« Une semaine réelle, une quinzaine de signalements à trancher, 3 jauges à préserver — 15 à 20 minutes. »
(déjà partiellement présent depuis le prompt 97 ; vérifier qu'elle mentionne bien la durée).
Clé i18n `mp.accroche.duree`, FR et EN.

### 4. Dans `slides/slides.md`

Une ligne sur la diapositive « Notre objectif » ou « Le jeu » : public cible et durée de session.

## Vérifications

- `jeu/00-concept.md` relu : la section existe, 5–8 lignes maximum.
- `npm run build`, `npm test` verts (les nouvelles clés i18n FR/EN sont contrôlées par `npm test`).
- `prompts/README.md` (ligne 190), `journal.md` au push.
- Aucune modification du code de jeu (`game.js`, règles Q1–Q61) — seul `menu.js` et `i18n.js` pour la ligne
  d'accroche.

## Hors périmètre

- Ne pas créer de persona fictif nommé.
- Ne pas modifier la difficulté ou la durée réelle du jeu.
