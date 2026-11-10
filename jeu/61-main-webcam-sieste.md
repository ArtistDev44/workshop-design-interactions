# 61 — Une main devant la webcam lance ou interrompt la sieste (prompt 67)

Code : `webcam.js` (`partPeau`, `detecterMain`, `basculerSiesteMain`), `immersion.js`. Sans bibliothèque ni
réseau ; règles Q1–Q61 inchangées.

## Reconnaissance de la main (locale)
- Chaque image (48 × 27, jamais affichée ni enregistrée) : part des pixels **couleur peau** en YCbCr
  (Cb 77–127, Cr 133–173, seuils classiques, valables pour une large gamme de teintes de peau).
- Le visage, à distance normale, occupe une part stable : c'est le **niveau de base**, suivi lentement.
- **Main reconnue** quand la part de peau bondit d'au moins 15 points au-dessus de ce niveau, dépasse 25 % de
  l'image, avec du mouvement (≥ 8 % de l'image) : une main levée près de la caméra.
- Anti-rebond : 2 s, et il faut **retirer la main** avant le geste suivant.

## Effet
- Éveillé → **la sieste se lance** (paupières, « Z »), y compris au poste (on se lève).
- Endormi → **la sieste s'interrompt** ; pendant le réveil (après le bip d'un incident), la main vaut
  « Se réveiller ».
- La LED de la webcam du bureau passe **au vert** une seconde quand une main est reconnue ; annonce `aria-live`.
- L'**absence** devant la caméra ne déclenche plus la sieste (prompt 64 remplacé). La sieste par inactivité
  (20 s sans geste) reste pour qui joue sans webcam.

## Limites
- Détection par la couleur : un fond beige ou boisé très proche de la caméra, ou un éclairage très coloré,
  peuvent tromper. Seuils (`MAIN_SAUT`, `MAIN_MIN`, `MAIN_MOUVEMENT`) à ajuster en salle.

## Vérifications
- `npm run build`, `npm test`.
- Chromium, caméra remplacée par une scène simulée : visage seul (6 % de peau) → rien ; main (58 %) → sieste ;
  main gardée → pas de double déclenchement ; retirée puis remontrée → réveil ; pendant le réveil → réveillé.
  Aucune erreur console.
