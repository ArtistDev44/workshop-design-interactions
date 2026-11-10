# 37 — Mode histoire, un élément de jeu par semaine, rapport papier, cinématiques de fin (prompt 41)

Les décisions Q1–Q61 ne changent pas. Tous les chiffres affichés (scores, jauges, dossiers, plaintes, décisions) sont ceux de la partie jouée.

## Deux modes (`menu.js`, `histoire.js`)
- « Nouvelle partie » ne liste plus les quatre semaines, mais deux grandes cartes.
  - **Mode histoire — ★ recommandé.** Il enchaîne la semaine réelle facile (14/09, compteur 60 s), puis la normale (02/11, 30 s), puis la difficile (12/10, 15 s), triées d'après le `niveau` de `data/semaines.js`. La carte indique la prochaine étape (« semaine n/3 — nouvel élément »).
  - **Mode temps réel.** Cadenas dessiné par le code et mention « Verrouillé : terminez le mode histoire » tant que l'histoire n'est pas finie. Toujours indisponible hors ligne.
- Progression : `localStorage` `pxe-nte001-histoire` = `{ termine, scores: {1, 2, 3} }`. Relancer l'histoire après l'avoir terminée repart de la semaine 1, et le temps réel reste débloqué.
- Le chapitre en cours se déduit de la semaine jouée (`chapitreCourant()`). « Reprendre » (prompt 33) fonctionne donc pour chaque semaine.
- La case « Prendre en main » (prompt 37) reste sur cet écran.

## Un élément de jeu de plus chaque semaine
Idées étudiées : plaintes des Nantais, équipes de terrain, imprévus de journée, conflits entre lignes, contradictions de sources, budget contraint, incidents en chaîne, appels radio des conducteurs, presse locale. Retenues : des mécaniques déjà codées et testées, ouvertes progressivement.

| Semaine | Élément ajouté | Verrouillé avant |
|---|---|---|
| 1 — Prise de poste | Dossiers, jauges, **plaintes des Nantais** (app Community) | — |
| 2 — Équipes de terrain | **Envoi d'équipes** depuis la carte (coût en budget, pompiers à partir de 70) | `Jeu.envoyerEquipe` → « disponibles à partir de la semaine 2 » |
| 3 — La crise | **Imprévus de journée** (météo aggravée, heure de pointe, panne de messagerie) et **conflits entre deux lignes** | `Jeu.tirerModificateur`, `Jeu.conflit` |

- `Jeu.elementDebloque(nom)` (dans `game.js`, redéfini par `histoire.js`) contrôle ces verrous. En temps réel, tout est actif.
- Chaque semaine (sauf la toute première partie, qui garde l'intro de Camille) s'ouvre par une **conversation au téléphone** avec le patron (prompt 42). Il y présente le nouvel élément.

## Rapport papier sur la table
- À la fin des semaines 1 et 2, et en temps réel :
  - le PC affiche « RAPPORT IMPRIMÉ » ;
  - le joueur se lève au bout de 1,6 s ;
  - une **feuille** sort de sous l'écran et glisse sur la table, entre le pied de l'écran et le clavier (plan « proches », prompt 40). Elle porte un petit repère clignotant.
- La feuille est un objet cliquable (Tab, Entrée, infobulle). Ouverte, c'est un papier à texte machine qui reprend le bilan réel :
  - en-tête, période, score, titre et texte de la fin ;
  - les trois jauges ;
  - dossiers traités et plaintes ;
  - jusqu'à 3 décisions clés et le profil ;
  - un tampon incliné : VALIDÉ, À SURVEILLER ou À REVOIR.
- Boutons :
  - mode histoire : « Semaine suivante (Entrée) », avec l'annonce du prochain élément ;
  - temps réel : « Rejouer » / « Menu principal ».
- L'ancien écran de fin dans l'ordinateur n'est plus affiché, sauf comme repli.

## Trois cinématiques de fin
- Après la semaine 3, une cinématique remplace le dernier rapport, selon la fin (bonne, moyenne, mauvaise). Elle est dessinée par le code, en 3 plans de 6,5 s, avec bandes noires et sous-titres `t()` :
  1. **La ville** : trams sur un pont au-dessus de la Loire. À l'heure et rapides sous un ciel d'aube (bonne), plus lents sous un ciel gris (moyenne), à l'arrêt la nuit sous la pluie, avec des feux qui clignotent au plus 1 fois par seconde (mauvaise).
  2. **La lettre de la direction**, posée sur le bureau, avec son tampon.
  3. **La pièce**, en zoom lent, et le bilan réel : « Semaine 1 : x · semaine 2 : y · semaine 3 : z — mode temps réel débloqué ».
- Commandes : Entrée, Espace, → ou clic pour le plan suivant, Échap ou « Passer » pour tout passer. Avec animations réduites : pas de fondu, pas de zoom, plans fixes.
- À la fin : retour au menu principal, temps réel débloqué (annonce `aria-live`).

## Vérifications
- `npm run build` et `npm test` OK.
- Test automatisé de l'histoire complète, sans erreur console :
  - semaine 1 : équipes et crise verrouillées ;
  - semaine 2 : équipes ouvertes, crise verrouillée ;
  - semaine 3 : tout est ouvert ;
  - rapport sur la table → lecture → semaine suivante → conversation du patron ;
  - après la semaine 3 : 3 plans de cinématique ;
  - à la fin : temps réel débloqué, progression enregistrée.
- Tests des prompts 25 à 40 relancés, sans régression.
- Difficulté (simulation de `36-tests-difficulte.md`) avec le déblocage progressif :

| Semaine | Expert | Moyen | Passif |
|---|---|---|---|
| Facile | 237 | 178 | 92 |
| Normale | 259 | 179 | 115 |
| Difficile | 258 | 173 | 110 |

  En semaine facile, l'expert reste à 3 points de la bonne fin : c'est l'effet du hasard des dés, puisqu'il y a moins de tirages sans imprévus. La hiérarchie bien jouer / jouer au hasard / ne rien faire est conservée.
