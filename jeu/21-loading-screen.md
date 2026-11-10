# 21 — Écran de chargement et musique du menu (prompt 27)

Décisions verrouillées. L'écran clair ne clignote plus au chargement, et une musique de fond générée par le code accompagne le jeu dès le menu. Les décisions Q1–Q61 et la boucle de jeu ne changent pas.

Note de numérotation : le prompt demandait `jeu/20-loading-screen.md`, mais le n° 20 est déjà pris par la sortie du PC (prompt 26). Ce fichier prend donc le n° 21.

## 1. Écran de chargement (anti-flash)
- Dans `index.html`, un `<style>` inline placé avant la feuille externe et tous les scripts :
  - `html, body` sur fond sombre `#0c1016` (la teinte du fond autour de la pièce) ;
  - `<meta name="color-scheme" content="dark">`.
  - Résultat : le premier affichage n'est jamais clair. `style.css` reprend le même fond (l'ancien `#f5efe3` était à l'origine du flash).
- `#chargement` est en HTML/CSS pur et visible dès le premier affichage :
  - fond `#005AE1` (couleur *primary* de `design-system/DESIGN.md`) ;
  - pictogramme SVG inline (moniteur et ligne de bus, `crispEdges`), titre « Nantes en régulation », code « PXE-NTE001-G01-W01 » ;
  - aucune police ni image distante, aucun appel réseau.
- Accessibilité :
  - `role="status"`, `aria-live="polite"` ;
  - message bilingue statique « Chargement… · Loading… », remplacé dans `setup()` par `t('chargement.message')` dans la langue active ;
  - texte blanc sur `#005AE1` : contraste 5,9:1 (≥ 4,5:1).
- Masquage au premier `draw()` effectif (`masquerChargement()`, `sketch.js`) :
  - fondu CSS de 300 ms, puis `hidden` et `aria-hidden="true"` ;
  - avec animations réduites (`prefers-reduced-motion` ou réglage du jeu), masquage immédiat ; la `transition` est aussi coupée en CSS ;
  - `pointer-events: none` pendant le fondu : l'écran ne bloque jamais le jeu.

## 2. Musique de fond (`confort.js`, `Confort.Son.musique`)
- 100 % WebAudio, aucun fichier audio.
  - Quatre accords tournent en boucle : la mineur 7, fa majeur 7, do majeur, sol majeur.
  - Arpège de 8 croches par mesure à 72 BPM, en onde triangle passée dans un passe-bas à 1 400 Hz, avec une basse sinus tenue sur chaque accord.
  - Volume du bus : 0,05, avec un fondu d'entrée de 2 s.
- L'ordonnanceur programme les notes à l'avance : `setInterval` toutes les 100 ms, 300 ms d'avance. Il se recale si l'onglet est passé en arrière-plan.
- Démarrage au premier geste du joueur (clic ou touche), dès l'accueil, à cause des règles d'autoplay. `Son.demarrer()` est déjà appelé à chaque geste ; la musique ne se lance qu'une fois. Elle continue au bureau et en jeu.
- Interrupteur : le même que le son (`Confort.Reglages.son`, touche M, Paramètres), persistant en `localStorage`. Le couper arrête la musique avec un fondu de 200 ms ; le réactiver la relance.
- Libellé des Paramètres : « Son (musique, ambiance, bips) » / « Sound (music, ambience, beeps) ».

## Vérifications
- `npm run build` OK.
- Test automatisé (Chromium, 1920×1080), sans erreur console, en FR, en EN (`?lang=en`) et avec `prefers-reduced-motion` :
  - capture à 30 ms : écran bleu et logo, sans flash clair ;
  - écran de chargement masqué (`hidden`, `aria-hidden`) au premier rendu ;
  - aucune musique avant le premier geste, musique lancée (`AudioContext` *running*) après Tab ;
  - M coupe la musique et persiste `son:false`, un second M la relance.
