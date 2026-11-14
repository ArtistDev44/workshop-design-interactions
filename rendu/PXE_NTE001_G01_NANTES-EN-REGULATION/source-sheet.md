# Fiche-source V1 — Nantes en régulation (PXE-NTE001-G01-W01)

Format du livret (fiche-source V1). Contexte et propriétés observables remplis au prompt 59 d'après `jeu/00-concept.md` et le code (faits vérifiables) ; la propriété écartée a été **confirmée par le groupe le 11/11/2026**.

| Champ | Contenu |
|---|---|
| Titre | Réseau de transports collectifs Naolib — offre, perturbations et temps réel |
| Lieu | Nantes Métropole |
| Type | Données ouvertes (réseau de transport) + archives météo |
| Contexte | Le réseau Naolib (tram, busway, bus) de Nantes Métropole publie en données ouvertes son offre théorique (GTFS, avec un changelog daté des perturbations), son temps réel (GTFS-RT) et l'agenda des événements de la métropole. L'œuvre rejoue une semaine réelle de ce réseau dans une salle de contrôle (`jeu/00-concept.md`). |
| URL / référence | Open Data Nantes Métropole : `244400404_transports_commun_naolib_nantes_metropole_gtfs` (GTFS + changelog daté), `244400404_reseau-transports-collectifs-naolib` (flux GTFS-RT), `244400404_agenda-evenements-nantes-metropole_v2` ; Open-Meteo archive (ERA5) |
| Date d'accès | 2026-11-09 (premiers instantanés Open Data Nantes Métropole) ; semaines d'archives et licences revérifiées le 2026-11-10 |
| Droits / licence | GTFS Naolib : ODbL, éditeur Semitan, via Open Data Nantes Métropole (métadonnées de l’API, vérifié le 2026-11-14) ; GTFS-RT et agenda : Licence Ouverte (Nantes Métropole) ; Open-Meteo : CC BY 4.0 (Attribution 4.0 International), vérifié sur https://open-meteo.com/en/licence le 2026-11-10 — attribution requise avec lien près des données affichées (le jeu cite « Open-Meteo » à l'accueil et au bilan) |
| Relevés | Tracés de 96 lignes (data/lignes.json), 3 semaines d'archives (data/semaines/), flux GTFS-RT décodé (mode « aujourd'hui ») |
| 3 propriétés observables | 1. le **retard en minutes par ligne** (GTFS-RT, seuil de 10 min) ; 2. les **perturbations datées** du changelog GTFS (nature : travaux, manifestation, mouvement social, événement), souvent sans ligne ni durée ; 3. le **contexte du jour** : météo journalière (températures, pluie, rafales, archive Open-Meteo) et événements de l'agenda (type, lieu). |
| 1 propriété volontairement écartée | Confirmée par le groupe (11/11/2026) : les **alertes de service** du flux GTFS-RT (« alerts », déclaré dans `gtfsrt.js` mais non exploité) — le jeu ne garde que les retards mesurés (« trip updates »), pour que chaque dossier repose sur un chiffre et non sur un message rédigé. |

Limite assumée : le changelog GTFS ne donne ni durée de retard ni toujours la ligne : les dossiers
d'archive n'affichent que ce que dit la source. Seul le mode « aujourd'hui » (GTFS-RT) donne des
retards en minutes.
