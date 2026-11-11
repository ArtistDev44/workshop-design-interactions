# Prompt 96 — Jeu « Nantes en régulation » : du game feel (juice) sur les décisions, via le skill `game-feel`

Demande d'origine (11/11/2026) :

> Il n'y a pas de poids pour le jeu. C'est plat comme jeu.

Skill à utiliser pour ce prompt : **`game-feel`**, installé par
`npx skills add https://github.com/gamedev-skills/awesome-gamedev-agent-skills --skill game-feel`
(déjà installé globalement : `~/.agents/skills/game-feel/`). Lire **`SKILL.md`** et
**`references/feedback-recipes.md`** avant toute modification, et s'y conformer :
feedback par « bundle » sur événements discrets, tiers de trauma (small 0,10-0,20 / medium 0,30-0,50 /
large 0,70-1,00), secousse = trauma² qui décroit en **temps réel**, hit-stop bref (< 0,15 s) qui ne bloque
pas les entrées, tout revient exactement à sa valeur de repos, flashs ≤ 3/s (WCAG 2.3.1), options
« reduce shake / reduce flash ».

Objectif : que chaque décision du joueur ait un **poids ressenti** — visuel, sonore, haptique — sans jamais
changer la simulation.

Règles :
- **Ne rien casser.** `game.js` (règles, effets, 1d6, jauges, fins, Q1–Q61) et les données réelles ne
  changent pas : le juice s'ajoute **par-dessus** la mécanique existante, comme le skill le prescrit
  (« shake moves the camera… never moves bodies or stalls gameplay logic »). `npm run build` et
  `npm test` verts après chaque lot.
- Fichiers concernés : `site/public/sketch.js` (draw, `decider()`), `panneau.js` (cartes de réponse),
  `feedback.js` (jauges eased + deltas flottants, tampon « SIGNALEMENT »), `confort.js` (sons),
  `glisser.js` si le prompt 94 est exécuté. FR + EN pour tout nouveau texte (`i18n.js`).
- Accessibilité : tout effet respecte `reduireAnimations` (préférence système existante) et reste
  désactivable ; aucun flash > 3/s ; les annonces `aria-live` existantes restent la source de vérité pour
  un lecteur d'écran. Le jeu reste jouable 100 % au clavier.
- Hors ligne, mobile portrait, 1920×1080 : inchangés.

## 1. Brancher le juice sur les événements discrets existants

Événements déjà émis par le jeu (ne pas en inventer de nouveaux dans `game.js`) :
- **décision prise** (`decider()` dans `sketch.js` : deltas connus) → tier selon `max|delta|` :
  ≥ 10 = large (trauma ~0,8, hit-stop ~0,10 s, flash jauge, pop du delta), ≥ 6 = medium (0,4, hit-stop
  0,05 s), sinon small (0,15, tick sonore seul) ;
- **dossier arrivé** (`nouveauDossier()` : tampon « SIGNALEMENT » déjà animé) → small/medium, pop du tampon ;
- **jauge sous 20** (état critique existant) → pulsation douce déjà en place, ne pas la durcir ;
- **dépôt d'une carte par glisser-déposer** (prompt 94, si présent) → impact medium (secousse + son) ;
- **fin de journée / sortie** → small (le fondu existe déjà).

## 2. Implémenter dans p5.js (pas de moteur : traduire les patterns du skill)

- **Secousse par trauma décroissant** : variable `TRAUMA` (0..1), `secousse(amp)` l'incrémente (clamp 1),
  décroissance en temps réel dans `draw()` ; déplacement = `trauma² × maxOffset × sin(t × fréquences
  distinctes)` (somme de sinus, **pas de random par image**), appliqué en `translate()` sur un
  `push()/pop()` autour du dessin (déjà amorcé au prompt 94 si exécuté), jamais sur la logique.
- **Hit-stop** : `timeScale` bref (0,05 pendant ≤ 0,12 s) restauré en temps réel, un seul propriétaire
  (un nouvel impact remplace le précédent) ; les entrées restent enregistrées pendant le freeze.
- **Squash & stretch / pops** : les cartes de réponse et le tampon « SIGNALEMENT » font un `pop`
  (scale 1,15 → 1,0 en ease-out-back ~180 ms) à l'apparition ; les deltas de jauges flottent déjà,
  leur donner un overshoot ease-out-back à l'apparition.
- **Son** : un canal par tier via `Confort.Son` (existe déjà : `clicAction`, `jauges`, `bip`) — ne pas
  ajouter de nouveaux fichiers audio, réutiliser/étendre les bips existants.

## 3. Toggles et limites (checklist du skill)

- `reduireAnimations` = « reduce motion » : trauma 0, pas de hit-stop, pops instantanés.
- Un réglage « intensité du feedback » (0-100 %) dans les paramètres existants (`confort.js`, touche
  paramètres) si simple à brancher, sinon documenter.
- Vérifier : deux décisions fortes à 30 ms d'affilée → timeScale revient à 1, trauma retombe à 0,
  chaque tween termine exactement à sa valeur de repos.

## 4. Vérifications

- `npm test` : ajouter dans `scripts/test-jeu.mjs` un contrôle du tier de trauma selon les deltas
  (fonction pure testable en `vm`) et l'absence de `[À COMPLÉTER]`.
- `npm run build` vert ; test manuel Chromium FR/EN, animations réduites ON/OFF : 5 décisions par clic,
  par touche 1-4 et par glisser-déposer (si prompt 94) — chaque décision « se lit » en < 100 ms,
  aucune nausée, aucune entrée perdue pendant le hit-stop, aucune erreur console.
- Mettre à jour `journal.md` (une ligne) et la doc `jeu/48-animations-feedback.md` si elle existe.
