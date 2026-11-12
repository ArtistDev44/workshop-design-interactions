# SPEC — trailer « Nantes en régulation » (storyline A, « sans arrêt »)

GOAL:    après 30 s, le spectateur sait qu'il va rejouer une vraie semaine du réseau nantais, dossier par dossier, et veut lancer la partie.
OUTPUT:  HyperFrames 0.9.39, 1920 × 1080, 30 i/s.
TIME:    30,00 s × 30 = 900 images ; musique « Heroic Age » 129 BPM → 1 temps = 0,4651 s = 13,95 images, 1 mesure = 1,8605 s ;
         l'impact orchestral (52,65 s de la piste) tombe à 22,33 s du film (extrait pris à 30,32 s).
LOOK:    fond #0D0C0C (Background du Pixel Design System), encre #FFFFFF, accent #D4031C réservé aux blocs-titres,
         à l'URL et au logo ; JetBrains Mono 800, titres 64 px (5,9 % de la hauteur), textes du carton 28–40 px ;
         médium = la capture du jeu en pixel art, jamais retouchée (ni filtre, ni grain CSS) ; aucune ombre, aucun halo.
OBJECTS: la salle de contrôle (capture), l'écran du PC, le téléphone de Camille, la carte du réseau, un dossier et ses
         3 répliques, les jauges Fluidité / Réputation / Budget, le logo bulle-pin (favicon.svg, 16 × 16 px → carrés de 25 px).
MOTION:  punch-in : arrivée à +6 % qui se pose en 0,3 s `expo.out`, puis poussée linéaire jusqu'à la coupe (échelles
         1,0 → 1,22 en plan large, 1,6 → 1,9 sur un contrôle) ; titres : flou 8 px → 0 en 0,18 s `power4.out`, sortie
         0,15 s `power3.in` ; 3D : plongée `cubic inOut` 1,86 s ; secousse du climax 3 px max, 0,2 s par plan.
SHOTS:
  0,00–1,86  hook — 3D Three.js : 96 lignes réelles (lignes.json) s'allument, trams en rouge d'abord ; « Tracés réels Naolib · Open Data » ; cut sec sur le temps.
  1,86–4,65  accroche — capture 32,6 s : la salle de contrôle, poussée 1,0 → 1,22 vers le PC.
  4,65–8,37  tension — 4 plans d'un temps double (0,93 s) : JOUR 1/6 (16,3), téléphone (20,6), téléphone (24,2), signalement Couëron (44,2) ; titre « Une vraie semaine » en haut à gauche.
  8,37–11,63 révélation — capture 40,3 s : le clic sur l'écran, la caméra du jeu entre dans le PC (transition causée par l'objet).
  11,63–22,33 preuve — dossier 1/16 (48,4), équipe Police glissée (52,0, ×2), réplique 1 choisie (76,4), jauges + journal (79,3, titre « Chaque dossier, un choix »), dossier Fictif ligne 1 (119,6).
  22,33–26,51 climax — 9 plans d'un temps (0,465 s) : carte ligne 1, journal, alerte météo, journal, entrée dans le PC, JOUR 1/6, journal, carte, sieste.
  26,51–30,00 carton — logo construit rangée par rangée depuis la pointe (0,05–0,7 s), titre pixel essuyé en 24 pas (0,78 s), sous-titre, URL, données, musique ; tenu ≥ 2 s ; fondu musical 1,6 s.
Transitions (4 types) : coupe sur le temps, zoom à travers l'écran (celui du jeu), punch-in, logo « joué ».
BANNED:  titre sur capture assombrie ; logo dans un coin ; liste de fonctionnalités en cartes ; halo / bloom / particules ;
         dégradés violets ; UI inclinée en 3D ; écran recréé ; chiffre absent du jeu (d'où « JOUR 1/6 » montré tel quel
         plutôt qu'un « 7 jours » ; « ~15 décisions » de `jeu/00-concept.md` écarté car le jeu affiche « Dossier n / 16 ») ;
         plus de 3 éclairs par seconde ; plein écran rouge clignotant.
QA:      0,9 (3D lisible), 3,0 (bureau), 6,0 (titre sans masquer le message), 9,5 (entrée PC), 12,5 (dossier lisible),
         19,0 (titre + jauges), 22,6 (premier plan du climax), 29,5 (carton complet), durée = 30,0 s.

Storylines non construites (story.md) : B « la donnée devient dossier » (un seul plan continu de lignes.json vers un
dossier), C « 6 jours en coupes » (un carton JOUR n/6 par mesure). [À COMPLÉTER : validation par le groupe]
