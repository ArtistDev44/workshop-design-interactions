# 52 — Webcam du poste, détection de présence et sieste (prompt 57)

Code : `webcam.js` ; déclenchement de la sieste dans `immersion.js` (`avancerTemps`). Règles Q1–Q61,
`game.js` et malus de sieste (−5 si le réveil est raté) inchangés.

## Activation
- **Webcam pixel art posée sur le haut de l'écran** (objet du bureau : clic ou Tab puis Entrée) et option
  **Paramètres → Accessibilité → Webcam (présence)**, touche 5. **Désactivée par défaut** (opt-in),
  mémorisée. `getUserMedia({ video })` n'est appelé qu'à un geste : clic sur l'objet, réglage, ou — si le
  réglage était déjà activé — au premier clic ou à la première touche de la session, jamais au chargement.
- Refus ou absence de caméra : « Webcam indisponible : la sieste ne dépend que de l'inactivité » ; rien
  d'autre ne change.

## Détection de présence (locale)
- Toutes les 400 ms (hors `draw`), l'image est réduite à **48 × 27** dans un canevas hors écran ; on n'en lit
  que la **luminance de la zone centrale** et la **différence avec l'image précédente** (mouvement).
  L'élément vidéo n'est jamais ajouté à la page : aucune image affichée, enregistrée ni envoyée.
- **Écart au prompt, documenté** : le prompt demande « les deux valeurs sous leurs seuils ». Une pièce vide
  bien éclairée garde une luminance haute ; la sieste ne viendrait jamais. Règle retenue : **absent** si le
  mouvement reste sous le seuil (scène figée) **ou** si la zone centrale est presque noire (caméra masquée),
  et ce pendant **8 s** d'affilée. Une personne devant l'écran bouge toujours un peu.
- Absence de 8 s → **sieste** (même état que l'inactivité de 20 s du prompt 20 : paupières, « Z », bip
  triple à l'incident, « Se réveiller »). Au retour, rien de spécial : « Se réveiller » reste requis s'il y
  a un incident.

## Confidentialité
- LED rouge allumée sur la webcam du bureau et **« CAM »** avec un point rouge dans la barre des tâches tant
  que la caméra est active ; activation et coupure annoncées en `aria-live`. Couper (clic, réglage) arrête
  le flux (le voyant du navigateur s'éteint aussi).

## Vérifications
- `npm run build`, `npm test` (113 + 149 contrôles).
- Chromium avec une fausse caméra (`--use-fake-device-for-media-stream`) : clic sur la webcam → active
  (luminance 134, mouvement 13 : présent), aucun élément `<video>` dans la page ; absence simulée de 9 s →
  sieste ; retour → sieste maintenue ; « CAM » dans la barre des tâches ; second clic → coupée. Sans caméra :
  message de repli, réglage remis à « non ». Aucune erreur console.
- À tester par le groupe avec une vraie webcam : réglage des seuils selon l'éclairage de la salle.
