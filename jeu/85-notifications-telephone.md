# 85 — Le téléphone, fil de notifications vivant (prompt 90)

Code : `notifs-tel.js` (nouveau : logique `NotifsTel` testée — plan du jour, rythme, priorités ; interface — écran
de verrouillage, centre de notifications, onglet En direct, clavier), `telephone.js` (ouverture, chargement du direct
au clic), `bureau.js` (le téléphone posé s'allume et vibre pour de vraies notifications, pastille des non lues ;
l'animation au hasard est retirée), `immersion.js` (infobulle avec le nombre de non lues), `sketch.js` (boucle et
clavier), `sauvegarde.js`, `confort.js` (Ne pas déranger), `taches-ui.js` (option 8), `data/messages.json`
(modèles Camille / chauffeurs, validés par `generer-messages.mjs`), `i18n.js`. Audit API : § 8 de
`contexte/audit-api-open-data-nantes.md`.

## Sources (une appli par source, icône pixel 8 × 8 + nom)
| Appli | Source | Quand |
|---|---|---|
| Agenda | Agenda Nantes Métropole (semaine jouée) | 1 h avant l'affluence réelle du jour, sinon fin de matinée |
| Météo | Open-Meteo (jour joué) | seulement si pluie ≥ 1 mm, rafales ≥ 40 km/h ou gel |
| Info travaux | changelog GTFS (perturbations du jour) | matin |
| Loire | Hub'Eau, `data/loire.json` | seulement si la date jouée est dans la période des relevés ; le fichier ne contient que médiane / min / max, la notification cite ces valeurs (pas d'heure de relevé inventée) |
| Messages | partie : Camille (inspection du jour, cellule de crise, agenda), chauffeurs sans nom (dossier réel avec ligne) | rattachés au fait ; 3 variantes par fait |
| Régul' | partie : jauge < 30 (alerte), objectif atteint, équipe sur place, avertissement du patron, badge | à l'événement |
| Quai | partie : plaintes en attente sur @regul.nte | à l'événement |
| Rappels | partie : fin de service (1 h avant), rapport du soir (20 min avant) | fin de journée |
| Parkings, Vélos, Trafic routier, Pollens | Open Data Nantes Métropole, en direct | **seulement** en mode « Aujourd'hui » ou dans l'onglet « En direct aujourd'hui » (heure du relevé ou de consultation, mention « pas de la semaine jouée ») |

Une donnée absente → pas de notification. 3 variantes de texte par type (Jeu.variante, graine).

## Rythme, priorités, Ne pas déranger
- Au plus **1 spontanée toutes les 20 min de jeu** (sauf alerte), **10 au plus par jour** ; jamais pendant un
  panneau de décision ouvert ni une fenêtre de tâche (elles attendent).
- Priorités : alerte > partie > info réelle > ambiance ; un lot n'affiche que la plus prioritaire, le reste va dans
  le centre (« +N autres »).
- Ce qui est déjà une notification de bureau (prompt 77 : équipe, plainte) n'est **pas** spontané sur le téléphone ;
  il reste dans le centre.
- **Ne pas déranger** (bouton du téléphone, ou Paramètres → Options de jeu, touche 8) : plus de vibration ni de son,
  seules les alertes passent.
- Arrivée : le téléphone posé s'allume, vibre 2 px (fixe si animations réduites), pastille rouge ; son court par
  catégorie (suit M) ; `aria-live` lit la notification.

## Téléphone en main
Écran de verrouillage (heure et date du jeu, fond nuit / pluie du jour joué), onglets Notifications · Agenda ·
En direct (si une source a répondu). Notifications groupées par appli (la plus récente en haut), pile dépliable,
« Tout effacer » par groupe, ✕ pour ignorer. Ouvrir → l'appli du PC concernée ; pendant un dossier, une info
météo, travaux, agenda ou chauffeur lue au bon moment révèle la source correspondante sans coût (bonus déjà prévu,
prompt 50) ; aucun conseil d'action, aucun effet sur les jauges. Clavier : Tab onglet, ↑ ↓, Entrée ouvrir, Suppr
ignorer, Échap reposer.

## Sauvegarde
Notifications de la journée (lues, ignorées), compteur et heure de la dernière spontanée ; les arrivées à venir
sont recalculées. Le direct n'est jamais sauvegardé (rechargé au clic). Ne pas déranger : `localStorage`.

## Vérifications
`npm run build`, `npm test` (361 contrôles) : chaque type seulement si sa donnée existe, aucune source en direct
dans une semaine archivée, rythme (≤ 10 / jour, ≥ 20 min, rien pendant un panneau ouvert), regroupement, pas de
doublon avec le bureau, alerte prioritaire, Ne pas déranger, plan reproductible par la graine, appels sobres
(10 min, 6 s, `limit=1`), sauvegarde. Chromium FR / EN : bureau (téléphone allumé, pastille), centre, ignorer,
onglet Agenda, onglet En direct (4 sources réelles d'aujourd'hui), semaine complète sans erreur.
Limites : la pile d'un groupe se déplie quand la place le permet (sinon après avoir ignoré des notifications) ;
en portrait mobile, le téléphone garde son affichage actuel (cibles ≥ 44 px des boutons principaux).
