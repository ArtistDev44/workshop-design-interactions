# 17 — Profondeur tactique, malus et économie (prompt 23)

> **Révision du 10/11/2026 (retour de rendu)** : le modificateur **« erreur système sur l'ordinateur »** est **supprimé** : plus de fausse panne, d'écran qui glitche, de bannière « ERREUR SYSTÈME » ni d'action bloquée. Il reste trois modificateurs : météo aggravée, heure de pointe, panne de la messagerie du patron. Une sauvegarde qui contenait cette erreur est reprise sans modificateur.

Décisions verrouillées. Aucune donnée inventée : conseils, objectifs et profil sont calculés à partir des incidents réels de la semaine, des jauges et du budget de la partie en cours.

## Conseil contextuel (`Jeu.conseil(d)`)
Une phrase factuelle au-dessus des actions du dossier. Elle ne recommande jamais d'action. Ordre de priorité :
1. retard ≥ 18 min et réputation déjà en baisse (décisions ou commentaires récents) : « Ligne X à +Y min, la réputation baisse déjà sur les réseaux. » ;
2. une jauge sous 30 ;
3. contradiction ou conflit de sources ;
4. météo, affluence ou heure de pointe ;
5. sinon : rappel du budget.
Quand une jauge passe sous 30, le patron reprend le conseil, une fois par jauge et par jour.

## Modificateurs (un par journée, graine fixe)
| id | Durée | Effet |
|---|---|---|
| `erreur_systeme` | 30 s | une action est indisponible, l'écran du poste « glitche » (≤ 3 changements/s, sans flash ; icône fixe si mouvement réduit) |
| `meteo_aggravee` | 60 s | effets ×1,5 |
| `heure_pointe` | 45 s | compteur de décision ×0,8 |
| `panne_messagerie` | 60 s | application Patron hors ligne |

Le modificateur est tiré en début de journée, démarre au premier incident et s'affiche dans le bandeau sous la liste des lignes, avec l'objectif du jour. Il est annoncé dans la consigne du patron.

## Objectifs de journée
Fluidité ≥ 40, puis fluidité ≥ 45, réputation ≥ 45, réputation ≥ 50, budget ≥ 30 (à partir du jour 5, le même objectif est repris).
- Atteint : budget +10, ou réputation +5 si l'objectif porte sur le budget.
- Raté : −5 sur la jauge de l'objectif.
- Le résultat est inscrit dans le mail de fin de journée.

## Malus (table affichée dans l'aide, touche H)
| Malus | Condition | Conséquence |
|---|---|---|
| Incident non traité | dossier expiré sans décision | conséquences naturelles (Q25) |
| Sieste non interrompue | « Se réveiller » raté | −5 sur la jauge de l'incident |
| Objectif raté | jauge sous le seuil en fin de journée | −5 sur cette jauge |
| Équipe inutile | équipe envoyée sur un incident déjà résolu (carte : « dernier incident ») | coût perdu, réputation −3 |
| Budget épuisé | budget à 0 en fin de journée | réputation −8 |

## Économie
- Paliers de budget (< 20, entre les deux, ≥ 70) : un message du patron par palier et par jour.
- Les pompiers ne sont disponibles que si le budget est ≥ 70.
- Si le budget ne suffit pas, le message indique « Budget insuffisant (X/Y) ».

## Fin personnalisée
« Profil de la semaine » sur l'écran de fin : phrase de synthèse, objectifs atteints x/n, meilleur jour, nombre d'équipes envoyées, malus le plus fréquent.

## Test
`Jeu.forcerModificateur = 'erreur_systeme'` (ou un autre id) avant `Jeu.debutJourneeTactique()` force un modificateur.
