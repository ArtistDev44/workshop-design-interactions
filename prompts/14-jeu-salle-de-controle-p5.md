# Prompt 14 — Jeu « Nantes en régulation » (œuvre p5.js)

## Objectif
Créer le jeu décrit dans `jeu/` : une salle de contrôle des transports nantais,
façon *Paper Please*, où le joueur rejoue une semaine réelle du réseau et tranche
des décisions de régulation à partir de données réelles (flux temps réel **Naolib
GTFS-RT** + Open-Meteo), avec fallback local obligatoire (`data/fallback.json`).

## Emplacement
Le jeu est une œuvre p5.js autonome, servie par le site :
`site/public/oeuvres/pxe-nte001-g01-w01/` (remplacer `g01` par le vrai numéro de
groupe). Il s'ouvre à
`…/patrimoine-exe/nantes/001/oeuvres/pxe-nte001-g01-w01/index.html` et sa fiche du
registre (prompt 06) pointe dessus via `lien_oeuvre`. Tous ses chemins sont
**relatifs** (`./sketch.js`, `./data/fallback.json`) : il fonctionne aussi ouvert seul.
**p5.js est copié en local** (`lib/p5.min.js`, version 1.11.11) : aucun CDN, sinon le
jeu ne démarre pas sans réseau.

## Données réelles : ce qui est possible (vérifié le 9 nov. 2026)
- **Retards** : flux GTFS-RT `trip-updates` de Naolib,
  `https://api.okina.fr/gateway/semgtfsrt/realtime/trip-updates/NAOLIBORG`
  (référencé par le jeu `244400404_reseau-transports-collectifs-naolib`). Sans clé,
  CORS autorisé, mais **format binaire protobuf (≈ 1 Mo par appel)** et **aucun
  historique** : on ne lit que l'instant présent.
- **Alertes / perturbations** : flux GTFS-RT `alerts` (même passerelle, `…/alerts/NAOLIBORG`).
- **Tracés des lignes** : jeu GTFS statique `244400404_transports_commun_naolib_nantes_metropole_gtfs`.
- **Météo** : Open-Meteo `forecast` (semaine glissante) et `archive-api.open-meteo.com`
  (semaines passées) — JSON, sans clé.

Conséquence pour « rejouer une semaine réelle » (Q14, Q22) : il faut **enregistrer
soi-même** les semaines. Créer `site/scripts/enregistrer-semaine.mjs` (Node, lancé à la
main pendant la semaine, jamais au build) qui interroge `trip-updates` et `alerts` à
intervalle régulier (ex. toutes les 10 min), décode le protobuf **dans le script**,
ne garde que les incidents (retard ≥ 10 min, alertes) et les écrit en JSON lisible
dans `data/semaines/{date-debut}.json`. Le décodage peut utiliser une dépendance de
développement du script (ex. `gtfs-realtime-bindings` installée en `devDependencies`) :
**le jeu lui-même ne lit que du JSON**, jamais le protobuf. Si le groupe ne peut pas
enregistrer 3 semaines avant le J3, les semaines proposées sont celles réellement
enregistrées (au minimum celle du `fallback.json`) — aucun incident inventé.

## Instructions
1. Créer, dans le dossier indiqué en « Emplacement », la structure du livret :
   `index.html`, `lib/p5.min.js`, `sketch.js`, `game.js`,
   `style.css`, `data/fallback.json`, `assets/`, `source-sheet`, `grammar`
   (deux fichiers JS, Q41 : `sketch.js` = boucle p5, `game.js` = logique du jeu).
2. Écran d'accueil : titre **« Nantes en régulation »** (Q56), liste des
   **3 semaines réelles proposées** (Q14) — chacune = un niveau de difficulté
   (compteur 60 / 30 / 15 s, Q16+Q55) — + bouton Jouer + indicateur « mode hors
   ligne » si l'API est injoignable (Q34). Français uniquement (Q33).
3. Écran de jeu en 1920×1080, style carte Nantes stylisée en **géographie réelle**
   (Q1, Q2) : tracés extraits du GTFS statique Naolib par un script (archive ZIP, trop lourde pour le navigateur) vers `data/lignes.json` (le jeu ne lit que ce JSON local, Q42),
   palette custom (Q3), deux polices — monospace pour les données, sans-serif pour
   les textes (Q4). Panneau gauche : carte + liste des lignes (alertes d'abord,
   puis retard décroissant, Q45), état en code couleur + épaisseur — vert / orange /
   rouge clignotant (Q29), météo du jour visible **dans le décor** (Q8, Q30).
   Panneau droit : dossier courant avec **ligne + retard + raison en priorité**
   (Q5), badge « contradiction » si deux sources se contredisent (Q9) — mauvaise
   source = malus réputation + conséquence réelle (Q31) — 3 actions +
   « ne rien faire », **compteur en barre horizontale** (Q6), 3 jauges en barres
   horizontales compactes (Q7). Arrivée du dossier : **glissement du panneau** (Q10).
4. Boucle : incident réel (retard ≥ 10 min, ou alerte météo Open-Meteo avec seuils
   **dérivés des données** — extrême vs normale de la semaine, Q39) → choix du
   joueur → effets sur les jauges → narration (ton adaptatif selon jauges, Q17) →
   incident suivant. ~15 décisions, aucun événement inventé. Conflit de deux
   lignes = choix binaire explicite (Q27). Si le compteur atteint 0 : « ne rien
   faire » avec les seules conséquences naturelles du dossier (Q25).
5. Table des effets (base + **1d6**, Q57/Q61), modificateurs contextuels (Q24) :
   - Dévier la ligne : fluidité −10, satisfaction +5, réputation 0
   - Retenir en terminus : fluidité −7, satisfaction −12, réputation +8 si retard > 20 min sinon +4
   - Bus de renfort : fluidité +12, satisfaction +8, réputation −3
   - Ne rien faire : −2 à −8 sur une jauge tirée au hasard (Q60)
   Jauges : départ **50**, poids égaux, score combiné 0–300 (Q40, Q44). Jauge < 20 :
   clignotement discret (Q46).
6. Fallback : `data/fallback.json` = **6 incidents d'une vraie semaine enregistrée**
   (Q26), semaine rejouée identique à chaque fois — seed fixe (Q35).
7. Raccourcis clavier complets (`1`/`2`/`3` actions, `0`/`Espace` ne rien faire,
   `Entrée` valider, `R` reset **avec confirmation** (Q38), `P` pause uniquement
   entre deux dossiers (Q13), `M` son ambiance + bips (Q11), `H` aide = raccourcis
   + règles (Q12, Q20)) — jouable sans souris, touch basique (Q32).
8. Écran de fin : **3 fins** (bonne ≥ 240, moyenne ≥ 150, mauvaise < 150 sur le
   score combiné, Q47/Q48) — bonne : la direction félicite, décor clair (Q49, Q53) ;
   moyenne : bilan neutre nuancé (Q50) ; mauvaise : la direction réprimande, décor
   sombre (Q51). Le texte de fin intègre le **bilan détaillé complet** (Q54) ;
   faits réels de la semaine uniquement dans le bilan chiffré (Q52). Boutons
   Rejouer / changer de semaine.
9. Respecter `prefers-reduced-motion`, contraste suffisant, aucun effet
   stroboscopique, `pixelDensity(1)`, `randomSeed` fixé pour la reproductibilité.

## Décisions verrouillées
Toutes les décisions Q1–Q61 sont dans `jeu/` (index : `jeu/README.md`) — ce prompt
en est le résumé exécutable.

## Vérifications
- Le jeu se lance et reste jouable sans réseau (fallback testé).
- Testé en plein écran 1920×1080, aucune erreur continue dans la console.
- Aucune clé privée, token ou secret dans le code.
- Le mapping API → incident → action → jauges tient en une phrase (voir `jeu/02-donnees-api.md`).
