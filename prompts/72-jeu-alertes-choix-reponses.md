# Prompt 72 — Jeu « Nantes en régulation », étape 54 : alertes météo et autres alertes, des choix de réponses pertinents proposés au joueur

Demande d'origine (11/11/2026) :

> Pour des alertes météo ou autres alternatives, proposer des choix de réponses pertinents.

Aujourd'hui, quel que soit l'incident (alerte météo, accident, affluence…), le joueur n'a que les quatre
actions génériques 1 Dévier / 2 Retenir en terminus / 3 Bus de renfort / 0 Ne rien faire
(`sketch.js` : `dessinerDossier()`, actions évaluées dans `game.js` : `ACTIONS_EVALUEES`). Pour une
alerte météo ou une alerte grave, ces libellés génériques ne parlent pas : le joueur ne voit pas de
**choix de réponse concret et pertinent** adapté à la situation.

Ce prompt ajoute, **uniquement pour les incidents de type alerte**, un jeu de 2 à 4 réponses rédigées
pour la situation, proposées à la place (ou en complément) des actions génériques. Règles Q1–Q61
inchangées : chaque réponse proposée **correspond à une action ou un envoi d'équipe qui existe déjà** ;
aucune règle ni aucun effet n'est inventé.

Contrainte actée (prompts 50 et 66) : **aucun indice de correction** — le joueur ne sait pas laquelle
des réponses est « bonne » avant de décider (on apprend en jouant).

## 1. Quels incidents sont concernés

Un incident est une « alerte » si l'un de ces cas, calculés sur les champs réels du dossier :
- `d.type === 'alerte météo'` (game.js) ;
- le texte de la source contient accident / malaise / blessé / chute (recherche insensible à la casse,
  comme la pertinence des équipes, prompt 68) ;
- `d.type` événement / affluence (agenda Open Data en cours).

Les autres incidents gardent les actions 1/2/3/0 seules.

## 2. Choix de réponses proposés (données réelles uniquement)

Pour un incident-alerte, le panneau propose 2 à 4 réponses rédigées, construites **uniquement** à partir
des champs réels du dossier et de la météo du jour (`Jeu.meteoDuJour`) :

| Situation réelle | Exemples de réponses proposées (FR) | Correspond à |
|---|---|---|
| Alerte météo, rafales fortes (`rafales_max` élevé) | « Envoyer pompiers et techniciens sur les secteurs exposés » | envoi équipes `pompiers` + `techniciens` (pertinents, prompt 68) |
| Alerte météo, pluie forte (`pluie_mm` élevé) | « Dévier les lignes exposées » | action 1 Dévier |
| Alerte météo | « Retenir les rames en terminus le temps de l'alerte » | action 2 Retenir |
| Alerte météo | « Prévenir les usagers, ne rien changer au plan de transport » | action 0 Ne rien faire (+ message Community si l'appli existe) |
| Source avec accident / malaise | « Envoyer les ambulanciers » | envoi équipe `ambulanciers` |
| Source avec accident / malaise | « Envoyer la police sécuriser les lieux » | envoi équipe `police` |
| Événement / affluence (nom réel de l'événement) | « Envoyer la police gérer l'affluence autour de {nom de l'événement} » | envoi équipe `police` |
| Affluence | « Renforcer par des bus sur les lignes concernées » | action 3 Renfort |

Règles de construction :
- Le nombre et le contenu des choix dépendent des vraies valeurs (ex. : pluie forte → la réponse
  « dévier » est proposée ; rafales → la réponse « pompiers » est proposée). Une valeur absente →
  « non renseigné », pas de choix inventé.
- **Chaque réponse mappe vers exactement une action existante** (1/2/3/0) **ou un envoi d'équipe existant**
  (équipe disponible ou non, avec le même message de refus que le prompt 68). Aucun nouvel effet.
- L'ordre des réponses est mélangé à chaque apparition (tirage par la graine de la partie, donc
  reproductible), pour ne pas toujours les présenter dans le même ordre.
- Libellés en français et anglais (`i18n.js`, clés `alerte.reponse.*`), avec trous `{rafales}`,
  `{pluie}`, `{evenement}`, `{ligne}` remplis avec les vraies valeurs ; les données réelles (nom de
  l'événement, numéro de ligne) ne sont jamais traduites.

## 3. Affichage et interaction

- Dans le panneau incident (phase décision), pour une alerte : les réponses proposées s'affichent comme
  **boutons-choix étiquetés en toutes lettres**, à la place des simples « 1 / 2 / 3 / 0 » (les touches
  1/2/3/0 continuent de fonctionner et activent la réponse correspondante quand elle existe, sinon
  l'action générique de même numéro).
- Souris : clic sur la réponse. Clavier : ↑/↓ ou Tab parcourt les réponses, Entrée valide. Mobile :
  cibles ≥ 44 px.
- `aria-live` annonce la question et chaque réponse ; contraste ≥ 4,5:1 ; `prefers-reduced-motion`
  respecté (pas d'animation obligatoire).
- Après le choix, le déroulement est inchangé : narration, effets réels, évaluation « bon choix ! /
  raté » (game.js inchangé).

## 4. Hors écran de jeu

- Aide (livre « Aide », touche H) et tutoriel (prompt 34) expliquent, FR + EN, que les alertes proposent
  des réponses adaptées à la situation et que chaque réponse correspond à une action ou un envoi
  d'équipe — sans dire laquelle est bonne.
- Guide « Prendre en main » (prompt 37) : une étape pointe la première alerte reçue.

## 5. Contraintes

- `game.js` inchangé (règles, effets, dés, Q1–Q61) ; la correspondance réponse → action/équipe vit dans
  la couche d'affichage (`carte.js` / `sketch.js`) et est testée unitairement.
- Aucune donnée inventée : chaque réponse est traçable jusqu'aux champs réels du dossier ou de la météo.
- Pas de conseil de correction sous les réponses (prompts 50/66).
- `scripts/test-jeu.mjs` vert.

## Vérifications

- `npm run build`, `npm test` dans `site/` ; tests ajoutés : mapping réponse → action/équipe pour chaque
  type d'alerte ; mélange reproductible par graine ; aucune réponse sans source réelle.
- Partie réelle FR + EN, clavier seul puis souris, 1920×1080 et mobile : alerte météo avec pluie forte,
  alerte météo avec rafales, incident avec malaise dans le texte de la source, affluence avec nom
  d'événement réel → réponses proposées pertinentes ; touches 1/2/3/0 toujours actives ; équipe
  indisponible → message de refus existant ; aucune erreur console.
- Rejouer une semaine complète : aucune régression des prompts 14–71 ni de Q1–Q61.
- Doc : `jeu/68-…` (nouvelle doc), `jeu/README.md`, `prompts/README.md`, `journal.md` à jour.
- Branche `jeu/prompt-72-alertes-choix-reponses`. À chaque push : entrée en tête de `journal.md`.
  Fusion `main` sur demande.
