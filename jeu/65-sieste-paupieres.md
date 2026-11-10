# 65 — Sieste : paupières plein écran, fermeture et ouverture animées

Demande du 10/11/2026 : l'animation de sieste doit cacher tout le contenu (elle était dessinée dans la pièce,
sous l'écran du PC et l'interface, et ne fermait que 74 px en haut et en bas) ; l'ouverture et la fermeture
ont chacune une animation dédiée.

Code : `immersion.js` (`SOMMEIL`, `majSommeil`, `paupieres`, `dessinerSommeil`), `sketch.js` (ordre de dessin),
`guide.js`, `portrait.js`. Règles et `game.js` inchangés ; déclenchement de la sieste inchangé.

## Ordre de dessin
Pièce, moniteur, écran du PC, interface, boost, micro → **paupières** → panneau d'alarme « Se réveiller »
(l'alarme réveille, il doit rester visible) → fenêtres ouvertes par le joueur (menu, aide…) → transitions.
Yeux fermés (k > 0,5) : rien de caché n'est cliquable ; la bulle du guide est masquée. En portrait mobile,
les paupières couvrent tout le canevas, boutons compris.

## Animations
- **Fermeture (1,8 s)** : les paupières tombent jusqu'à 55 %, se relèvent (le joueur lutte, 38 %), puis se
  ferment entièrement. Bord en amande : les coins se ferment avant le centre ; bandes de 8 px, bord brun et cils.
- **Fermé** : noir complet, « Z » qui montent, « Zzz… vous somnolez au bureau. ».
- **Ouverture (1 s)** : entrouverture (45 %), un clignement (80 %), puis ouverture complète.
- Une animation interrompue repart de l'état courant (pas de saut).
- Animations réduites : fondu au noir de 0,4 s dans les deux sens, sans mouvement ; aucun flash.

## Vérifications
- `npm run build`, `npm test`.
- Chromium 1920×1080 : niveaux mesurés pendant la fermeture 0,54 → 0,39 → 0,47 → 0,78 → 1, ouverture
  0,46 → 0,76 → 0,23 → 0 ; alarme lisible au-dessus des paupières ; réveil → signalement. Animations réduites :
  fondu. Portrait 412 × 915 : tout couvert, 0 bouton actif. Aucune erreur console.
