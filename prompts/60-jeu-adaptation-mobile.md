# Prompt 60 — Jeu « Nantes en régulation », étape 44 : adaptation complète à la vue mobile (ordinateur inchangé)

Demande d'origine (10/11/2026) :

> Rendre le jeu complètement adapté à la vue mobile, sans changer l'apparence sur ordinateur.

Aujourd'hui, le canevas est fixe en 1920×1080 et mis à l'échelle en CSS (ratio 16:9 conservé,
`style.css`) : sur un téléphone portrait, l'image devient minuscule et les cibles illisibles.
Le touch basique existe déjà (un appui = un clic, `touchStarted`), mais il n'y a ni défilement,
ni mise en page verticale, ni cibles agrandies.

Direction retenue (10/11/2026) : **deux mises en page selon le terminal** — 1920×1080 inchangé
sur ordinateur (souris fine + écran large), mise en page mobile dédiée (canvas logique
1080×1920 en portrait, panneaux empilés, gestes tactiles) sur téléphone. Aucun changement de
règle : `game.js` (Q1–Q61, effets, dés) et `test-jeu.mjs` ne sont pas touchés.

## Attendu
1. **Détection du terminal** : `estMobile()` (dans `confort.js` ou `sketch.js`) =
   `matchMedia('(pointer: coarse)').matches` **et** `min(windowWidth, windowHeight) < 900`
   (ou ratio portrait) ; réévaluée à chaque `windowResized`. Sur ordinateur (pointer fin,
   écran ≥ 900 px de petit côté) : **aucun changement visible** — mêmes coordonnées 1920×1080,
   mêmes captures de référence.
2. **Canvas adaptatif** : en mobile, `createCanvas(1080, 1920)` (L/H dynamiques, `resizeCanvas`
   dans `windowResized`) ; en desktop, 1920×1080 comme aujourd'hui. CSS : en mobile le canevas
   occupe toute la fenêtre (`width: 100vw; height: 100dvh`, ratio conservé par le canvas lui-même).
3. **Mise en page mobile de la salle de contrôle** (dessin conditionnel, ex. `siMobile()`) :
   panneaux empilés verticalement — **carte/lignes en haut**, **dossier + sources (5–8) au
   milieu**, **compteur + 4 actions en bas** ; défilement vertical du panneau central par swipe.
   Les textes gardent ≥ 20 px logiques ; cibles tactiles ≥ 44×44 px logiques (boutons d'action,
   sources, objets de la pièce). En paysage mobile, le 16:9 est letterboxé mais les cibles
   restent ≥ 44 px.
4. **Gestes tactiles** : tap = clic (existant) ; **swipe haut** au poste = molette (s'installer
   au PC, prompt 38) ; **swipe vertical** = défilement des panneaux/applis ; **tap long** =
   infobulle (remplace le survol souris, inexistant au doigt) ; pinch et double-tap zoom
   désactivés (`touch-action: none` sur le canevas en mobile, `user-scalable=no`).
   La caméra fausse 3D du bureau (prompt 25) est désactivée au doigt (déjà le cas :
   `sourisDansCanevas = false`) : les objets de la pièce (téléphone, fenêtre, horloge, sablier,
   tasse, lampe) sont des **grosses cibles tap**.
5. **index.html** : meta viewport complété (`width=device-width, initial-scale=1,
   maximum-scale=1, user-scalable=no, viewport-fit=cover`) ; `apple-mobile-web-app-capable` ;
   orientation non bloquée (portrait **et** paysage supportés).
6. **Clavier virtuel** : le journal de bord (`textarea` HTML, prompt 47) et toute saisie HTML
   doivent rester utilisables quand le clavier virtuel s'ouvre : écouter `visualViewport`,
   remonter le champ dans la zone visible, sans casser la mise en page.
7. **Performance mobile** : `pixelDensity(1)` conservé ; en mobile, réduire de moitié les
   particules (pluie, poussières) et les ombres portées ; rien de bloquant à 30 ips sur un
   téléphone milieu de gamme.
8. **Accessibilité & i18n** : FR + EN pour tous les nouveaux textes (ex. « Glissez pour
   défiler ») ; `aria-live` conservé ; focus visible au tap ; contraste ≥ 4,5:1 ;
   `prefers-reduced-motion` respecté (pas de parallaxe au geste).
9. **Règles inchangées** : `game.js`, jauges, compteur, dés, fins (Q1–Q61) intacts ;
   `test-jeu.mjs` reste vert sans modification de la logique (les tests simulent du desktop).

## Vérifications
- `npm run build`, `npm test` (inchangés et verts).
- Émulateur Chromium mobile (ex. 390×844, tactile, portrait) sans erreur console : menu →
  bureau (tap sur les objets) → PC → partie jouable de bout en bout (enquête sources 5–8,
  compteur, 4 actions, narration, rapport papier) ; swipe haut au poste ; swipe de défilement ;
  journal de bord au clavier virtuel ; paysage testé.
- Desktop 1920×1080, souris : captures comparées à `rendu/` — **identiques** (aucun changement
  d'apparence) ; `estMobile()` faux.
- FR + EN ; `prefers-reduced-motion`. Documenter dans `jeu/53-…`. Fusion `main` sur demande.

## Découpage (10/11/2026, comme le prévoit le prompt 58 pour un prompt trop gros)
- **60a — fondations mobiles** (fait) : `estMobile()`, viewport, gestes (tap au relâchement, appui long =
  info-bulle, swipe = molette), paysage mobile plein écran (`100dvh`), message portrait HTML avec
  « Continuer en portrait », clavier virtuel (`visualViewport`), particules et ombres allégées, textes
  tactiles ; ordinateur inchangé.
- **60b — mise en page portrait dédiée** (fait, par recomposition : voir `jeu/54-mobile-portrait.md`) — plan initial : `L` / `H` dynamiques (aujourd'hui constantes
  1920 × 1080 dont dérivent tous les rectangles), canevas 1080 × 1920, panneaux empilés de l'appli
  Régulation (carte, dossier + sources, compteur + actions), défilement vertical, fenêtres bornées à la
  largeur, bureau recadré en hauteur ; captures desktop comparées à `rendu/`.

