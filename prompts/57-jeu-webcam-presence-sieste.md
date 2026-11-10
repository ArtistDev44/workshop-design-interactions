# Prompt 57 — Jeu « Nantes en régulation », étape 43 : webcam, détection de présence et sieste

Demande d'origine (10/11/2026) :

> Rajoute un prompt avec la webcam (aussi listée dans le livret) : détection de présence — si le joueur
> s'éloigne, la sieste se déclenche.

Le livret autorise la webcam comme périphérique d'entrée (« Souris, touch, clavier, webcam, micro,
capteur, présence »). La sieste existe déjà (prompt 20 § 4 : 20 s sans incident ni interaction →
paupières + « Se réveiller » ; réveil raté = −5 sur la jauge de l'incident). Ce prompt ajoute une
**cause** de déclenchement, sans changer les règles Q1–Q61 ni la logique de malus (`game.js`).

## Attendu
1. **Webcam du poste** : webcam pixel art posée sur l'écran du PC (objet du bureau cliquable) + option
   « Webcam » dans les Paramètres (désactivable, état mémorisé en `localStorage`). `getUserMedia({ video })`
   n'est appelé qu'au premier geste d'activation (clic sur l'objet ou activation du paramètre) ; si la
   webcam est refusée ou absente → repli silencieux : la détection de présence est désactivée, le jeu
   continue avec la sieste sur inactivité seule, aucun crash, message discret « Webcam indisponible ».
2. **Détection de présence locale** : les images vidéo sont dessinées dans un canevas hors écran réduit
   (≈ 48 × 27), jamais affichées ni enregistrées ni envoyées ; seules des valeurs sont lues —
   **luminance moyenne de la zone centrale** (visage) et **différence temporelle** entre deux images
   successives (mouvement). Si les deux restent sous les seuils pendant **8 s** → le joueur est
   « parti » → la sieste se déclenche (même état que l'inactivité 20 s, prompt 20 § 4 : paupières, « Z »,
   bip triple à l'incident, « Se réveiller » avec compte à rebours).
3. **Retour** : quand la présence est détectée à nouveau, rien ne se passe de spécial : si une sieste
   était en cours, le bouton « Se réveiller » reste requis (le malus −5 en cas de raté est inchangé) ;
   si aucun incident n'est en cours, la sieste s'interrompt d'elle-même comme aujourd'hui.
4. **Indicateur de confidentialité** : tant que la webcam est active, une petite LED rouge est allumée à
   côté de l'objectif (et icône « cam active » dans la barre des tâches) ; l'analyse se fait image par
   image en local, aucune image ne sort de la page. Texte FR + EN. Activation/désactivation annoncée en
   `aria-live`.
5. **Cadrage** : aucune incidence sur les jauges, le compteur, les décisions, le déroulement des
   journées : `game.js` et les règles Q1–Q61 inchangés, `test-jeu.mjs` reste vert (la sieste sur inactivité
   20 s reste le déclencheur par défaut quand la webcam est coupée). `prefers-reduced-motion` : la sieste
   reste un état statique (déjà le cas). La page reste jouable caméra éteinte.

## Vérifications
- `npm run build`, `npm test` ; essai réel : webcam autorisée (rester devant → rien ; s'éloigner 8 s →
  sieste ; revenir → « Se réveiller » toujours requis), webcam refusée (repli, sieste sur inactivité
  seule), option Webcam désactivée, LED et annonces `aria-live`, aucune erreur console, aucune image
  affichée. FR + EN ; clavier. Documenter dans `jeu/50-…`. Fusion `main` sur demande.
