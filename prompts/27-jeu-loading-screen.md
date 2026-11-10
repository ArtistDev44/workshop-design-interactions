# Prompt 27 — Jeu « Nantes en régulation », étape 14 : écran de chargement + musique du menu

Objectif : supprimer le **clignotement au chargement** (la fenêtre s'affiche d'abord en
mode clair, puis bascule en mode sombre quand l'API/CSS charge) en ajoutant un **écran
de chargement** statique dès le premier affichage — fond uni (bleu) + logo, comme sur le
site de Loann — qui disparaît ensuite pour laisser place au jeu, **avec une musique de
fond dès le menu**. Sans toucher aux décisions verrouillées Q1–Q61 ni à la boucle de jeu.

S'appuie sur les prompts 14–26 (bureau, immersion, i18n, vue 3D, sorties du PC).

Fichiers concernés : `site/public/` (`index.html`, `style.css`, `sketch.js`,
`confort.js` pour le son, `i18n.js` pour les nouveaux textes), plus une mise à jour de
`jeu/` et `journal.md`.

Règles absolues : aucun fichier audio/image binaire ajouté (la musique est **générée par
le code** en WebAudio, tout reste local et fonctionne hors ligne) ; tout nouveau texte
passe par `t(...)` (prompt 24) ; aucun secret dans le code.

## 1. Écran de chargement statique (anti-flash)

- Dans `index.html`, avant tout script : un élément `#chargement` en HTML/CSS pur,
  visible par défaut, couvrant tout l'écran — **fond uni couleur primaire/bleu du design
  system** (`design-system/DESIGN.md`) + logo/titre du jeu (« Nantes en régulation —
  PXE-NTE001-G01-W01 », typographie du design system, éventuellement un petit pictogramme
  dessiné en CSS/SVG inline). Aucun appel réseau.
- Le `body` a un **fond sombre dès le départ** (style inline ou classe dans `style.css`
  appliquée avant le premier paint) : plus aucun flash clair → sombre quand le CSS/API
  se charge.
- Dès que p5 est prêt (premier `draw()` effectif de `sketch.js`), masquer
  `#chargement` par un fondu court (~300 ms) ; si `prefers-reduced-motion`, masquage
  immédiat sans fondu. Ne jamais laisser l'écran de chargement bloquer l'accès au jeu.
- Le chargement reste local : p5.min.js, données `data/*.js` et fallback sont servis
  depuis le dépôt, le jeu fonctionne ouvert par double clic et hors ligne.

## 2. Musique de fond dès le menu

- Ajouter une **boucle musicale de fond légère**, générée par le code en WebAudio dans
  `confort.js` (extension de `Confort.Son`, qui ne fait aujourd'hui que des bips) :
  quelques notes/arpèges simples, tempo calme, boucle infinie, volume faible.
- Démarrage : à l'**écran d'accueil**, dès le **premier geste utilisateur** (clic ou
  touche — requis par les politiques d'autoplay des navigateurs), et non au chargement
  de la page. La musique joue aussi au bureau et en jeu, de manière discrète.
- Respect du réglage existant **Son (M)** (`Confort.Reglages.son`, prompt 18) : la musique
  suit le même interrupteur, avec persistance `localStorage` ; le menu Paramètres affiche
  l'état actuel.
- `prefers-reduced-motion` n'affecte pas l'audio, mais aucun nouvel effet visuel flashy
  n'est ajouté autour de la musique.
- Aucun fichier `.mp3`/`.ogg` : 100 % WebAudio, donc aucun poids ajouté et fonctionne
  hors ligne.

## 3. Textes et accessibilité

- Textes ajoutés (ex. état « chargement… », libellé son dans les paramètres) via `t(...)`
  dans `i18n.js`, FR + EN.
- `#chargement` a un `role="status"` / texte lisible par les lecteurs d'écran
  (`t('chargement.message')`, ex. « Chargement… »), retiré ou masqué (`aria-hidden`)
  une fois le jeu prêt.
- Contraste ≥ 4,5:1 du logo/texte sur le fond bleu ; aucun flash > 3/s ; clavier seul
  fonctionne dès l'accueil.

## 4. Vérifications

- `npm run build` dans `site/`.
- Tester : premier chargement (fond sombre immédiat, écran de chargement bleu + logo,
  disparition au premier écran du jeu, **aucun flash clair→sombre**), rechargement,
  `prefers-reduced-motion` (pas de fondu), musique au premier geste à l'accueil (et
  toggle M on/off avec persistance), hors ligne (fallback + musique OK), double clic
  local, clavier seul, 1920×1080, FR + EN, contraste ≥ 4,5:1.
- Aucune régression Q1–Q61 ni des prompts 14–26 (partie complète rejouée).
- Documenter dans `jeu/20-loading-screen.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-27-loading-screen`. À chaque push : entrée en tête de `journal.md`.
  Ne pas fusionner dans `main` sans demande.
