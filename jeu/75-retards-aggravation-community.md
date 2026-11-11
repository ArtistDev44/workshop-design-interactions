# Prompt 79 — les retards s'aggravent avec le temps, et le même système sur l'appli Community

## Retards qui s'aggravent (`game.js`, sémantique Q1–Q61 conservée)

- Le **retard de départ affiché reste le vrai chiffre de la source** (`d.retard`, GTFS-RT ou archives).
- Un **retard effectif** est calculé pour tout dossier « ligne en difficulté » non traité :
  `retardEffectif = d.retard + min(plafond, floor(tempsDeJeuEcoulé / parMinutes)) + aggravationDurable(ligne)`
  (valeurs verrouillées dans `REGLAGES.aggravation` : +1 min toutes les 2 min de jeu, plafond +30 min).
- Affichage : « Retard : +12 min (réel) → +17 min actuellement » (`dossier.retardEffectif`, enquete.js).
- Les règles qui lisent le retard lisent désormais le **retard effectif** (même seuils) : Q58
  (« retenir » vaut mieux si retard > 20 min) et la gravité « élevée » (≥ 20 min, prompt 68).
- **Décision « ratée » ou « trop tard »** sur un dossier avec retard : **aggravation durable** de la
  ligne (+5 min permanents, cumulatifs, bornés à +30), affichée dans l'historique de la ligne
  (`carte.histo.aggravation`) et persistée dans la sauvegarde (`aggravationLignes` dans l'instantané).
  Le malus de points reste celui du prompt 23 ; la conséquence est visible et durable.

## Même système sur l'appli Community

- Chaque **plainte en attente** a un **compteur de réponse** (`delaiReponsePlainte_s` = 45 s, verrouillé),
  affiché dans l'app (rouge sous 10 s). À l'expiration, la plainte **« s'envenime »** : réputation −3
  (`malusPlainteExpiree`), malus `plainte_expiree`, badge « expirée » ; une **réponse tardive** applique
  le même malus ; une réponse **à temps** garde le bonus existant (prompt 28).
- `Jeu.majPlaintes()` appelé à chaque image. Le **bilan de fin de journée** (mail du soir) récapitule :
  plaintes répondues à temps / tardives / expirées (`mail.plaintes`, `bilanPlaintes` étendu).

Documenté dans l'aide (H), FR + EN. Données réelles uniquement : le retard de base vient toujours de la
source ; l'aggravation est un calcul documenté.
