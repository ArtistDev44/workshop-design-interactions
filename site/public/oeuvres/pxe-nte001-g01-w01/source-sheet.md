# Fiche-source V1 — Nantes en régulation (PXE-NTE001-G01-W01)

Format du livret (fiche-source V1). Les champs d'analyse restent au groupe : `[À COMPLÉTER]`.

| Champ | Contenu |
|---|---|
| Titre | Réseau de transports collectifs Naolib — offre, perturbations et temps réel |
| Lieu | Nantes Métropole |
| Type | Données ouvertes (réseau de transport) + archives météo |
| Contexte | [À COMPLÉTER] |
| URL / référence | Open Data Nantes Métropole : `244400404_transports_commun_naolib_nantes_metropole_gtfs` (GTFS + changelog daté), `244400404_reseau-transports-collectifs-naolib` (flux GTFS-RT), `244400404_agenda-evenements-nantes-metropole_v2` ; Open-Meteo archive (ERA5) |
| Date d'accès | 2026-11-10 |
| Droits / licence | Licence Ouverte (Nantes Métropole) ; Open-Meteo : [À COMPLÉTER — vérifier la licence CC BY 4.0 des données] |
| Relevés | Tracés de 96 lignes (data/lignes.json), 3 semaines d'archives (data/semaines/), flux GTFS-RT décodé (mode « aujourd'hui ») |
| 3 propriétés observables | [À COMPLÉTER] |
| 1 propriété volontairement écartée | [À COMPLÉTER] |

Limite assumée : le changelog GTFS ne donne ni durée de retard ni toujours la ligne : les dossiers
d'archive n'affichent que ce que dit la source. Seul le mode « aujourd'hui » (GTFS-RT) donne des
retards en minutes.
