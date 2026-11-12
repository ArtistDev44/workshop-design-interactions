# Prompt 119 — Jeu « Nantes en régulation » : de rares incidents inventés pour pimenter le rythme (agression, vol à main armée)

Demande d'origine (12/11/2026) :

> Je souhaite également que certaines plaintes soient inventées. Bien sûr, elles seront rares, mais
> seulement pour pimenter un peu la rythmique du gameplay, comme une agression en cours ou un vol à main
> armée.

## Exception assumée à la règle « aucune donnée inventée »

C'est une **décision explicite du groupe** (demande ci-dessus). Pour rester honnête :
- chaque incident inventé est **marqué comme fictif** : `fictif: true` et source « Scénario du jeu
  (fictif) » ;
- l'enquête, le Journal, le rapport de semaine et la Community l'affichent **« Fictif »** ;
- il n'est **jamais** mélangé aux statistiques présentées comme réelles (`Données`, crédits).

Les autres signalements restent tous réels.

## 1. Les incidents

| Type | Exemple de signalement | Équipes adaptées |
|---|---|---|
| Agression en cours | « Une personne est agressée à bord, ligne {ligne} » | police, ambulanciers |
| Vol à main armée | « Vol à main armée signalé à l'arrêt, ligne {ligne} » | police |

- **Fréquence :** **1 incident inventé par semaine au plus**, inséré dans le paquet de façon déterministe
  (graine de la semaine) : jour, heure entre 9 h et 19 h, ligne choisie parmi les **lignes réelles** du
  réseau (GTFS).
- **Désactivation :** `?fictifs=0` les retire. La partie hors navigateur (tests de règles) ne les contient
  pas, pour garder les résultats comparables.
- **Gravité :** élevée. La carte place l'incident sur le tracé de la ligne (prompt 106).
- **Plaignant :** plainte écrite pour le scénario (FR et EN), marquée fictive. Témoin paniqué, phrases
  courtes.

## 2. Les réponses (catégorie `securite`)

Nouvelle catégorie dans `data/reponses.json`, avec effets base + 1 dé comme les autres :

| Réponse | Réplique (exemple) | Famille |
|---|---|---|
| Intervenir | « On intervient, la police arrive. » | renfort, équipe police |
| Calmer | « Éloignez-vous et essayez de garder votre calme, on arrive. » | retenir |
| Arrêter le véhicule | « Le conducteur arrête le véhicule et ouvre les portes. » | dévier |
| Attendre | « On attend plus d'informations. » | rien |

- Le clash (prompt 117) existe aussi pour cette catégorie, dans les limites du prompt 117 : insolent, sans
  rien de haineux.
- **Équipes :** la police et les ambulanciers sont pertinents (`Jeu.equipesPertinentes`).

## 3. Vérifications

- Avec les incidents inventés : au plus un par semaine, toujours marqué « Fictif », toujours sur une ligne
  réelle.
- Sans eux (`?fictifs=0` et les tests) : les résultats des règles sont identiques à ceux d'avant.
- `npm test`, `npm run build`, audit des textes à 0 défaut.
- Livrables :
  - `jeu/117-119-clash-plaignants-incidents.md` ;
  - `prompts/README.md` ;
  - une ligne en tête de `journal.md`.
