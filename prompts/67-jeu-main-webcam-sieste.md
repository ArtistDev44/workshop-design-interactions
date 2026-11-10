# Prompt 67 — Jeu « Nantes en régulation », étape 50 : la main devant la webcam lance ou interrompt la sieste

Demande d'origine (10/11/2026) :

> aussi pour l'effet de sieste, le son n'est pas nécessaire : il faudrait que la webcam reconnaisse une
> main et après cela lance ou interrompt la sieste

## Attendu
1. Webcam active : une **main** présentée devant la caméra (grande zone couleur peau qui apparaît, avec
   du mouvement) est reconnue localement, sans bibliothèque ni réseau ; anti-rebond (~2 s).
2. Main reconnue : **pas endormi → la sieste se lance** ; **endormi → la sieste s'interrompt** (réveil,
   y compris pendant le réveil après un bip). Le son n'intervient pas.
3. L'absence devant la caméra ne déclenche plus la sieste (remplacée par la main) ; la sieste par
   inactivité (20 s sans geste) reste, pour qui joue sans webcam.
4. Retour visuel : témoin « main vue » sur la webcam du bureau ; annonce `aria-live` ; FR + EN ; images
   jamais affichées ni enregistrées.

## Vérifications
- `npm run build`, `npm test` ; scène simulée (main couleur peau qui entre / visage seul / pièce vide) :
  main → sieste, main → réveil, visage seul ou vide → rien. Documenter dans `jeu/61-…`.
