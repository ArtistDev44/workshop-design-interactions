# 04 — Jauges et fins

## Les trois jauges (0–100, décisions Q40, Q44)
- **Valeur de départ : 50** ; chaque action modifie une jauge de **±5 à ±15**
  points selon le contexte.
- **Poids égaux** dans le score combiné (Q44, décidé : score = somme des 3 jauges).
| Jauge | Ce qu'elle mesure |
|---|---|
| Fluidité du réseau | Retards absorbés, trafic global de la semaine |
| Satisfaction usagers | Communication, renforts, temps d'attente vécus |
| Réputation de la salle de contrôle | Cohérence des décisions, gestion des crises |

Chaque action modifie les jauges selon le **contexte** du dossier (météo,
heure de pointe, affluence, source de données choisie en cas de contradiction).

## Fins multiples (Q43)
Le bilan final calcule un **score combiné** (somme des 3 jauges, poids égaux) ;
la **jauge dominante** départage. Si une jauge passe **sous 20**, la jauge
clignote discrètement en cours de partie (Q46) et la fin « semaine noire »
s'applique.

Le bilan final combine les trois jauges :
- **Fin « Réseau fluide »** : fluidité dominante en fin de semaine.
- **Fin « Usagers entendus »** : satisfaction dominante.
- **Fin « Salle exemplaire »** : réputation dominante.
- **Fin « Semaine noire »** : au moins une jauge sous un seuil critique.

Le texte de fin raconte la semaine rejouée du point de vue de la salle de contrôle.

## Écran de fin (décisions verrouillées Q18, Q37)
Texte de fin + valeurs finales des trois jauges + **bilan détaillé** : nombre de
dossiers traités / 15 et **décisions clés** (celles qui ont le plus fait monter /
baisser les jauges) + boutons Rejouer / changer de semaine.
