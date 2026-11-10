# Prompt 74 — Jeu « Nantes en régulation », étape 56 : moins de répétition et un poste de régulation enfin compréhensible

Demande d'origine (11/11/2026) :

> Le jeu est trop répétitif, le joueur ne comprend rien sur l'application de régulation. C'est même
> ennuyant.

Deux problèmes à traiter **sans toucher aux règles** : (1) le joueur ne comprend pas à quoi sert le
poste de régulation ni ce que signifient ses décisions ; (2) la boucle « signalement → décision →
narration » se répète à l'identique et devient ennuyante.

Contrainte forte : décisions verrouillées **Q1–Q61** et `game.js` (règles, effets, dés) inchangés ;
choix de design actés conservés (prompts 50/66 : pas de conseil ni de flèche d'effet sous les boutons).
Toute la variété passe par des contenus, du rythme et des explications — calculés sur des données
réelles ou tirés de la graine de la partie (reproductibles), jamais inventés.

## 1. Comprendre le poste de régulation

- **Première ouverture de l'écran de jeu** (une fois par partie, persisté) : courte explication en
  clair, FR + EN, de qui est le joueur (opérateur du centre de régulation de Nantes), de ce que fait le
  poste (surveiller les signalements réels, décider des actions pour garder le réseau fluide, protéger
  la réputation et tenir le budget) et de ce que signifient les décisions 1 Dévier / 2 Retenir /
  3 Renfort / 0 Ne rien faire **en langage métier** (sans dire lequel est « bon » pour un incident donné).
- Cette explication reprise dans le tutoriel (prompt 34), le guide « Prendre en main » (prompt 37) et
  le livre « Aide » (touche H) : chaque action y est décrite en une phrase concrète, par ex. « Dévier :
  faire passer la ligne par un autre itinéraire le temps de l'incident ».
- **Narration enrichie** : après chaque décision, le texte de narration (game.js, génération existante)
  peut être complété d'une phrase de contexte variée tirée de la situation réelle (météo du jour, heure,
  ligne concernée, événement d'agenda en cours) — calculée, pas inventée.

## 2. Casser la répétition (contenus et rythme, pas les règles)

- **Arrivée des signalements** : à minute égale dans la journée, l'ordre d'arrivée des dossiers est
  mélangé par la graine de la partie (reproductible ; la sauvegarde fige l'ordre de la journée en cours).
- **Textes de transition variés** : entre deux dossiers, un court texte de liaison tiré dans une liste
  (hash du n° de dossier + graine) : annonce météo réelle du jour, rappel d'un événement d'agenda réel
  en cours, message radio court (chauffeur) — jamais de donnée inventée.
- **Rythme de la journée** : à des heures fixes de la journée de jeu (ex. 10 h, 12 h, 16 h), un
  événement de rythme calculé sur les données réelles : pointe détectée (heure de pointe), changement
  météo réel (Open-Meteo), affluence d'un événement d'agenda qui démarre — annoncé en une ligne avec
  son effet réel déjà prévu par les règles (contexte × coef, prompt 23). Le joueur voit la journée
  « vivre », pas seulement défiler des dossiers identiques.
- **Feedback de série** (présentation seule) : 2 bonnes évaluations d'affilée → félicitation courte du
  patron (texte varié) ; 2 « raté » d'affilée → message d'encouragement + rappel de l'aide. Aucun effet
  sur les jauges.
- **Objectif du jour visible et concret** : au démarrage de chaque journée, l'objectif du jour (prompt
  23) est rappelé en clair avec sa règle, et le bilan de la veille (1–2 lignes, chiffres réels) avant
  le premier signalement.

## 3. Contraintes

- `game.js` inchangé ou prouvé sans effet sur les règles par `test-jeu.mjs` ; Q1–Q61 inchangées.
- Toute variété est reproductible (graine de la partie) et tracée jusqu'à une donnée réelle ou un calcul ;
  sinon « non renseigné ».
- Pas de conseil de correction sous les boutons d'action (prompts 50/66).
- i18n FR + EN pour tous les nouveaux textes ; `aria-live` sur les annonces ; contraste ≥ 4,5:1 ;
  `prefers-reduced-motion` ; clavier seul ; mobile portrait (cibles ≥ 44 px).

## Vérifications

- `npm run build`, `npm test` dans `site/` ; tests : ordre d'arrivée reproductible par graine et
  restauré par la sauvegarde ; aucune règle modifiée (`git diff game.js` vide ou couvert par les tests).
- **3 parties complètes rejouées** (une par difficulté, FR puis EN) : le joueur comprend à quoi sert le
  poste (explication de première ouverture + aide), la boucle paraît moins répétitive (ordre varié,
  textes de liaison, rythme de la journée), aucune erreur console, aucune régression des prompts
  14–73.
- Clavier seul, animations réduites, 1920×1080 et mobile portrait, hors ligne (fallback).
- Rapport court dans `notes.md` (section « Prompt 74 ») : ce qui a été joué, ce qui a changé pour le
  joueur. Doc : `jeu/70-…` (nouvelle doc), `jeu/README.md`, `prompts/README.md`, `journal.md` à jour.
- Branche `jeu/prompt-74-variete-comprehension`. À chaque push : entrée en tête de `journal.md`.
  Fusion `main` sur demande.
