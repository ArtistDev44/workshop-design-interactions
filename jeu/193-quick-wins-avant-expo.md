# 193 — Quick wins avant l'exposition : badge daltonien, bouton plein écran, musique hors ligne

Prompt : `prompts/193-jeu-quick-wins-avant-expo-badge-plein-ecran-musique.md` (écrit avant les prompts 170–192 ;
chaque constat a été revérifié dans le code du 12/11 avant correction).

## 1. Badge lisible dans chaque palette

- Déjà corrigé au prompt 133 par une liste en dur (`['protan', 'deutan']`) : remplacée par un calcul.
- `texteSurAplat(hex)` (`theme.js`) : blanc ou fond sombre du DS (`#0D0C0C`), le plus contrasté des deux. Utilisée
  par `accentDerive()` (prompt 176) et par `dsBadge()` (`ds.js`) : badges du menu d'applis (`menu-app.js`), pastilles
  du menu (`multitache.js`), journal, patron, community…
- Contrastes calculés (test `scripts/test-jeu.mjs`, bloc « Prompt 193 », pour les 4 palettes × erreur / succès /
  alerte / info) : normal erreur `#D10B00` + blanc ≈ 5,6:1 ; protan / deutan `#FF7A00` + sombre ≈ 7,5:1 ; tritan
  `#E8003D` + blanc ≈ 4,7:1 ; tous ≥ 4,5:1.

## 2. Bouton plein écran au menu principal

- Existait déjà : touche F partout (`basculerPleinEcran()`, `sketch.js`, prompt 133), interrupteur Paramètres → Écran
  (prompt 175), annonce sur `fullscreenchange`.
- Ajout : bouton carré à icône Lucide `maximize` / `minimize` dans la ligne du haut, à gauche de FR / EN, même
  hauteur (60 px), même style que l'icône « Installer » (`boutonCarreHaut`, `menu.js`). Infobulle et annonce
  « Plein écran (F) » / « Quitter le plein écran (F) » (EN : « Full screen (F) » / « Exit full screen (F) »), selon
  l'état réel (`pleinEcranActif()`).
- Ordre clavier : entrée `pleinEcran` de `EXTRAS_MENU`, juste avant `installer`. Absente si l'API Fullscreen n'existe
  pas (`pleinEcranPossible()`), et en mode exposition (`EXTRAS_MENU` vide, prompt 160) — la touche F y reste lue.
- Choix : le bouton n'est pas « à côté de Paramètres » dans la pile des cartes (le prompt 171 a fixé la pile et la
  ligne du haut) ; il rejoint les commandes système de la ligne du haut.

## 3. Musique hors ligne

- Constat confirmé : `sw.js` laissait passer toute requête `Range` au réseau (`return`), or le navigateur lit
  l'audio par `Range: bytes=0-` → muet hors ligne.
- `sw.js` (partie écrite à la main, hors des repères du générateur) : une requête `Range` est servie depuis le cache
  si le fichier y est, par une réponse 206 découpée dans le fichier complet (`reponsePartielle` : `début-fin`,
  `début-`, `-suffixe`, 416 hors limites, 200 si l'en-tête est illisible) ; sinon réseau.
- `scripts/generer-sw.mjs` : refuse de générer si aucun `audio/*.ogg|mp3` n'est précaché ou si `sw.js` ne sert plus
  les `Range` depuis le cache. Les 12 morceaux (6 × OGG + MP3) sont dans le précache.
- Repli (`confort.js`) : une erreur de chargement de l'élément audio bascule, pour la session, sur le morceau composé
  en WebAudio « origine » (`Musique.enPanne`).

## Vérifications

- Headless Chromium (service worker actif, cache installé, `setOffline(true)`, rechargement) : `lofi-softly.ogg` et
  `.mp3` atteignent `readyState = 4`, durée 261,6 s, saut à 30 s réussi ; page contrôlée par le SW ; aucune erreur.
- Capture du menu à 1920×1080 : bouton à gauche de FR / EN, rien ne chevauche.
- Non vérifié : PWA installée sur un vrai appareil, Safari / Firefox, capture en palette protan / deutan (contraste
  calculé à la place), audit des textes.
