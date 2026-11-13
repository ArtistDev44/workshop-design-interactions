# Prompt 198 — Jeu : Community — variété d'interactions, 1/3 de publications provoquantes, ×4 d'interactions, tirage varié

Demande d'origine (13/11/2026) :

> Je souhaite que tu me créés un nouveau prompt dans le dépôt du projet qui permette d'avoir une plus grande
> variété d'interactions pour l'application community management. Ajuste la proportions de publications
> provoquantes : seulement 1/3 le sont. Rajoutés 300% d'interactions et mets une fonction aléatoire pour
> éviter d'avoir toujours les mêmes interactions.

Sur la base des prompts 85 (compte social Community), 63 (réactions en chaîne reproductibles), 117–118 (trio
mélangé dont un clash, plaignants parfois agressifs) 196 et 197 (clash violent, réaction du plaignant, Community).

## À faire

### 1. ×4 interactions (`data/messages.json`, `game.js`)

- Mesurer d'abord le volume actuel (nombre d'interactions usagers visibles par journée jouée : commentaires,
  réactions, mentions, messages privés) et le documenter : l'objectif est **4× ce volume** (300% de plus).
- Élargir le pool d'interactions avec de nouvelles catégories, en plus des plaintes de retard : question
  d'usager, remerciement, suggestion d'itinéraire, témoignage anecdotique, relance d'un fil précédent,
  signalement en doublon, demande d'accessibilité, commentaire sur une photo du compte.
- Nouvelles entrées dans `data/messages.json`, même structure et même validation que les plaintes actuelles
  (FR + EN, ≥ 2 réponses avec `bonne` et `effets`, conditions sur les champs réels déjà disponibles).
- Une entrée n'apparaît que si sa condition correspond à un fait réel de la partie ; entrée invalide ignorée
  avec avertissement en console. On ne remplit jamais avec du faux.

### 2. Proportion de publications provoquantes : 1/3 (`data/messages.json`, `game.js`)

- Ajouter un champ `ton` aux interactions : `provoquant` | `neutre` | `positif`. Étiqueter rétroactivement
  les entrées existantes (les agressives du prompt 118 deviennent `provoquant`).
- La sélection garantit qu'**au plus 1/3 des interactions d'une journée jouée sont `provoquant`** ; les 2/3
  restants se répartissent entre `neutre` et `positif`.
- Si le tirage dépasse 1/3, les surnuméraires sont basculés vers `neutre` ou `positif` (variante la plus
  proche du contexte), sans jamais doubler deux provocations de suite.

### 3. Fonction de tirage varié (`game.js`)

- Ajouter `Jeu.hasard(graine)` : PRNG déterministe (mulberry32 ou équivalent) semé par dossier + jour +
  index d'interaction. **Pas de `Math.random()`** : la règle du dépôt impose des dés reproductibles
  (prompt 63) et des sauvegardes/restaurations fidèles. La « fonction aléatoire » est donc semée : deux
  parties identiques donnent le même contenu, mais deux dossiers différents ne produisent presque jamais le
  même habillage.
- Ce tirage choisit la variante de texte (parmi tout le pool de la catégorie), l'auteur fictif, l'ordre
  d'arrivée et l'heure d'apparition de chaque interaction.
- Anti-répétition : historique circulaire `Jeu.derniersTextes` (taille = pool de la catégorie − 1) ; une
  variante tirée récemment n'est pas retirable tant que son pool n'est pas épuisé.

### 4. Community (`community.js`, `os.js`)

- Les nouvelles interactions arrivent dans le fil comme aujourd'hui, rattachées au post du fait réel, avec
  les badges Mentions / Messagerie existants.
- Questions, remerciements et suggestions reçoivent aussi des réponses jouables : le trio existant du prompt
  117 (meilleure réponse, autre réponse, clash), mêmes délais (prompt 79), mêmes effets. Aucun nouveau
  mécanisme de jeu.

### 5. Tests et docs

- `site/scripts/test-jeu.mjs`, nouveau bloc prompt 198 :
  - volume total = 4× la référence mesurée au § 1 ;
  - proportion `provoquant` ≤ 1/3 sur une journée complète ;
  - nouvelles entrées valides FR et EN ;
  - sur 20 tirages de suite, aucune variante immédiatement répétée ;
  - reproductibilité : même graine → mêmes textes.
- `npm run build` puis `npm test` verts ; audit des textes (`?audit=textes`) à 0 défaut A–D sur les nouveaux
  textes FR/EN.
- Doc `jeu/198-community-variete-interactions.md` listée dans `jeu/README.md` ; ligne 198 dans
  `prompts/README.md`.

## Hors périmètre (ne pas faire)

- Ne pas modifier les règles Q1–Q61, les effets, les jauges, le trio mélangé (117), les réactions
  reproductibles (63) ni le clash (196 : réputation −8, compté raté).
- Rien d'haineux, menaçant ou discriminatoire ; les mots grossiers restent masqués hors alphabet.
- Aucune donnée réelle inventée : les interactions ne citent que des faits réels de la partie ; les
  pseudonymes restent fictifs.

Branche `jeu/prompt-198-community-variete-interactions`. À chaque push : entrée en tête de `journal.md`.
Ne pas fusionner dans `main` sans demande.
