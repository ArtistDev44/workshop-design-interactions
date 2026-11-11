# Prompt 97 — Jeu « Nantes en régulation » : boucle d'engagement et flow (easy to learn, hard to master), via le skill `game-design-theory`

Demande d'origine (11/11/2026) :

> Il doit être easy to learn & hard to master.

Skill à utiliser pour ce prompt : **`game-design-theory`**, installé par
`npx skills add https://github.com/pluginagentmarketplace/custom-plugin-game-developer --skill game-design-theory`
(déjà installé globalement : `~/.agents/skills/game-design-theory/`). Lire **`SKILL.md`** et
**`references/DESIGN_GUIDE.md`** avant toute modification. Appliquer en particulier : le framework
**MDA** (mechanics → dynamics → aesthetics), la **boucle d'engagement** (input → process → feedback < 100 ms
→ reward → repeat, causalité claire), le **canal de flow** de Csikszentmihalyi (challenge ≈ compétence),
la **théorie de l'autodétermination** (autonomie, compétence, appartenance) et les **types de récompenses**
intrinsèques vs extrinsèques.

Objectif : que la première partie se comprenne en moins d'une minute (learn) et que la maîtrise se joue
sur la semaine entière (master) — sans toucher aux règles verrouillées.

Règles :
- **Ne rien casser.** `game.js`, Q1–Q61, effets + 1d6, jauges, fins, données réelles : inchangés. On agit
  sur la **présentation, l'onboarding et la lisibilité de la progression** (couche d'affichage :
  `sketch.js`, `panneau.js`, `guide.js`, `immersion.js`, `i18n.js`, `taches-ui.js`). `npm run build` et
  `npm test` verts après chaque lot.
- FR + EN, clavier complet, `prefers-reduced-motion`, hors ligne, mobile : inchangés.
- Le prompt 94 (prise en main : bouton « Quitter la journée », glisser-déposer) et le prompt 95 (journées
  expliquées) sont les fondations : ce prompt 97 en est la couche « théorie du game design ».

## 1. Diagnostiquer la boucle actuelle avec la grille du skill

- Boucle : signalement → lecture → décision → conséquences → suivant. Mesurer : temps réel moyen de
  décision d'un joueur novice, clarté de la causalité (le retour après décision existe, `panneau.js`
  `explicationDecision`) — lister 3 frictions qui ralentissent le feedback ou cassent la causalité.
- Flow : la difficulté par semaine (60/50/40 budget, signalements simultanés 3/2/1) est le réglage du
  canal de flow ; vérifier qu'elle est **visible** avant de jouer (écran d'accueil de la semaine) et
  expliquée, sans la changer.
- Autonomie : le joueur choisit quelle réponse déposer et quand quitter (Q) — conforter ces choix
  (aperçu honnête des tendances déjà en place, pas de la valeur exacte).

## 2. Learn : première partie en < 1 minute

- Parcours d'accueil : 3 semaines + mode temps réel déjà proposés ; ajouter si manquant un **aperçu en
  une ligne** de ce qu'est une décision (ex. « 15 signalements à trancher, 3 jauges à préserver »).
- Onboarding existant (tutoriel prompt 34, guide prompt 37) : le simplifier si une étape demande plus
  d'un geste ; la première décision doit être guidée (bulle « glissez la carte sur le dossier — ou
  cliquez » si le prompt 94 est en place, sinon « cliquez la réponse ou touche 1 »).
- « Hard to master » lisible : la profondeur (effets contextuels, 1d6, retard effectif, équipes, thème du
  jour, pression morale) doit être **découvrable**, pas cachée : l'aide H et le glossaire déjà présents
  sont le bon endroit, vérifier qu'ils répondent en < 3 s à « pourquoi ma décision a raté ? ».

## 3. Master : récompenses et progression lisibles (sans changer les règles)

- Récompenses existantes : badges, grade (Stagiaire → Responsable), rapport de semaine, palmarès,
  mails du patron. Vérifier qu'elles suivent le rythme du skill : **intrinsèque d'abord** (la bonne
  décision se comprend), extrinsèque ensuite (badge, score) ; un feedback de progrès après chaque
  journée (mail du soir déjà existant) et un objectif clair par jour (existe, `bandeau`).
- Ne pas ajouter de hasard de récompense (variable ratio) : le 1d6 existe déjà sur les effets, ne pas en
  rajouter.
- Anti-frustration (grille du skill) : une décision « ratée » doit sembler **juste** — le retour explique
  déjà la meilleure réponse et le pourquoi (`retour.mieux`) ; conforter ce texte, ne pas le changer de
  sens.

## 4. Vérifications

- `npm test` : aucune régression ; ajouter un contrôle « aide H contient les mots-clés attendus
  (glisser/clic, 1-4, Q, jauges) en FR et EN » si des textes changent.
- Test humain : un joueur novice (hors projet) joue la semaine 1 : atteint sa 3e décision en < 2 min
  sans aide extérieure, et dit à voix haute ce qu'il doit préserver (les 3 jauges). Noter 3 verbatim dans
  `notes.md`.
- `npm run build` vert ; FR/EN, animations réduites, mobile portrait vérifiés en Chromium ; `journal.md`.
