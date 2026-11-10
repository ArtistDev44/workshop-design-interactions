# Prompt 79 — Jeu « Nantes en régulation », étape 61 : les retards s'aggravent avec le temps, et le même système sur l'appli Community

Demande d'origine (11/11/2026) :

> Les retards doivent s'aggraver avec le temps : le chiffre de début est le vrai chiffre, mais si le
> joueur ne réagit pas correctement, il perd des points et les retards s'aggravent. Un système
> similaire doit être mis sur l'application de Community.

Aujourd'hui, le retard d'un dossier est figé : c'est le **vrai chiffre lu dans la source**
(`game.js` : `d.retard = r.retardMin`, GTFS-RT, ou la valeur des semaines enregistrées) et il ne bouge
pas tant que le dossier est ouvert. Même punition quelle que soit la vitesse de réaction.

## Attendu

### 1. Retards qui s'aggravent (règles Q1–Q61 préservées, aggravation documentée)

- Le **retard de départ affiché reste le vrai chiffre de la source** (`d.retard`), mais un **retard
  effectif** est calculé pour tout dossier « ligne en difficulté » non encore traité :
  `retardEffectif = d.retard + aggravation`, où `aggravation = floor(temps écoulé depuis l'arrivée du
  dossier / T)` avec `T` verrouillé dans `REGLAGES` (ex. +1 min toutes les 2 minutes de jeu, plafond
  documenté, ex. +30 min max).
- Le panneau affiche les deux : « +12 min (réel) → +17 min actuellement » ; le chiffre qui compte pour
  les règles est le retard effectif, **documenté dans l'aide**.
- Les règles existantes qui lisent le retard (Q58 : « retenir » vaut mieux si retard > 20 min ; gravité
  « élevée » si retard ≥ 20 min, prompt 68) lisent désormais le **retard effectif** — sémantique
  conservée, seule la valeur d'entrée est dynamique.
- **Mauvaise réaction = aggravation supplémentaire** : si la décision est évaluée « raté » (ou « trop
  tard » à 0 du compteur) sur un dossier avec retard, le retard effectif de la ligne **reste aggravé
  durablement pour la suite de la journée** (ex. +5 min permanents sur cette ligne, cumulatifs,
  bornés, affichés dans l'historique de la ligne) et les points/jauge perdus sont ceux du malus
  existant (prompt 23) — aucun nouveau malus inventé, mais la conséquence est visible et durable.
- La sauvegarde enregistre l'aggravation courante par ligne.

### 2. Même système sur l'appli Community

- Les commentaires Community (`os.js` : `appCommunity()`, `Jeu.commentaires`, `nonLus.community`)
  ont désormais un **compteur de réponse** : tant qu'un commentaire attend une réponse, un délai
  s'écoule ; à l'expiration, le commentaire « s'envenime » (réputation −X, malus existant du prompt
  22/23 appliqué, badge non lus) — **répondre vite évite la dégradation**.
- Affichage : chaque commentaire non répondu montre son délai restant (qui passe au rouge sous 10 s) ;
  les réponses possibles (prompt 28, `data/messages.json`) restent, avec le système de « bonne
  réponse » existant ; une réponse rapide sur un commentaire récent rapporte le bonus existant,
  une réponse tardive ou l'expiration applique le malus.
- Le bilan de fin de journée (mail/rapport) récapitule : commentaires répondus à temps / tard /
  expirés.

## Contraintes

- Données réelles uniquement : le retard de base vient toujours de la source (GTFS-RT ou semaines
  enregistrées) ; l'aggravation est un **calcul documenté**, pas une donnée inventée.
- Sémantique Q1–Q61 conservée (seuils, effets de base) ; les nouveautés sont la dimension temporelle
  (aggravation) et la durabilité de la mauvaise décision — verrouillées dans `REGLAGES`, expliquées
  dans l'aide (FR + EN), Q1–Q61 listées dans `jeu/03-actions-decisions.md` mises à jour si un seuil
  change de valeur d'entrée.
- Accessibilité : délais affichés en texte, `aria-live` sur l'aggravation d'un retard et l'expiration
  d'un commentaire, clavier seul, contraste ≥ 4,5:1, `prefers-reduced-motion`, mobile (cibles ≥ 44 px).
- `scripts/test-jeu.mjs` vert.

## Vérifications

- `npm run build`, `npm test` ; tests : retard effectif = réel + aggravation calculée (bornes, remise
  à zéro à la décision, persistance de l'aggravation durable après un « raté") ; Community : expiration
  d'un commentaire non répondu applique le malus, réponse rapide l'évite, délais affichés.
- Partie réelle FR + EN : un retard réel de 12 min affiché « +12 min » à l'arrivée puis aggravé en
  attendant ; décision « raté » → aggravation durable visible dans l'historique de la ligne et le
  bilan ; commentaires Community avec délai, réponse à temps vs expiration ; aucune erreur console ;
  1920×1080, mobile, hors ligne.
- Doc : `jeu/75-…` (nouvelle doc), `jeu/README.md`, `prompts/README.md`, `journal.md` à jour.
- Branche `jeu/prompt-79-retards-aggravation-community`. À chaque push : entrée en tête de
  `journal.md`. Fusion `main` sur demande.
