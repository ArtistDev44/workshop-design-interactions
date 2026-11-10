# Prompt 44 — Jeu « Nantes en régulation », étape 31 : choix de la musique et immersion sonore

Demande d'origine (10/11/2026, reprise telle quelle) :

> Dans le menu paramètres : proposes de changer de musique (importes en de nouvelles libres de
> droits et cohérentes avec le thème pixel du jeu). Aussi ajoute :
>
> Voici ce que l'on peut ajouter en immersion sonore dans « Nantes en régulation », en
> s'appuyant sur ce qui est déjà prévu (jeu/09-parametres.md:10 : ambiance de salle de
> contrôle + bips d'interface, touche M, version jouable sans audio) :
>
> 1. Une ambiance de salle de contrôle vivante
>    Un fond sonore continu (bourdonnement de serveurs, ventilation, murmures radio) généré en
>    Web Audio (oscillateurs + bruit filtré), donc sans fichier externe et jouable hors ligne.
>    Des annonces radio distordues en arrière-plan, liées aux lignes de tram/bus du dossier
>    courant.
> 2. Des alertes sonores par incident
>    Un signal distinct quand un nouveau dossier arrive (retard ≥ 10 min ou alerte météo), avec
>    une intensité qui monte avec le nombre d'incidents simultanés.
>    Un son différent selon la source : GTFS-RT (retard) vs Open-Meteo (météo), pour que le
>    joueur apprenne à reconnaître la nature du problème à l'oreille.
> 3. Le compte à rebours sous pression
>    Un tic-tac ou un bourdonnement qui s'accélère quand le timer de décision descend sous les
>    dernières secondes — le son porte la pression du temps mieux qu'une barre visuelle seule.
> 4. Un feedback immédiat sur chaque action
>    Un « clic » de console différent pour chacune des 3 actions + « ne rien faire », afin que
>    la décision soit confirmée auditivement même si l'écran est regardé de loin (écran
>    d'exposition).
> 5. Les jauges rendues audibles
>    Quand une jauge (fluidité, satisfaction, réputation) chute brutalement, un stinger court ;
>    quand elle remonte, un son plus léger. Cela rend l'impact des décisions lisible sans fixer
>    l'écran.
> 6. La météo comme couche sonore contextuelle
>    Pluie, vent ou canicule joués en fond (bruit blanc filtré) selon les données Open-Meteo de
>    la semaine choisie, renforçant le « contexte » déjà utilisé pour les effets des actions.
> 7. Les fins
>    Une courte signature sonore propre à chaque fin (bilan des trois jauges), pour marquer la
>    conclusion de la partie.

## Précisions de mise en œuvre
- Musiques : plusieurs morceaux **originaux, libres de droits (créés pour le projet)**, de
  style chiptune / pixel, générés en Web Audio (aucun fichier, hors ligne) ; choix dans les
  Paramètres, mémorisé ; « satisfaction » se lit aujourd'hui **budget** (prompt 22).
- Tout suit l'interrupteur Son (M) ; aucun flash ; jouable sans audio.

## Vérifications
- `npm run build`, `npm test` ; changement de musique (Paramètres, persistance) ; chaque
  signal déclenché au bon moment ; FR + EN. Documenter dans `jeu/40-…`. Fusion `main`.
