# Prompt 112 — Jeu « Nantes en régulation » : première partie qui démarre plus vite, tutoriel amélioré

Demande d'origine (12/11/2026) :

> Réduis le temps pour le début de la première partie avant que l'animation de téléphone ne se mette en place.
> Améliore le tutoriel.

## 1. Démarrage de la première partie

### Constat

Dans `sketch.js` (`lancerNouvellePartie`), à la première partie :

- `demarrerJournee()` affiche la transition « JOUR 1 » ;
- puis `lancerIntroSMS()` lance la conversation avec Camille ;
- `lancerConversation` (`telephone-main.js`) **attend toute la transition** avant de lever le téléphone :
  `TEL_MAIN.debut += resteTransitionJour()`, avec `DUREE_TRANSITION_JOUR = 5200` ms depuis le prompt 95 ;
- s'y ajoute le chargement de la semaine.

Le joueur regarde donc un écran noir plus de 5 s avant de voir le téléphone.

### À faire

- **Mesurer d'abord**, dans la doc : le temps entre le clic « Jouer » et le téléphone levé, avant et après.
- **Transition du jour 1 de la première partie** (`!introVue`) :
  - courte : ~1,5 s ;
  - le téléphone se lève **pendant** la fin de la transition, sans l'attendre jusqu'au bout ;
  - les autres journées gardent 5,2 s : l'explication du prompt 95 y reste utile ;
  - les lignes d'explication du jour 1 ne sont pas perdues : elles restent annoncées par `annoncer()` et se
    relisent dans le tutoriel ou le fil de la journée.
- **Téléphone :**
  - le premier message s'affiche dès que le téléphone est levé, sans délai de frappe supplémentaire au
    premier message ;
  - `DUREE_TEL_MAIN` (450 ms) peut descendre à ~300 ms pour l'intro, s'il reste lisible.
- **Pendant le chargement de la semaine :** un indicateur bref et sobre, pas d'écran vide. Il n'y a rien à
  ajouter si le chargement est déjà instantané (instantanés locaux).
- Entrée / clic passent toujours la transition. « Passer » (prompt 97) reste en place.
- Animations réduites : apparitions directes, mêmes durées raccourcies.

## 2. Tutoriel (`immersion.js`, livre « Aide », 6 étapes)

### Constat

Les textes `tuto.1` à `tuto.6` (`i18n.js`, FR et EN) décrivent un jeu qui n'existe plus :

- cartes de réponse et touches 1 à 4 : remplacées par la fenêtre du plaignant au prompt 107 ;
- équipes par Maj + 1–4 : désormais au glisser-déposer depuis le panneau droit (prompt 108) ;
- appli « Signalements » en liste et icônes du PC : désormais une seule appli plein écran avec carte
  interactive et menu à gauche (prompts 103, 105, 106) ;
- notifications : désormais des badges (prompt 111).

Le texte est un seul pavé à droite. La page gauche n'a qu'un titre.

### À faire

- **Réécrire les étapes d'après le jeu actuel.** Vérifier chaque affirmation dans le code avant de l'écrire.
  Proposition de 6 étapes :
  1. **Votre rôle et l'objectif** : la semaine réelle, les trois jauges et leurs seuils ;
  2. **La carte** : les signalements à leur lieu réel, glisser, molette, recentrer, « Lieu à préciser » ;
  3. **Répondre** : ouvrir un signalement, la fenêtre du plaignant, des répliques adaptées, sans chrono par
     défaut (prompt 87) ;
  4. **Les équipes** : glisser une équipe du panneau droit sur un signalement, le trajet depuis le centre,
     les effectifs du jour ;
  5. **Le menu et les badges** : Patron, Community, Journal, Données ; les chiffres rouges comptent les
     nouveautés ; somnolence et sieste ;
  6. **La fin de journée et le bilan** : mail du soir, Sortie, score de fin de semaine. Ajouter micro et
     caméra en option, autorisés avant de jouer (prompt 110).
- **Textes courts :** 3 à 4 phrases par étape au plus, en verbes d'action.
  - Les raccourcis clavier vont dans une ligne à part, en `POLICE_DONNEES`.
  - Pas de pavé. L'audit des textes (prompt 93) doit rester à 0 défaut, sans débordement.
- **Page gauche illustrée :** un petit schéma dessiné par le code (pixel, couleurs `DS.*`) pour chaque étape
  sous le titre :
  - jauges ;
  - carte avec un repère ;
  - bulle de dialogue ;
  - pastille d'équipe et tracé ;
  - menu avec badge ;
  - lune et flèche.
  - Pas d'image inventée ni de capture à générer.
- **Montrer en vrai, si c'est simple :** quand l'élément décrit est visible derrière le voile, l'encadrer.
  Pour cela, réutiliser `cibleGuide` / `cibleReelle` du guide « Prendre en main » (prompt 37). Sinon, ne
  rien forcer.
- **Barre de progression** des étapes cliquable : aller directement à une étape.
- **Cohérence avec le guide « Prendre en main »** (`guide.js`) : relire ses textes `guide.*`. Corriger ce qui
  contredit le jeu actuel, par exemple l'étape « actions » si elle parle encore des cartes.
- **Aide (`H`)** : corriger les mêmes affirmations périmées si elles y figurent.
- **FR et EN** ; navigation au clavier inchangée (Entrée, ← →, Tab, Échap).

## Vérifications

- Le délai mesuré avant/après est noté dans la doc. Il doit passer sous ~2,5 s, hors réseau.
- Les 6 étapes sont lues dans les deux langues. Chaque affirmation correspond au code : citer le fichier.
- `npm run build`, `npm test`, audit des textes à 0 défaut (1920×1080, 1366×768, portrait).
- Doc commune `jeu/110-113-autorisations-badges-intro-credits.md`, `prompts/README.md`, `journal.md`.
