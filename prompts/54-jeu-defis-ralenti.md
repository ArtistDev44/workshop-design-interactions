# Prompt 54 — Jeu « Nantes en régulation », étape 40 : défis de semaine et ralenti tactique

Demande d'origine (10/11/2026) :

> Quelles mécaniques ajouter à ce jeu pour qu'il soit plus interactif et plaisant ?

Direction retenue (10/11/2026) : deux mécaniques légères qui ne touchent pas aux règles
verrouillées Q1–Q61 et n'inventent aucune donnée — des **défis de semaine** calculés sur la
partie réelle, et un **ralenti tactique** limité (une pause par journée). Les animations de
feedback (deltas flottants des jauges, urgence du compteur) sont traitées à part au prompt 53.

## Attendu
1. **Défis de semaine** : 3 défis tirés parmi une liste fermée, par hachage de la graine de la
   partie (comme l'inspection surprise du prompt 47 — le générateur de dés n'est pas consommé,
   la suite des tirages ne change pas) :
   - « Zéro dossier laissé au compteur » (aucun dossier expiré à 0, règle Q25) ;
   - « Budget ≥ 60 en fin de semaine » ;
   - « Fluidité ≥ 60 en fin de semaine » ;
   - « Toutes les plaintes répondues » (app Community, là où elle est débloquée) ;
   - « Aucune équipe envoyée sur un incident déjà résolu » (malus du prompt 23).
   Les défis sont annoncés dans la consigne du patron le premier matin et rappelés dans le mail
   de chaque soir. Un défi tenu rapporte **+5 sur la jauge concernée** (réputation si le défi ne
   porte pas directement sur une jauge), appliqué en fin de semaine — comme les bonus d'objectif
   de journée du prompt 23, sans modifier la table des effets de base. Le bilan de chaque défi
   (tenu / non tenu, avec les vrais chiffres de la partie) est inscrit dans le mail du dernier
   soir et sur le rapport papier.
2. **Ralenti tactique** : touche **R** pendant un dossier met le compteur en pause **10 s**
   (temps réel), **une seule fois par journée de jeu** ; un second appui affiche « Ralenti déjà
   utilisé aujourd'hui ». Pendant la pause, le compteur et les consultations de sources
   (prompt 50) sont suspendus. Aucun effet sur les jauges (à documenter), mais « Ralenti
   utilisé » est noté sur le rapport. Réinitialisé au changement de journée. Ne pas confondre
   avec la pause du menu Échap, qui suspend toute la partie.
3. **Accessibilité & i18n** : FR + EN (`i18n.js`) ; clavier complet (R, plus bouton cliquable
   près du compteur) ; annonce `aria-live` ; avec `prefers-reduced-motion` ou « Réduire les
   animations » : pas d'animation de pause, seulement le texte « Pause — 7 s » ; contraste
   ≥ 4,5:1 ; Échap reste disponible à tout moment.
4. Le test automatisé (`test-jeu.mjs`) couvre : tirage des défis par la graine, défi tenu →
   bonus appliqué une seule fois, ralenti utilisé puis refusé, compteur figé pendant la pause,
   réinitialisation au jour suivant. `game.js` (effets, dés, règles Q1–Q61) reste inchangé :
   `test-jeu.mjs` reste vert sans modification de la logique.

## Vérifications
- `npm run build`, `npm test` ; partie réelle Chromium 1920×1080 sans erreur console : défis
  annoncés le matin, R pendant un dossier (compteur figé 10 s), second R refusé, réinitialisé
  le jour suivant, bonus de défi dans le mail du soir et sur le rapport ; FR + EN ; clavier.
  Documenter dans `jeu/48-…`. Fusion `main` sur demande.
