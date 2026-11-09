# 00 — Concept et spec verrouillée

**Titre du jeu : « Nantes en régulation »** (Q56).

## Phrase-problématique
« Rejouer une semaine réelle du réseau de transports nantais et prendre, en
salle de contrôle, les décisions de régulation qui préservent la fluidité du
réseau — chaque incident réel de l'API devenant un dossier à trancher sous
pression. »

## Spec verrouillée (décisions prises)
- **Thème** : transports en commun nantais (tram, bus), régulation en salle de contrôle.
- **Rôle du joueur** : régulateur / dispatcher qui alloue les voies et réagit aux alertes.
- **Départ** : le joueur sélectionne une semaine réelle (dans les limites de l'API).
- **Partie** : environ 15 décisions basées sur des incidents réels ; aucun événement inventé.
- **Détection d'incident** : retard ≥ 10 min sur les données temps réel, ou alerte météo.
- **Actions** : 3 actions + « ne rien faire ».
- **Pression du temps** : oui, un compteur est actif pendant chaque décision.
- **Effets sur les jauges** : version contextuelle (météo, heure de pointe).
- **Données contradictoires** : oui, cas où deux sources se contredisent.
- **Jauges** : fluidité du réseau, satisfaction usagers, réputation de la salle de contrôle.
- **Fins** : plusieurs fins selon le bilan des trois jauges.
- **UI** : plusieurs panneaux dans une salle de contrôle — carte/liste des lignes
  à gauche, dossier courant à droite.
- **Fallback** : 6 cas figés dans `data/fallback.json`, démo jouable hors ligne.

## Chaîne à tenir
source (données réelles Nantes) → grammaire (seuil de 10 min, alertes météo) →
système (boucle incident → décision → jauges) → œuvre (salle de contrôle p5.js).

## Mapping justifié en une phrase
« Le flux GTFS-RT Naolib fournit le retard réel des lignes et Open-Meteo la météo de
la semaine choisie : le seuil de 10 min et les alertes météo génèrent les
dossiers, et chaque action du joueur module les trois jauges selon le contexte. »
