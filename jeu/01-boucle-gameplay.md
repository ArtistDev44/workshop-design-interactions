# 01 — Boucle de gameplay

## Boucle principale
1. Un incident réel est détecté (ligne en difficulté ou alerte météo).
2. Le dossier s'ouvre dans le panneau de droite avec ses données :
   retard, affluence, raison si connue, éventuellement source contradictoire.
3. Le compteur de temps démarre.
4. Le joueur choisit une des 3 actions ou « ne rien faire ».
5. Les jauges sont mises à jour (effets contextuels), une courte narration
   s'affiche, puis l'incident suivant arrive.

## Détection des incidents
- **Ligne en difficulté** : retard ≥ 10 minutes par rapport aux horaires prévus
  (données temps réel Tanway/Lila Nantes Métropole).
- **Alerte météo** : seuils Open-Meteo sur la semaine choisie (vent, précipitations,
  température) impactant certaines lignes.
- **Conflit** : deux lignes en difficulté simultanées → le joueur choisit
  laquelle traiter en priorité.

## Paramètres de la boucle
- Environ **15 décisions** par partie (une semaine rejouée).
- **Compteur de temps** actif par décision, **30 secondes par défaut** (barre
  horizontale) ; à 0, le choix par défaut est « ne rien faire » (conséquences
  appliquées quand même).
- Fin de partie après le 15e dossier → écran de bilan et fin selon les jauges.
