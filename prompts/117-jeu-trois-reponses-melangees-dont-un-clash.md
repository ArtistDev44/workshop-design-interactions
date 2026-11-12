# Prompt 117 — Jeu « Nantes en régulation » : trois réponses mélangées et indiscernables, dont une qui clashe le plaignant

Demande d'origine (12/11/2026) :

> On pourrait avoir 3 réponses à donner aux plaignants, le tout mélangé et indiscernable. Il faudrait qu'un
> des 3 choix clashe le plaignant assez violemment pour inciter le joueur à choisir cette option
> indépendamment des conséquences.

## 1. Trois réponses, pas quatre

Dans la fenêtre du plaignant (prompt 107), chaque dossier propose **trois** répliques, tirées de sa
catégorie (`data/reponses.json`) :

| Réplique | Ce que c'est |
|---|---|
| A | la **meilleure réponse** pour la situation, telle que le jeu la calcule déjà (`Jeu.journaliser` : effet attendu le plus fort) |
| B | une **autre réponse** de la catégorie, choisie de façon déterministe (numéro du dossier) |
| C | le **clash** : une réplique insolente, adressée au plaignant |

- **Mélangées :** l'ordre des trois est tiré de façon déterministe par dossier, sans aucun dé du jeu. La
  bonne réponse n'est donc jamais toujours la première.
- **Indiscernables :**
  - même style et même taille ;
  - aucun signe, aucune couleur ni aucune tendance affichée qui trahirait la bonne réponse ;
  - touches 1 à 3 selon la position.
- **« Pouvez-vous m'en dire plus ? »** (E, prompt 116) reste en quatrième ligne. Ce n'est pas une
  décision.

## 2. Le clash

- **Texte :** trois variantes par catégorie, en FR et en EN (clés `clash.<catégorie>.1..3`). Il est
  franchement insolent, drôle et tentant, mais **sans insulte visant une origine, un genre, un handicap ni
  aucune caractéristique d'une personne**.
- **Mots grossiers :** ils sont **masqués par des symboles** (`&#@!`), comme dans une BD.
- **Effet en jeu :**
  - c'est la réponse « attendre » de la catégorie (on ne fait rien), plus un **malus de réputation
    −8** (`REGLAGES.malusClash`) ;
  - la narration le dit (« Le plaignant a mal pris votre réponse ») ;
  - la décision compte comme ratée dans le Journal et chez le patron (`Jeu.evaluer`).
- **Aucune autre règle ne change** : dés, situations ×1,25, aggravation des lignes.

## 3. Vérifications

- `npm test` vérifie, sur tous les dossiers des trois semaines, en FR et en EN :
  - 3 répliques par dossier, dont exactement 1 clash et la meilleure réponse ;
  - l'ordre n'est pas toujours le même ;
  - aucune variable laissée vide.
- Une décision « clash » applique bien le malus et compte comme ratée.
- `npm run build` vert ; audit des textes à 0 défaut sur la fenêtre du plaignant.
