# Prompt 72 — alertes : des choix de réponses pertinents proposés au joueur

Pour les incidents de type **alerte**, le panneau de décision propose 2 à 4 **réponses rédigées pour la
situation réelle**, à la place des simples « 1 / 2 / 3 / 0 » (les touches 1/2/3/0 restent actives et
produisent l'action de même numéro). Aucune règle ni aucun effet n'est inventé : chaque réponse
correspond à une **action existante** (1 Dévier / 2 Retenir / 3 Renfort / 0 Ne rien faire) ou à un
**envoi d'équipe existant** (prompt 68), avec le même message de refus quand l'effectif est épuisé.

## Quels incidents sont des « alertes » (`estAlerte`, carte.js)

- `d.type === 'alerte météo'` ;
- le texte de la source contient *accident / malaise / blessé / chute* (recherche insensible à la casse) ;
- `d.type === 'événement'` ou `d.affluence` (agenda Open Data en cours).

## Construction des réponses (`reponsesAlerte`, carte.js)

Uniquement depuis les champs réels du dossier et la météo du jour (`Jeu.meteoDuJour`) :

| Situation réelle | Réponse proposée (FR) | Correspond à |
|---|---|---|
| Alerte météo, rafales ≥ 50 km/h | « Envoyer les pompiers sur les secteurs exposés (rafales {rafales} km/h) » | équipe `pompiers` |
| Alerte météo, rafales ≥ 50 km/h | « Envoyer des techniciens vérifier les installations » | équipe `techniciens` |
| Alerte météo, pluie ≥ 10 mm | « Dévier les lignes exposées{ligne} (pluie {pluie} mm) » | action 1 Dévier |
| Alerte météo | « Retenir les rames en terminus le temps de l'alerte » | action 2 Retenir |
| Alerte météo | « Prévenir les usagers, ne rien changer au plan de transport » | action 0 |
| Source avec accident / malaise | « Envoyer les ambulanciers » | équipe `ambulance` |
| Source avec accident / malaise | « Envoyer la police sécuriser les lieux » | équipe `police` |
| Événement / affluence | « Envoyer la police gérer l'affluence autour de « {evenement} » » | équipe `police` |
| Affluence | « Renforcer par des bus sur les lignes concernées{ligne} » | action 3 Renfort |

- L'ordre est mélangé à chaque apparition par un hachage de la **graine de la partie** et du n° de
  dossier (reproductible, ne consomme pas le générateur de dés).
- Libellés FR + EN (`i18n.js`, clés `alerte.reponse.*`), trous remplis avec les vraies valeurs.

## Interaction

- Souris : clic sur la réponse. Clavier : ↑/↓ ou Tab parcourt les réponses (focus visible, annoncé en
  `aria-live`), Entrée valide ; 1/2/3/0 restent actives. Cibles ≥ 44 px en mobile.
- Action → décision normale (narration, effets réels, évaluation inchangés). Équipe → envoi d'équipe
  (le dossier reste ouvert ; refus avec le message du prompt 68 si plus d'effectif).

## Contraintes respectées

- `game.js` et Q1–Q61 inchangés ; la correspondance réponse → action/équipe vit dans la couche
  d'affichage (`carte.js`) et est testée unitairement (`scripts/test-jeu.mjs` : mapping par type
  d'alerte, mélange reproductible, aucune réponse sans source réelle).
- Pas d'indice de correction sous les réponses (prompts 50/66).
