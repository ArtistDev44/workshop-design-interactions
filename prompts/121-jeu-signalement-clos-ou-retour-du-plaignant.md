# Prompt 121 — Jeu « Nantes en régulation » : un signalement est clos sans équipe, terminé au retour du plaignant

Demande d'origine (12/11/2026) :

> Concernant le fonctionnement, je souhaite que lorsque l'on n'envoie pas d'équipe le signalement est considéré
> clos, mais si on envoie une équipe on attend le retour du plaignant remerciant pour l'intervention du joueur et
> ainsi le signalement est fini.

Suite des prompts 68 (équipes), 102 / 107 (plaignant), 108 / 109 (équipes sur la carte). Rien d'inventé côté
données : le retour du plaignant est un texte de jeu, rempli avec les faits réels du dossier (ligne, équipe).

## 1. Constat

- Aujourd'hui, dès que le joueur répond, le signalement disparaît de la carte, qu'une équipe soit en route ou non.
- Quand l'équipe arrive, un commentaire « équipe » part sur Community, signé d'un pseudo sans lien avec le
  plaignant du dossier. Rien ne dit que le signalement est fini.

## 2. Règle (moteur, `game.js`)

Un signalement auquel le joueur a répondu a un **statut**, calculé sur l'état réel de la partie
(`Jeu.statutSignalement(index)`, lecture seule) :

| Situation | Statut |
|---|---|
| Aucune équipe utile envoyée sur ce signalement | **clos** — tout de suite, à la réponse |
| Au moins une équipe envoyée, intervention pas finie | **en attente du retour** |
| Toutes ses équipes ont fini d'intervenir, le plaignant a répondu | **terminé** |

- **Retour du plaignant** (`Jeu.retourPlaignant`) : émis une seule fois par signalement, quand le joueur a
  répondu **et** que toutes les équipes envoyées ont fini leur intervention (`finIntervention`).
  - Auteur : le plaignant du dossier (`Jeu.plaignantPour(index)`), sinon un pseudo de la liste existante.
  - Texte : un remerciement, 3 variantes FR + EN (`retour.merci.0` à `2`), avec `{equipe}` et `{sujet}`.
    Choix déterministe par numéro de dossier, sans dé.
  - Il remplace le commentaire « équipe » envoyé à l'arrivée. L'effet sur la réputation ne change pas :
    +1 par équipe (les effets propres de l'équipe restent appliqués à son arrivée).
  - Il est rattaché au post du dossier dans Community (`index`) et marqué `retour: true`.
- Une équipe « inutile » (envoyée après la réponse) ne change pas le statut : le signalement reste clos.
- Fin de journée : un signalement en attente dont l'équipe a déjà fini reçoit son retour avant le passage au
  jour suivant ; sinon le retour arrive le lendemain, quand l'intervention se termine.
- Sauvegarde / reprise : le drapeau du retour est enregistré avec l'équipe ; une ancienne sauvegarde ne rejoue
  pas un remerciement déjà donné.

## 3. Ce que voit le joueur

- **Après la réponse** (panneau des conséquences) : un badge de statut en haut à droite —
  « Signalement clos » ou « En attente du retour · {équipe} en route ».
- **Sur la carte** : un signalement en attente reste à son lieu, en marqueur **creux** (contour à la couleur de
  gravité, sablier pixel). Au survol : « En attente du retour de {auteur} · {équipe} ». Il n'est plus
  cliquable et n'accepte plus d'équipe.
- **Ligne d'état de la carte** : « Signalements · n » puis, s'il y en a, « · k en attente de retour ».
- **Au retour** : notification « Retour du plaignant » avec l'auteur et le début du message (clic → Community),
  annonce `aria-live`, puis le marqueur disparaît.
- **Aide** : une phrase dans les règles (« Sans équipe, le signalement est clos dès votre réponse… »).

## 4. Accessibilité

- Le statut ne passe jamais par la seule couleur : forme creuse + texte.
- Pas d'animation sur le marqueur en attente si les animations sont réduites.

## Vérifications

- `scripts/test-jeu.mjs` : sans équipe → clos ; avec équipe → en attente jusqu'à la fin d'intervention, puis
  terminé, un seul retour, auteur = plaignant, réputation +1 ; équipe inutile → reste clos ; reprise d'une
  sauvegarde sans doublon.
- `npm run build`, `npm test`, audit des textes à 0 défaut.
- Copie dans `rendu/`, rapport `jeu/121-125-signalements-aide-menu.md` (section 121), `prompts/README.md`,
  `journal.md`, `npm run auteurs`.
