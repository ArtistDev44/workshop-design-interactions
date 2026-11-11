# Prompt 98 — Jeu « Nantes en régulation » : revue UI/HUD (lisibilité, espace d'écran, diegetic), via le skill `game-ui-design`

Demande d'origine (11/11/2026) :

> L'interface comprend trop de boutons à cliquer. Pourquoi pas du drop avec le curseur.

Skill à utiliser pour ce prompt : **`game-ui-design`**, installé par
`npx skills add https://github.com/omer-metin/skills-for-antigravity --skill game-ui-design`
(déjà installé globalement : `~/.agents/skills/game-ui-design/`). Lire impérativement **`SKILL.md`** et
ses références — **`references/patterns.md`** (comment construire), **`references/sharp_edges.md`**
(les pièges critiques et pourquoi), **`references/validations.md`** (règles de validation) — et s'y
conformer. Croyances du skill à appliquer : « si le joueur remarque l'UI, quelque chose va mal », chaque
élément doit mériter sa place à l'écran, l'animation communique (elle n'est pas de la décoration),
clavier d'abord puis souris puis tactile, l'accessibilité n'est pas optionnelle, tester sur le pire
appareil cible (mobile portrait 412 px).

Objectif : une UI qui se fait oublier — moins de boutons, plus de gestes directs, lisible en pleine décision.

Règles :
- **Ne rien casser.** `game.js`, Q1–Q61, données réelles : inchangés. `npm run build` et `npm test` verts
  après chaque lot. Design system du dépôt respecté (`ds.js`, prompt 39 ; tailles minimales du prompt 92 ;
  contraste ≥ 4,5:1). FR + EN (`i18n.js`). `prefers-reduced-motion`, hors ligne, tactile : inchangés.
- Le décor bureau/PC est **déjà diegetic** (on joue dans la salle de contrôle, le PC est l'interface) :
  pousser cette direction plutôt que d'ajouter des couches d'UI.
- Prompts liés : 94 (glisser-déposer, bouton « Quitter la journée »), 95 (journées expliquées), 96 (juice).

## 1. Audit UI contre `references/validations.md` et `sharp_edges.md`

- Parcourir tous les écrans du jeu (accueil, poste, dossier ouvert, « En savoir plus », conflit,
  contradiction, narration, mail du soir, soir/flèche, fin, aide, paramètres, applis débloquées,
  téléphone, mobile portrait) en 1920×1080, 1366×768 et 412 px, FR et EN.
- Pour chaque écran, lister : éléments qui n'ont pas de rôle immédiat (candidats à la visibilité
  contextuelle : apparaître seulement quand pertinents, pattern « Contextual HUD Visibility » de
  `patterns.md`), boutons cliquables remplacables par un geste (drag & drop, clic sur l'objet du bureau),
  textes qui se relisent deux fois, zones mortes.
- Relancer l'audit des textes du prompt 93 (`index.html?audit=textes&parcours=1`) : 0 défaut A–D à garder.

## 2. Réduire les clics : gestes directs (prioritaire)

- Décider par **glisser-déposer** des cartes sur le dossier (prompt 94) ; à défaut d'implémentation, un
  **clic direct** sur la carte doit suffire partout (vérifier qu'aucun clic ne demande de confirmation
  inutile pendant une décision).
- Un seul bouton pour **quitter la journée** (Q), visible dans le bandeau (prompt 94).
- Barre de tâches / applis : les icônes inutiles en semaine 1 restent verrouillées grisées (prompt 91) —
  vérifier que cet état « moins d'UI » est réel, pas juste cosmétique.

## 3. Lisibilité en pleine action (clarté dans le chaos)

- Pendant un signalement, l'information critique tient en un regard : titre du dossier, gravité, tendance
  des effets, une seule zone d'action. Tout le reste derrière « En savoir plus » (déjà le cas, vérifier).
- Contraste et tailles : respecter les minimums du prompt 92 ; seuils de jauges (20/40) visibles sans
  survol ; l'état des lignes sur la liste reste lisible quand un panneau est ouvert.
- Motion = communication : les seules animations sont celles qui disent quelque chose (arrivée dossier,
  conséquence, alerte) ; aucune animation décorative nouvelle (lien avec le prompt 96).

## 4. Vérifications

- `npm test` + audit textes prompt 93 (0 défaut A–D) ; `npm run build` vert.
- Test sur le pire cible : mobile portrait 412 px, tactile uniquement — décider 3 signalements, quitter la
  journée, ouvrir l'aide : tout doit être atteignable au pouce, aucun texte tronqué.
- Test clavier seul : partie jouable de bout en bout sans souris (déjà exigé, re-vérifié après les
  changements).
- Rapport de revue (écran par écran, avant/après) dans `notes.md` ; `journal.md` (une ligne).
