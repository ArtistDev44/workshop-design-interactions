# 92 — Game feel : le poids des décisions (prompt 96, skill `game-feel`)

Skill appliqué : `~/.claude/skills/game-feel/` (`SKILL.md` et `references/feedback-recipes.md`) :
- bundles par tier sur des événements discrets ;
- secousse = trauma² qui décroît en temps réel ;
- hit-stop court à propriétaire unique ;
- ease-out-back pour les pops ;
- tout revient à sa valeur de repos ;
- options pour réduire.

Le juice s'ajoute par-dessus la mécanique : `game.js` n'est pas modifié (Q1–Q61, effets, 1d6, jauges, fins).

Code :
- `site/public/juice.js` (nouveau) : `Juice` en logique pure, testée en vm, et `feedback(tier)` ;
- branchements : `sketch.js` (`decider`, `nouveauDossier`, secousse autour de `composerVue`), `immersion.js` (hit-stop sur l'horloge de jeu), `glisser.js` (dépôt), `soir.js` (sortie), `panneau.js` (pop des cartes), `feedback.js` (tampon, deltas, flash de jauge), `accessibilite.js` et `confort.js` (réglage) ;
- `glisser.js` perd son ancienne secousse (prompt 94), remplacée par `Juice`.

## Événements et tiers

| Événement (existant) | Tier | Bundle |
|---|---|---|
| Décision, max \|delta\| ≥ 10 | large | trauma 0,8, hit-stop 0,10 s, flash de jauge, delta qui dépasse puis se pose, signal grave existant (`consequence`) |
| Décision, ≥ 6 | medium | trauma 0,4, hit-stop 0,05 s, flash de jauge, bip « choix » |
| Décision, < 6 | small | trauma 0,15, clic |
| Dossier arrivé (`nouveauDossier`) | small | tampon « SIGNALEMENT » et cartes de réponse en pop |
| Carte déposée (prompt 94) | medium | s'ajoute au tier de la décision |
| Sortie du bureau | small | le fondu existe déjà |
| Jauge sous 20 | — | pulsation douce existante, inchangée |

## Implémentation p5.js
- **Secousse.**
  - `E.trauma` (0..1) s'additionne, borné à 1, et décroît de 1,2 par seconde réelle.
  - Décalage = trauma² × (14 px, 9 px) × somme de sinus à fréquences distinctes (aucun hasard par image).
  - Elle est appliquée par `translate()` autour de `composerVue()` : la vue bouge, les fenêtres et la logique restent fixes.
  - Le décalage revient exactement à 0.
- **Hit-stop.**
  - Échelle 0,05 sur l'horloge de jeu (et l'horloge des équipes du prompt 95), restaurée en temps réel.
  - Le plus récent en est le seul propriétaire : deux impacts à 30 ms laissent l'échelle à 0,05 jusqu'à la fin du second.
  - Les entrées ne sont jamais bloquées.
- **Pops.**
  - Ease-out-back de 1,15 à 1 en 180 ms (environ 10 % de dépassement), exactement 1 ensuite.
  - Cartes de réponse décalées de 50 ms ; tampon « SIGNALEMENT » de 1,6 à 1 ; deltas de jauges qui dépassent puis se posent.
- **Sons** : uniquement des sons existants (`clic`, `bip('choix')`, `bip('consequence')`), sans nouveau fichier.

## Accessibilité
- Animations réduites : trauma 0, pas de hit-stop, pops instantanés.
- Réglage « Intensité du feedback (secousse) » à 100, 50 ou 0 %, dans la fenêtre Accessibilité (touche 6). Les lignes sont passées de 82 à 70 px pour l'accueillir.
- Flash de jauge : un seul de 220 ms par décision moyenne ou forte, donc sous la limite de 3 par seconde (WCAG 2.3.1).
- Les annonces `aria-live` restent la source pour les lecteurs d'écran. Le jeu reste jouable au clavier.

## Vérifications
- `npm test` passe : 442 contrôles smoke et 512 contrôles du jeu. Contrôles du prompt 96 :
  - tiers selon les deltas ;
  - trauma borné ;
  - hit-stop à deux impacts sur 30 ms ;
  - retour exact au repos en moins de 1 / décroissance ;
  - pops qui dépassent puis finissent à 1 ;
  - mouvement réduit et intensité 0 / 50 % ;
  - `juice.js` sans accès à `Jeu` ;
  - branchements et clé FR / EN.
- Chromium, animations normales puis réduites : décisions par touche, clic et glisser-déposer.
  - Le trauma maximal suit le tier : environ 0,63 mesuré pour large, 0,3 pour medium.
  - Retour au repos à chaque fois ; rien avec les animations réduites.
  - Aucune erreur de console (le tier large appelait d'abord `Son.signal` avec une clé au lieu d'un objet ; corrigé en `bip('consequence')`).
- Audit des textes : 0 défaut A à D.
- **Ressenti à faire par un humain** (le hit se lit-il ? nausée ? entrées pendant le gel ?) : [À COMPLÉTER].
