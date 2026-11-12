# Prompt 193 — Jeu : quick wins avant exposition — badge daltonien lisible, bouton plein écran (F), musique hors ligne

Demande d'origine (12/11/2026) : audit `audit-2026-11-12.md`, sections 4 et 6. Trois correctifs mineurs,
chacun en quelques lignes, sans toucher aux règles du jeu.

## À faire

### 1. Badge lisible en palette daltonienne (`ds.js` / `accessibilite.js`)

- Constat : le badge (blanc sur `#FF7A00`) a un contraste de 2,61:1 en palette protan/deutan.
- **Correction** : quand la palette active n'est pas la palette normale, le texte du badge passe en
  `#0D0C0C` (sombre) sur le même fond orange. Contraste vérifié ≥ 4,5:1.
- Vérifier dans `accessibilite.js` (`PALETTES`) que chaque palette non normale déclenche bien ce changement.

### 2. Bouton « Plein écran » dans le menu principal (`menu.js`)

- Constat : le plein écran n'est accessible que par F11 ou `--kiosk` du navigateur. Aucun bouton dans le jeu.
- **Correction** : dans le menu principal, ajouter un bouton « Plein écran (F) » à côté de « Paramètres »
  (même style, même rangée). La touche **F** bascule le plein écran à tout moment (menu, bureau, poste) via
  `document.documentElement.requestFullscreen()` / `document.exitFullscreen()`.
- Gérer l'état : si déjà en plein écran, le bouton/touche F quitte le plein écran.
- Écouter `fullscreenchange` pour mettre à jour le libellé du bouton (« Plein écran (F) » ↔
  « Quitter le plein écran (F) »), FR et EN.
- Ne pas entrer en plein écran automatiquement (restriction navigateur : il faut un geste utilisateur).

### 3. Musique hors ligne (`sw.js` / `confort.js`)

- Constat : la musique en fichier (OGG/MP3) est probablement muette hors ligne car les requêtes partielles
  (Range) ne passent pas par le cache du service worker.
- **Correction** : dans `site/public/sw.js`, pour les requêtes vers `/audio/*.ogg` et `/audio/*.mp3`, répondre
  d'abord par le cache complet (`caches.match(req, { ignoreSearch: true })`), et si le cache contient le
  fichier, le servir tel quel (pas de requête Range partielle). Alternative si le cache ne suffit pas :
  au premier chargement en ligne, pré-télécharger chaque morceau écouté dans le Cache API.
- **Test** : installer la PWA, couper le réseau, recharger, lancer une partie, vérifier que la musique
  démarre (ou, à défaut, que les morceaux synthétisés WebAudio prennent le relais automatiquement).
- Si après test la musique fichier reste muette hors ligne : définir les 4 morceaux WebAudio comme
  **musique par défaut en mode hors ligne** (détection `navigator.onLine === false` au lancement).

## Vérifications

- `npm run build`, `npm test` verts.
- Badge : capture en palette protan et deutan, contraste mesuré ≥ 4,5:1.
- Plein écran : F depuis le menu, le bureau et le poste entre/sort du plein écran ; le bouton du menu
  reflète l'état. `fullscreenchange` géré, pas d'erreur console.
- Hors ligne : PWA installée, réseau coupé, musique qui joue (fichier ou WebAudio selon le résultat du test).
- Audit des textes (`?audit=textes`) à 0 défaut A–D (nouveaux libellés FR/EN).
- Doc : `jeu/193-quick-wins-avant-expo.md` listée dans `jeu/README.md`. `prompts/README.md` (ligne 193),
  `journal.md` au push.

## Hors périmètre (ne pas faire)

- Ne pas modifier `game.js` ni les règles Q1–Q61.
- Ne pas changer la direction artistique (palette, polices).
- Ne pas ajouter d'autres boutons au menu (juste le plein écran).
