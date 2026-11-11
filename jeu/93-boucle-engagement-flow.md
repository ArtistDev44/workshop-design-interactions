# 93 — Boucle d'engagement et flow : easy to learn, hard to master (prompt 97, skill `game-design-theory`)

Skill appliqué : `~/.claude/skills/game-design-theory/` (MDA, boucle d'engagement, canal de flow, autodétermination, types de récompenses).

Seules la présentation, l'accueil et la lisibilité changent. `game.js`, Q1–Q61, les effets, le 1d6, les jauges, les fins et les données ne sont pas modifiés.

## 1. Diagnostic avec la grille du skill

**MDA**

| Couche | Ce que c'est ici |
|---|---|
| Mécanique | Signalement réel → réponse de la catégorie → deltas de jauges (+1d6) |
| Dynamique | Arbitrage entre fluidité, réputation et budget sous un retard qui grimpe ; équipes limitées |
| Esthétique visée | Tension du régulateur, compétence (« j'ai bien lu la situation »), sentiment de justice |

**Boucle d'engagement**

| Étape | Ici |
|---|---|
| Entrée | Clic, 1-4 ou glisser-déposer (prompt 94) |
| Traitement | `Jeu.decider` |
| Retour | Annonce, sons, secousse et pop du prompt 96 dans la même image, donc sous les 100 ms |
| Récompense | Retour expliqué, deltas, objectif du jour, rapport du soir |
| Répétition | Le signalement suivant, la liste « reste aujourd'hui » (prompt 95) |

**Mesure automatisée** (Chromium, joueur qui n'appuie que sur Entrée, 0,7 s par geste, sans le menu du titre) :

| | Gestes | Durée |
|---|---|---|
| Avant le prompt 97 | 18 | 14 s |
| Après « Échap : tout passer » | 13 | 10 s |

Dans les deux cas, la première décision arrive bien sous la minute visée. Le temps réel d'un joueur novice reste à mesurer par un test humain (voir § 4).

**3 frictions relevées**
1. L'intro SMS demandait **un geste par message** (6 messages).
2. Plusieurs écrans s'enchaînent avant la première décision : transition, SMS, démarrage du PC, explication du poste. Ils sont tous passables par Entrée, mais ils retardent la boucle.
3. **La causalité d'un échec était peu découvrable** : l'aide H ne disait pas où lire « pourquoi ma décision a raté ». De plus, son paragraphe des tâches décrivait encore le briefing et l'info trafic, retirés au prompt 91.

**Flow** : la difficulté (budget 60 / 50 / 40, signalements simultanés 3 / 2 / 1, aggravation ×0,5 / ×1 / ×1,5) est le réglage du canal de flow. Elle n'était **pas visible** avant de jouer.

**Autodétermination**
- Autonomie : choisir la réponse, le moment de quitter (Q), d'ouvrir les sources.
- Compétence : tendances honnêtes sur chaque carte, retour expliqué.
- Appartenance : patron, Camille, usagers de Community.

## 2. Learn : moins d'une minute
- **Accueil** : une ligne dit ce qu'est une partie (« une semaine réelle, une quinzaine de signalements à trancher, 3 jauges à préserver »).
- **Choix du mode** : la carte du mode histoire affiche la difficulté de la prochaine semaine (« Difficulté facile : budget 60 · 3 signalement(s) à la fois · retards ×0,5 »), tirée des réglages verrouillés.
- **Intro SMS** : **Échap passe toute la conversation** ; les messages restants sont annoncés d'un bloc, rien n'est perdu. La consigne dit « Clic ou Entrée : message suivant · Échap : tout passer », sur deux lignes au plus dans l'écran du téléphone.
- **Guide de la première décision** : « glissez une carte sur le dossier, ou cliquez-la, ou touche 1 à 4 ».

## 3. Master : progression et causalité lisibles
- **Aide H** :
  - deux nouvelles lignes de raccourcis, « Glisser » et « Q » ;
  - un paragraphe « Pourquoi une décision a raté ? », qui renvoie au retour après décision (meilleure réponse et raison) et au Journal (J) → Enquêter (dé, effets attendus) ;
  - le paragraphe des tâches est remis à jour : priorités imposées (2 puis 3), publication Community (B).
- **Récompenses** : l'ordre intrinsèque puis extrinsèque est conservé. On comprend d'abord la bonne décision (retour expliqué), puis viennent les badges, le grade et le palmarès.
- **Hasard** : aucune nouvelle récompense aléatoire. Le 1d6 existant suffit.
- **Anti-frustration** : `retour.mieux` donne déjà la meilleure réponse et son pourquoi. Le sens est inchangé, il est seulement rendu découvrable depuis l'aide.

## 4. Vérifications
- `npm test` passe : 442 contrôles smoke et 529 contrôles du jeu. Il vérifie, en FR et en EN, que l'aide et le guide contiennent glisser / clic, 1-4, Q, les 3 jauges, « pourquoi ma décision a raté » et la difficulté, et ne décrivent plus le briefing ni l'info trafic.
- Chromium, en FR et en EN : écran du mode, aide, première décision.
- Audit des textes : 0 défaut A à D. Deux défauts créés par ce prompt ont été corrigés aussitôt : la consigne SMS (+15 px) et la case d'info du mode (4e ligne coupée).
- **Test humain** (joueur novice hors projet, semaine 1 : 3e décision en moins de 2 min sans aide, et dit ce qu'il faut préserver) : [À COMPLÉTER]. Les 3 verbatims sont à noter dans `notes.md`.
