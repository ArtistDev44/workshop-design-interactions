# Prompt 53 — Jeu « Nantes en régulation », étape 39 : animations de feedback (dossier, jauges, compteur)

Demande d'origine (10/11/2026) :

> Quelles autres animations rajouter au jeu ? Priorité au feedback du gameplay : à l'arrivée d'un
> dossier, au retour des jauges après une décision, et à l'urgence quand le compteur descend.

## Attendu
1. **Arrivée d'un dossier** : le panneau du dossier glisse dans le panneau de droite (≈ 300 ms, ease out),
   un tampon « SIGNALEMENT » s'imprime (légère rotation + opacité), et la ligne concernée **pulse** sur la
   carte de l'appli Régulation (et de l'appli Carte) tant que le dossier n'est pas traité. Le son d'alerte
   existant (prompt 44) est conservé, toujours sous l'interrupteur Son.
2. **Retour des jauges** : les trois barres (fluidité, satisfaction, réputation) passent à leur nouvelle
   valeur en *eased* (pas de téléportation) ; les deltas réels (+5 / −10…) flottent au-dessus de la jauge
   en fading ; le clignotement sous 20 (Q46) est lissé en opacité sinusoïdale, sans clignotement sec.
3. **Urgence du compteur** : sous 10 s restantes, la barre du compteur passe au rouge et pulse doucement,
   le sablier du bureau (prompt 51) accélère la chute de ses grains, et le tic-tac du compte à rebours
   (prompt 44) gagne en intensité. Aucun effet au-delà de 10 s.
4. **Accessibilité** : jamais plus de 3 pulsations par seconde, amplitude faible (pas de flash, pas de
   plein écran rouge) ; avec `prefers-reduced-motion` ou « Réduire les animations » : dossier et tampon
   apparaissent directement, jauges et barre passent à leur valeur sans animation, deltas affichés en
   texte fixe, sablier figé. Textes toujours lisibles. Arrivée de dossier et variations de jauges annoncées
   en `aria-live`. Rien ne touche aux règles Q1–Q61 : `game.js` inchangé, `test-jeu.mjs` reste vert.

## Vérifications
- `npm run build`, `npm test` ; essai réel (souris et clavier) : arrivée de dossier, décision, jauges,
  compteur sous 10 s, animations réduites ; aucune erreur console. FR + EN. Documenter dans `jeu/48-…`.
  Fusion `main` sur demande.
