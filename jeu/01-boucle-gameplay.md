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
  (données temps réel Naolib GTFS-RT, Nantes Métropole).
- **Alerte météo** : seuils Open-Meteo sur la semaine choisie (vent, précipitations,
  température) impactant certaines lignes.
- **Conflit** : deux lignes en difficulté simultanées → **choix binaire
  explicite** « quelle ligne traiter en priorité ? » (Q27).
- Répartition lignes / alertes météo : selon les données réelles de l'API (Q36).

## Paramètres de la boucle
- Environ **15 décisions** par partie (une semaine rejouée).
- **Compteur de temps** actif par décision, **30 secondes par défaut** (barre
  horizontale) ; à 0, « ne rien faire » s'applique avec **les seules
  conséquences naturelles de l'incident non traité** — aucun malus
  supplémentaire (Q25).
- Fin de partie après le 15e dossier → écran de bilan et fin selon les jauges.

> **Prompt 87 — exceptions à Q6, Q16, Q25 et Q55 : décider sans chrono.** Par défaut, il n'y a plus de
> compteur de décision : ouvrir un signalement met l'horloge de jeu en pause tant que le panneau est affiché
> (elle tourne sur la liste, dans les autres applis et au bureau). Un signalement n'est « non traité » (Q25,
> conséquences naturelles) qu'**à l'heure de fin de service** s'il reste en file ; le départ anticipé (prompt
> 51) garde la même règle. La difficulté de la semaine (Q55) règle désormais les signalements pris en même
> temps (3 / 2 / 1), la vitesse d'aggravation du retard (×0,5 / ×1 / ×1,5) et le budget de départ
> (60 / 50 / 40). Le comportement précédent reste jouable en mode **« Défi chrono »** (Paramètres, touche 0,
> désactivé par défaut, palmarès séparé). Détails : `80-decision-sans-chrono.md`.
