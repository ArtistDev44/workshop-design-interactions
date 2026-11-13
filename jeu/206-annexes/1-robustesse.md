# Audit axe 1 : robustesse du code du jeu

Dépôt audité : `wt-205` sur origin/main, commit f07351b. Lecture seule : aucun fichier du dépôt n'a été modifié.
Date : 13/11/2026. Auditeur : axe 1 (robustesse). Périmètre : `site/public/*.js` du jeu et `site/public/index.html`.

## Méthode

- Lecture ciblée du code : sauvegarde.js, game.js (instantané et restauration), sketch.js, immersion.js, multitache.js, journee.js, soir.js, taches.js, confort.js, micro.js, webcam.js, expo.js, sw.js, mobile.js.
- Parties sans interface (playwright-core 1.65 du cache npx, Chromium headless shell 1248, `python3 -m http.server 8401`, serveur arrêté à la fin). Scripts dans le dossier de scratch `h1/` :
  - `bot.mjs` : semaine complète jouée par un bot (sans chrono, avec défi chrono) et une partie « singe » (clics au hasard sur les boutons de l'image courante). Chaque partie a fini les 5 jours (environ 2 min réelles grâce au ×100), avec **0 erreur** console ou pageerror et des jauges toujours finies.
  - `corrompu.mjs` : stockage corrompu (JSON cassé dans toutes les clés `pxe-nte001*`), JSON valide mais du mauvais type, localStorage qui lève à chaque accès (bloqué) ou à chaque écriture (quota plein), sauvegarde reprise après rechargement, et 7 sauvegardes altérées (paquet avec null, interface invalide, horloge 1e12, version 1, sans date…).
  - `rotation.mjs` : 412 × 915 tactile, 6 rotations et redimensionnements pendant une partie, avec des tapotements.
  - `chrono.mjs`, `plaintes.mjs`, `micro.mjs`, `cam.mjs`, `double.mjs`, `p5noms.mjs` : tests ciblés, détaillés dans chaque constat.

## Constats

### R1. À la reprise d'une sauvegarde, les plaintes Community en attente expirent aussitôt (réputation perdue)
- **Fichiers** : `site/public/game.js:359` (instantané : `depuis: p.depuis - maintenant`), `site/public/game.js:412` (restauration : `+ maintenant`), `site/public/sauvegarde.js:107-110` (`maintenant = millis()`), `site/public/immersion.js:265` (`tempsPlaintes = TEMPS_EQUIPES.actif`)
- **Gravité** : majeur. **Effort** : S. **Preuve** : vu en jeu et mesuré.
- **Cause** : `p.depuis` est daté sur `TEMPS_EQUIPES.actif` (temps de jeu actif), mais l'instantané le rend relatif à `millis()` (temps réel depuis le chargement). Le décalage `millis() − actif` grossit avec tout le temps suspendu (menu titre, lecture d'un signalement, aide, SMS, démarrage du PC). Les équipes sont recalées (`recalerEquipes`), pas les plaintes.
- **Scénario mesuré** : 50 s sur l'écran titre, puis partie jusqu'à la première plainte (0,12 s écoulée sur 45 s), sauvegarde, rechargement, reprise. Moins de 1,5 s après la reprise, la plainte est `expire` et la réputation passe de 52 à 49. Sur une partie courte sans attente (26 s), le décalage mesuré est déjà de 17,8 s. Sur une semaine jouée par le bot, il atteint 78 s, plus que le délai de 45 s (`REGLAGES.community.delaiMs`).
- **Correction** : dans `instantane`/`restaurerInstantane`, rendre `depuis` relatif à `tempsPlaintes()` (comme `recalerEquipes` le fait pour les équipes), ou le stocker en temps écoulé.

### R2. Micro : appui, relâchement puis nouvel appui pendant la demande d'autorisation, et le micro reste ouvert avec une erreur toutes les 50 ms
- **Fichiers** : `site/public/micro.js:68-94` (`demarrerMicro` : `MICRO.ouvert` testé avant l'`await getUserMedia`, `setInterval` sans `clearInterval` préalable), `site/public/micro.js:96-108` (`arreterMicro` n'arrête que le dernier flux)
- **Gravité** : majeur (vie privée, et la console se remplit). **Effort** : S. **Preuve** : mesuré (Chromium avec faux périphérique, `getUserMedia` retardé de 300 ms pour simuler la fenêtre d'autorisation).
- **Scénario** : appui, relâchement, nouvel appui pendant que le navigateur demande l'autorisation (push-to-talk, micro activé par défaut, `confort.js:32`). Deux `getUserMedia` aboutissent, et deux minuteries d'analyse démarrent. Au relâchement final, il reste **1 piste micro `live`** (le voyant du navigateur reste allumé) et `analyserMicro` lève `Cannot read properties of null (reading 'getFloatTimeDomainData')` toutes les 50 ms (26 erreurs en 1,5 s, sans fin).
- **Correction** : un jeton de demande (ignorer et arrêter un flux arrivé après un `arreterMicro`), et `clearInterval` avant chaque `setInterval`.

### R3. Webcam : deux clics pendant l'autorisation, et la caméra reste allumée après « couper »
- **Fichiers** : `site/public/webcam.js:27-56` (`CAM.active` n'est posé qu'après les `await`), `site/public/webcam.js:57-66` (`couperWebcam` n'arrête que `CAM.flux`, le dernier flux)
- **Gravité** : majeur (vie privée ; la webcam est en opt-in, `webcam: false` par défaut). **Effort** : S. **Preuve** : mesuré (même banc que R2).
- **Scénario** : `clicWebcam()` deux fois de suite (double clic sur l'objet webcam pendant la demande), puis un clic pour couper. On a 2 flux ouverts, `CAM.active === false`, et **1 piste vidéo encore `live`** : la caméra reste allumée sans que le jeu le sache. Une minuterie `analyserImage` est aussi perdue.
- **Correction** : marquer « activation en cours » avant l'`await` (et ignorer le second clic), arrêter tout flux reçu après une coupure.

### R4. Défi chrono : le compteur d'un signalement continue pendant l'aide et le menu, alors que l'horloge est figée
- **Fichiers** : `site/public/multitache.js:50-52` (`resteActif` : `millis() - debutCompteur`), `site/public/multitache.js:136-147` (`majMultitache` ne s'arrête que sur `enPause`), `site/public/sketch.js:660-681`, `site/public/immersion.js:252-253` (`tempsSuspendu` inclut `fenetre === 'aide'` et `'menu'`)
- **Gravité** : mineur (le mode défi chrono est optionnel ; l'écart peut être voulu, puisque la règle Q13 interdit la pause pendant un compteur). **Effort** : S. **Preuve** : mesuré.
- **Scénario mesuré** : défi chrono, signalement pris (compteur de 60 s), aide ouverte 15 s. L'horloge de jeu reste à 604,009 min, mais le compteur passe de 59,9 s à 44,9 s. Laissée ouverte plus de 60 s, l'aide fait expirer le dossier en « non traité » derrière la fenêtre. Même mécanisme quand l'onglet est masqué : `rAF` est suspendu, `millis()` continue, et au retour tous les compteurs actifs expirent d'un coup. Aucun écouteur `visibilitychange` ne met le jeu en pause : le seul, dans `sauvegarde.js:550`, ne fait que sauvegarder.
- **Correction** : à arbitrer. Soit décaler `debutCompteur` et `a.debut` du temps passé en `tempsSuspendu()` (comme `figerCompteurRalenti`), soit dire en jeu que l'aide ne met pas le chrono en pause.

### R5. Carrière stockée avec `jours` qui n'est pas un tableau : exception à chaque fin de journée
- **Fichiers** : `site/public/taches.js:121-127` (`Object.assign(carriereVide(), c)` sans contrôle de type), `site/public/taches.js:197` (`c.jours.includes`)
- **Gravité** : mineur (il faut un stockage altéré ou une ancienne forme de la clé). **Effort** : S. **Preuve** : vu en jeu (`corrompu.mjs types`).
- **Scénario** : `pxe-nte001-carriere = {"jours":{"0":1},…}` donne `TypeError: c.jours.includes is not a function` dans `validerRapport`, à chaque rapport du soir. L'XP et les badges du jour ne sont pas versés, et le récapitulatif `j.recap` manque. Les autres clés de mauvais type (réglages, histoire, annonces, bilans, langue, couleur, indicateurs) sont bien tolérées.
- **Correction** : normaliser après lecture (`Array.isArray(c.jours) ? … : []`, `typeof c.badges === 'object'`, `Number(c.xp) || 0`).

### R6. Service worker : après un déploiement, le premier chargement mélange `index.html` récent et scripts anciens
- **Fichiers** : `site/public/sw.js:265-275` (navigation réseau d'abord), `site/public/sw.js:277-289` (scripts : cache d'abord, ancien `VERSION`), `site/public/index.html:133-198` (49 scripts classiques à globales partagées)
- **Gravité** : mineur. **Effort** : M. **Preuve** : lu dans le code, non reproduit.
- **Scénario** : un déploiement ajoute un fichier (comme `personnages.js` au prompt 189) ou en retire un. La page HTML arrive du réseau, mais les autres scripts sortent de l'ancien cache tant que le nouveau SW n'est pas activé. Un script neuf peut alors appeler une fonction absente de l'ancien `game.js`, ou un ancien script une fonction d'un fichier retiré, d'où des `ReferenceError` jusqu'au rechargement suivant.
- **Correction** : servir aussi les `.js` en réseau d'abord pour la même origine (repli sur le cache), ou versionner les URL des scripts (`?v=VERSION` avec un `cache.match` sans `ignoreSearch`).

### R7. Jauges : aucune garde contre NaN, et une jauge NaN rendrait la partie insauvegardable sans prévenir
- **Fichiers** : `site/public/game.js:1246-1247` (`Math.max(0, Math.min(100, jauge + d[k]))` laisse passer NaN), `site/public/sauvegarde.js:241` (valider refuse une jauge non numérique)
- **Gravité** : mineur (préventif : aucune NaN observée sur 3 semaines complètes et une partie singe, avec un contrôle à chaque tick). **Effort** : S. **Preuve** : lu dans le code.
- **Scénario** : un effet de données mal saisi (`sv.delta`, `effets` d'une réponse) qui vaut `undefined` passe la jauge à NaN pour toute la partie. `construire()` écrit alors `null`, `lister()` rejette l'emplacement, et la partie disparaît de « Reprendre » sans message.
- **Correction** : `const v = Number(d[k]); if (!Number.isFinite(v)) return;` dans `appliquerDeltas`.

## Ce qui est sain (vérifié)

- **Stockage corrompu ou indisponible** : JSON cassé dans toutes les clés, localStorage qui lève à chaque accès ou à chaque écriture. Le jeu charge, ouvre « Reprendre », lance et joue 45 s sans erreur. Le toast « Sauvegarde impossible… » s'affiche une fois. Tous les `JSON.parse` du jeu sont dans un `try/catch`.
- **Sauvegardes** : la validation stricte (`sauvegarde.js:229-251`) écarte les emplacements invalides. La migration version 1 vers version 2 se fait sur place, sans effacement préalable. Les 7 variantes altérées testées se reprennent ou sont ignorées sans exception. L'export et l'import n'utilisent jamais `eval`.
- **Partie complète** : 5 jours joués par le bot, avec et sans défi chrono, plus une partie singe, ont donné 0 pageerror, 0 console.error et des jauges toujours finies. L'horloge est bornée par image (`dt ≤ 250 ms`, `immersion.js:273`), donc un onglet masqué ne fait pas sauter la journée.
- **Rotation et redimensionnement mobiles** : 6 bascules entre portrait, paysage et bureau pendant une partie, sans erreur. Le canevas portrait n'est créé qu'une fois.
- **Globales** : aucune déclaration de premier niveau en double entre les 49 scripts, ni conflit `function`/`const` (vérifié sur 1 369 noms). La seule collision avec p5 est `PORTRAIT` (`portrait.js:13`), sans effet observé.
- **Double lancement** (`lancerNouvellePartie()` deux fois) : aucune erreur, état cohérent. Les gardes de phase de `decider`, `continuer` et `basculerPause` évitent les doubles actions.
- **Minuteries audio** (`confort.js`) : une garde à chaque démarrage, nettoyage à l'arrêt. Le mode expo purge et recharge proprement.

## Scripts et sorties

Dans `/tmp/claude-1000/-home-guillaume-ESD-Docs-design-interaction-workshop-design-interactions/88dcdbf9-0df7-4d43-8294-89b0b713b755/scratchpad/h1/` : `bot.mjs`, `corrompu.mjs` (scénarios garbage, types, bloque, plein, reprise), `chrono.mjs`, `plaintes.mjs`, `micro.mjs`, `cam.mjs`, `rotation.mjs`, `double.mjs`, `p5noms.mjs`, et les sorties `*.txt`.
