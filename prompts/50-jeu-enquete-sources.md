# Prompt 50 — Jeu « Nantes en régulation », étape 36 : découvrir la situation (enquête par les sources)

Demande d'origine (10/11/2026) :

> Pour le gameplay, je préférerais une expérience plus immersive où le joueur doit découvrir la
> situation.

Direction choisie (question posée le 10/11/2026) : **enquête par les sources**.

## Attendu
1. Un dossier arrive comme une **alerte vague** (type et ligne seulement, ou « signalement » sans ligne).
2. Le joueur **révèle** les détails en consultant les sources du jeu, chacune liée à une vraie donnée :
   - **carte** : localisation, lignes concernées ;
   - **info trafic / téléphone** : retard réel, nature du dossier, texte source ;
   - **météo** (fenêtre ou appli) : conditions réelles du jour ;
   - **agenda** : événement réel lié (affluence).
   Chaque consultation prend un peu de temps de compteur ; rien n'est inventé, seule la mise en scène change.
3. **Plus de conseil ni de flèches d'effet** sur les boutons d'action : on apprend les effets en jouant
   (journal, mail du soir, rapport). Les seuils restent visibles sur les jauges.
4. Le guide « Prendre en main » et le tutoriel expliquent la nouvelle façon de jouer.
5. Le test automatisé (`test-jeu.mjs`) reste vert : la logique de `game.js` (effets, dés) ne change pas.

## Vérifications
- `npm run build`, `npm test` ; partie réelle (révélations, décisions sans tout savoir) ; FR + EN ;
  clavier. Documenter dans `jeu/45-…`. Fusion `main` sur demande.
