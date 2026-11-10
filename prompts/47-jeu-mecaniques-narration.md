# Prompt 47 — Jeu « Nantes en régulation », étape 33 : nouvelles mécaniques, narration et contenu

Demande d'origine (10/11/2026) — parties « 2. Nouvelles mécaniques de jeu », « 3. Contenu et
données (toujours réelles, jamais inventées) » et « 4. Immersion et narration » :

> Système de compétences / arbre de régulation · Événements chaînés (conséquence différée) ·
> Personnages récurrents · Mode « inspection surprise » : un jour par semaine, un supérieur
> débarque et audite une décision passée · Classement / leaderboard local : meilleur bilan par
> semaine avec profil de fin (« le gestionnaire », « le pompier », « le gestionnaire discret »)
> · Nouvelles sources Open Data (travaux, parkings, Vélopop, qualité de l'air) · Plus de
> semaines archivées · Événements de l'Agenda plus exploités : un concert ou un match génère
> un afflux à anticiper · Nouvelles lignes si le réseau évolue · Journal de bord du régulateur
> (notes libres sauvegardées, affichées dans le bilan) · Fin alternative « démission » (les 3
> jauges sous le seuil critique → rendre son badge) · Épilogue personnalisé dans le mail (style
> de gestion d'après les décisions majoritaires) · Mode « journée type »

## Attendu (cette itération)
1. **Inspection surprise** : une fois par semaine, le patron audite une **vraie** décision
   passée (historique de la partie) et demande ce qu'elle visait ; bonne lecture → réputation
   +3, sinon −2.
2. **Palmarès local** (menu principal) : meilleur bilan par semaine (`localStorage`), avec un
   **profil de gestion** calculé sur les décisions réelles : « le pompier » (renfort
   majoritaire), « le stratège » (déviation), « le gestionnaire discret » (retenue), « le
   spectateur » (ne rien faire / compteurs à 0).
3. **Journal de bord** : notes libres (zone de texte HTML), sauvegardées avec la partie et
   imprimées sur le rapport papier.
4. **Fin « démission »** : si les trois jauges sont sous 20, un bouton « Rendre son badge »
   termine la semaine sur un rapport « DÉMISSION ».
5. **Épilogue personnalisé** : le mail de fin de journée ajoute une phrase sur le style de
   gestion (action majoritaire réelle de la journée).
6. **Agenda exploité** : chaque matin, si l'agenda réel du jour contient un concert, un match ou
   un spectacle, le patron prévient d'un afflux à anticiper (titre et lieu réels).

## Reporté (avec raison, à rediscuter)
- Arbre de compétences, événements chaînés : modifieraient les règles verrouillées Q1–Q61
  (effets et conséquences) ; à décider en groupe.
- Personnages récurrents : risque d'inventer des personnes ; possible à partir de
  `messages.json` si le groupe écrit les arcs.
- Nouvelles sources Open Data, semaines et lignes supplémentaires : demandent un nouvel
  échantillonnage des API et une étude des données (prompt dédié, scripts `preparer-semaines`).
- Mode « journée type » : nécessite de découper une semaine en journées jouables seules.

## Vérifications
- `npm run build`, `npm test` ; chaque mécanique déclenchée sur une vraie partie ; FR + EN ;
  sauvegarde (journal, palmarès). Documenter dans `jeu/42-…`. Fusion `main`.
