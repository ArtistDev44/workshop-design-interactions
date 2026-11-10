# api.md — Toutes les API en ligne pour le jeu « Salle de contrôle Nantes »

Sources : portail [data.nantesmetropole.fr](https://data.nantesmetropole.fr/explore/) (audit du 9 nov 2026 : 592 jeux publiés, 570 interrogeables par API, ~13 flux réellement temps réel), [transport.data.gouv.fr](https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib) (miroir national Naolib) et [Open-Meteo](https://open-meteo.com/en/docs).

Règles communes : aucune clé requise, licence Ouverte / ODbL, CORS ouvert (`Access-Control-Allow-Origin: *`), quota Explore API = 10 000 requêtes/jour. Lecture des données en `setup()` + `setInterval`, jamais dans `draw()`. Fallback local obligatoire (`data/fallback.json`, voir `07-fallback-offline.md`).

## 1. API technique unique (portail Opendatasoft)

| API | URL / accès | Données | Fréquence | Usage dans le jeu |
|---|---|---|---|---|
| Explore API v2.1 | `https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/{dataset_id}/records?select=…&where=…&limit=…` | 570 jeux en JSON, filtres géo (`geofilter.distance=lat,lon,rayon`) | selon le jeu | Accès générique à tous les jeux « table » ci-dessous ; console : `/api-console/explore/v2.1/` |

## 2. Flux temps réel du réseau Naolib (URLs dédiées, hors Explore API)

| Flux | Dataset / accès | Données clés | Fréquence | Usage dans le jeu |
|---|---|---|---|---|
| SIRI lite (REST) | `244400404_services_temps_reel_transports_commun_naolib_nantes_metropole_sirilite` | StopMonitoring (prochains passages réels), Situation Exchange (perturbations), CheckStatus | continu | Détection des incidents (retard ≥ 10 min), données du dossier, alertes travaux/déviations |
| SIRI (abonnement, profil France 2.0) | `244400404_services_temps_reel_transports_commun_naolib_nantes_metropole_siri` | Service complet XML | continu | Flux temps réel robuste (recommandé plutôt que GTFS-RT) |
| GTFS-RT | `244400404_services_temps_reel_transports_commun_naolib_nantes_metropole_gtfs_rt` | TripUpdates (retards), VehiclePositions (positions), Alerts | continu | Panneau gauche : état des lignes (à l'heure / en retard / alerte) |

## 3. Offre statique du réseau (structure, semaine rejouée)

| Dataset | ID | Données clés | Fréquence | Usage dans le jeu |
|---|---|---|---|---|
| GTFS Naolib | `244400404_transports_commun_naolib_nantes_metropole_gtfs` | Arrêts, horaires, circuits (shapes), stop_times | régulière | Semaine à rejouer, liste des lignes, affluence estimée (fréquence/heure), source « horaire prévu » des données contradictoires |
| NeTEx Arrêts | `244400404_arrets_transports_commun_naolib_nantes_metropole_netex` | Localisation précise des arrêts, équipements, correspondances | régulière | Carte du réseau, positions des arrêts |
| NeTEx Offre | `244400404_offre_transports_commun_naolib_nantes_metropole_netex` | Structure complète de l'offre | régulière | Lignes et réseau |
| Tronçons des voies | `244400404_troncons-voies-nantes-metropole` | Réseau routier carrefour à carrefour (géométrie) | statique | Itinéraires alternatifs pour l'action « dévier la ligne » |
| Tronçons des chaussées | `244400404_troncon-chaussee-nantes-metropole` | Chaussées des voies | statique | Carte détaillée |
| Voies | `244400404_voies-nantes-metropole` | Linéaire de voie | statique | Noms de rues dans les dossiers |
| Quartiers de Nantes | `244400404_quartiers-de-la-ville-de-nantes` | 11 quartiers | statique | Zones du territoire dans les textes |
| Quartiers des communes | `244400404_quartiers-communes-nantes-metropole` | Découpage métropole | statique | Idem, échelle métropole |

## 4. Jeux « live » interrogeables via Explore API v2.1

| Dataset | ID | Données clés | Fréquence | Usage dans le jeu |
|---|---|---|---|---|
| Fluidité des axes routiers | `244400404_fluidite-axes-routiers-nantes-metropole` | `etat_trafic`, vitesse, débit, géométrie (889 tronçons) | ~5 min | Jauge fluidité, dossiers « axe saturé », contexte des déviations |
| Temps de parcours itinéraires | `244400404_itineraires-nantes-metropole-temps-parcours` | Temps de parcours réels | ~5 min | Mesure de l'effet de l'action « dévier la ligne » |
| Parkings publics — disponibilités | `244400404_parkings-publics-nantes-disponibilites` | Places libres, statut (27 parkings) | quelques min | Contexte stationnement, panneau gauche |
| Parcs relais — disponibilités | `244400404_parcs-relais-nantes-metropole-disponibilites` | Places libres P+R | ~2 min | Action « rediriger vers P+R » |
| Vélos libre-service — dispo temps réel | `244400404_disponibilite-temps-reel-velos-libre-service-naolib-nantes-metropole` | `available_bikes`, places (120 stations) | temps réel | Contexte « dernier kilomètre » |
| GBFS Naolib Micromob (vélos + trottinettes) | via [transport.data.gouv.fr](https://transport.data.gouv.fr/datasets/offre-et-temps-reel-du-service-naolib-micromob-de-nantes-metropole-au-format-gbfs) | Stations et remplissage temps réel | temps réel | Alternative micromobilité |
| Alertes et notifications | `244400404_alertes-notifications-nantes-metropole` | Alertes en cours : circulation, services municipaux, fermetures, météo | continu | Dossiers d'incident multi-thématiques |
| Agenda des événements | `244400404_agenda-evenements-nantes-metropole_v2` | Événements du jour, lieux, horaires | quotidien | Pics d'affluence réels (match, concert, manifestation) ; prompt 38 : notifications du téléphone du bureau (`records?limit=4&select=nom,lieu,ville,date,heure_debut,types_libelles,annule&where=date=date'AAAA-MM-JJ' AND annule='non'&order_by=heure_debut`, au clic, délai 6 s, repli : événements réels de la semaine jouée) |
| Indice ATMO | `323266205_indice-atmo-nantes-metropole` | Qualité de l'air, `coul_qual` (couleur officielle) | quotidien | Alerte pollution, jauge satisfaction, palette UI justifiée |
| Épisodes de pollution de l'air | `323266205_episodes-pollution-air-loire-atlantique` | Niveaux recommandation/alerte (J, J+1, J-1) | quotidien | Alertes sanitaires dans les dossiers |
| Alertes pollens | `323266205_alerte-pollens-nantes` | Niveau par groupe (arbre/herbacée) | quotidien | Contexte saisonnier (réserve) |
| Comptages vélo | `244400404_comptages-velo-nantes-metropole` | Passages heure par heure (colonnes 00–23) par compteur | quotidien | Profil d'affluence vélo selon l'heure de la semaine rejouée |

## 5. Stationnement, covoiturage, tarification

| Dataset | ID | Données clés | Fréquence | Usage dans le jeu |
|---|---|---|---|---|
| Lieux de stationnement | `244400404_lieux-stationnement-nantes-metropole` | Géoloc, capacité, services des parkings/P+R | statique | Carte des lieux de stationnement |
| Zones de stationnement | `244400404_stationnement-nantes-zones` | Zones payantes/bleues | statique | Carte |
| Lieux de covoiturage Naolib | `244400404_lieux-covoiturage-nantes-metropole` | Aires, délaissés, P+R, points d'autostop | statique | Action « rediriger vers le covoiturage » |
| Lignes Covoit'ici (GTFS) | `244400404_ligne-covoiturage-covoitici-nantes-metropole-gtfs` | Lignes de covoiturage (horaires, arrêts) | régulier | Offre covoiturage affichée |
| Tarifs transports en commun | `244400404_transports-en-commun-naolib-tarifs-01072026` | Tarifs Naolib | régulier | Coût de l'action « bus de renfort » (jauge réputation/budget) |
| Tarifs vélos Naolib | `244400404_services-velos-bicloo-nantes-metropole-tarifs` | Coûts VLS, véloparcs, location | régulier | Coût des déplacements vélo |
| Bornes de recharge VE | `234400034_-bornes-de-recharge@paysdelaloire` | Localisation, caractéristiques des bornes | régulier | (réserve) contexte électro-mobilité |

## 6. Hors portail Nantes Métropole

| API | URL | Données clés | Fréquence | Usage dans le jeu |
|---|---|---|---|---|
| Open-Meteo | `https://api.open-meteo.com/v1/forecast` + `https://archive-api.open-meteo.com/v1/archive` (Nantes 47.2184, -1.5536) | Température, vent, précipitations — prévision et **archive** (rejouer une semaine passée) | horaire | Alertes météo (seuils), effets contextuels sur les jauges, météo du panneau gauche |
| transport.data.gouv.fr (PAN) | [Réseau Naolib](https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib) | Miroir des flux GTFS, NeTEx, SIRI, SIRI lite, GTFS-RT, GBFS | continu | Redondance/validation des flux Naolib |
| Hub'Eau — Hydrométrie v2 (eaufrance / Vigicrues) | `https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr?code_entite=M800001010&grandeur_hydro=H&size=1&sort=desc` — station M800001010 « La Loire à Nantes - Pont Anne de Bretagne » (sans clé, CORS ouvert ; la v1 renvoie 403) | Hauteur d'eau temps réel `resultat_obs` en mm (→ m) | ~5 min ; lue dans `setup()` puis toutes les 10 min | Prompt 34 : hauteur du bandeau de Loire dans la baie vitrée. Repli : médiane figée 4,14 m (3 970 relevés du 11/10 au 10/11/2026, min 0,76 m, max 6,83 m) dans `data/loire.json` / `data/loire.js` |
| Patrimoine arboré (référence livret) | `244400404_patrimoine-arbore-nantes-metropole` via Explore API | 124 583 arbres (genre, espèce, hauteur, position) | statique | Source documentaire du corpus (agrégats via `group_by`, jamais tout charger) |

## 7. Fallback hors ligne (pas une API)

| Élément | Accès | Contenu | Usage |
|---|---|---|---|
| `data/fallback.json` (+ `scripts/snapshot.mjs` → `data/fallback/{dataset_id}.json`) | local | 6 cas figés + semaine de référence (seed fixe) | Mode hors ligne auto si API injoignable (`07-fallback-offline.md`) |

## 8. À éviter (testé par l'audit du 9 nov 2026)

| Dataset | Raison |
|---|---|
| `244400404_alertes-info-trafic-nantes-metropole` | 0 enregistrement (vide) |
| Flux GBFS vélos historique (`…velos-libre-service-naolib-gbfs`) | Figé depuis juin 2024 → utiliser le dataset ODS de disponibilités temps réel ou le GBFS Micromob |
| `[Ancien] …stations-velos-libre-service…-disponibilites` (JCDecaux) | Dépublié, remplacé par le dataset ODS ci-dessus |
| `244400404_api-temps-reel-tan`, `…info-trafic-tan-temps-reel`, `…info-trafic-tan-previsionnel` | Remplacés par SIRI lite / SIRI |

## 9. Semaines rejouées — stratégie archive (sans collecte, officielle pour le rendu)

Il n'existe pas d'archive des flux temps réel SIRI/GTFS-RT côté Nantes Métropole. **La source officielle des semaines rejouées est donc l'archive publique existante**, aucune collecte n'est nécessaire :

| Archive | Accès | Contenu réel | Usage |
|---|---|---|---|
| Changelog du GTFS Naolib | Onglet « Informations » du dataset `244400404_transports_commun_naolib_nantes_metropole_gtfs` | Incidents datés réels : travaux, déviations, manifestations, mouvements sociaux (ex. « 10/10/24 : Foulées du tram, match, manifestation ») | Chaque entrée d'une semaine choisie = un dossier réel dans `data/fallback.json` |
| Versions archivées du GTFS | « Backed up resources » sur [transport.data.gouv.fr — Réseau Naolib](https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib) | Fichiers GTFS tels qu'à une date passée | Horaires réels de la semaine rejouée |
| Archive Open-Meteo | `https://archive-api.open-meteo.com/v1/archive` (Nantes 47.2184, -1.5536) | Météo horaire réelle (ERA5) de toute semaine passée | Alertes météo réelles + effets contextuels |
| Agenda des événements | `244400404_agenda-evenements-nantes-metropole_v2` via Explore API, filtre `where=` sur les dates | Événements réels d'une semaine passée | Pics d'affluence réels |
| 6 cas figés | `data/fallback.json` (voir `07-fallback-offline.md`) | Semaine de référence hors ligne, seed fixe | Mode hors ligne garanti pour l'évaluation |

Le mode « aujourd'hui en direct » (SIRI lite / GTFS-RT) reste distinct du mode « semaine rejouée » (archives). Le script `scripts/snapshot.mjs` + cron GitHub Actions reste une **option post-rendu** pour archiver soi-même les semaines futures.
