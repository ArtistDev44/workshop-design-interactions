# Prompts 105 à 109 — plein écran, carte interactive, dialogue du plaignant, équipes et trajets

Date : 12/11/2026. Branche `jeu/105-109-carte-interactive-dialogue-equipes`.

## 105 — Plein écran

- L'appli occupe tout l'écran du PC : `FENETRE_APPLI` passe à l'échelle 1, en (0, 0).
- Il n'y a plus de barre des tâches ni de barre de titre dans l'appli ; la barre des tâches reste sur le
  bureau RégulOS.
- Les notifications s'affichent en haut à droite de la carte. Leur carte passe à 3 lignes d'extrait, pour
  que le texte reste lisible à 20 px.

## 106 — Carte interactive, signalements à leur lieu

- **Commandes** (`site/public/carte-alertes.js`) :
  - glisser le fond pour déplacer la carte ;
  - molette pour zoomer, centrée sur le curseur, de ×1 à ×8 ;
  - boutons + / − et « Recentrer » ;
  - touches + / −, Origine, Maj + flèches.
- **Comportement :** la carte glisse une fois vers le signalement ouvert, puis reste là où le joueur la met.
  Une ligne survolée affiche son numéro et son nom (GTFS) ; un centre survolé affiche son nom.
- **Lieux, jamais inventés :**

| Signalement | Lieu |
|---|---|
| Ligne citée | un point du tracé GTFS réel, choisi de façon déterministe pour le dossier |
| Événement | le lieu géocodé (`data/lieux.json`) |
| Alerte météo | toute la métropole |
| Autre | « Lieu à préciser » |

- **Géocodage :** `site/scripts/geocoder-lieux.mjs`, lancé à la main. Il utilise OpenStreetMap
  (© contributeurs OpenStreetMap, ODbL) via Nominatim.
  - Résultat : **13 lieux sur 28** ; les 15 autres restent « Lieu à préciser ».
  - Les autres sources essayées n'ont rien donné :
    - aucun jeu de données Open Data Nantes avec les coordonnées des équipements de secours ;
    - Overpass inaccessible depuis le poste ;
    - les arrêts NeTEx ne sont pas exploités (archive XML lourde).
- **Écart :** la ligne est connue dès le signalement, puisque le plaignant dit où il est. L'enquête « Lignes »
  donne toujours le nom complet et l'historique.

## 107 — Fenêtre flottante du plaignant, répliques adaptées

- **La fenêtre :** les cartes de réponse (« Renforcer la fréquence », « Agents sur les quais », etc.) sont
  retirées.
  - Un clic sur un marqueur ouvre une fenêtre flottante (820 × 868 px), posée sur la carte du côté opposé
    au marqueur. `PANNEAU` est repositionné à chaque image, donc la narration et les conflits s'y
    affichent aussi.
  - Contenu : titre, puis le plaignant (prompt 102), puis « En savoir plus (E) » (enquête), puis **« Vos
    réponses »**.
  - Les répliques sont à la première personne (clé `repl.<catégorie>.<réponse>`, en français et en
    anglais), et se choisissent au clic ou avec 1 à 4.
  - La croix ou Échap réduisent la fenêtre en un onglet en bas de la carte.
- **Effets inchangés :** chaque réplique déclenche la réponse correspondante (`decider`), avec le même
  effet base + 1 dé et les mêmes situations.
- **Exemple (retard) :**
  - « On ajoute un véhicule sur la ligne… » ;
  - « On régule les départs au terminus… » ;
  - « On affiche l'information aux arrêts… » ;
  - « Merci de patienter… ».
- **Agression en cours :** aucune source réelle du jeu ne contient ce type de fait, il n'est donc pas
  inventé. Source à trouver : [À COMPLÉTER].
- Les textes du guide et du bandeau d'état sont mis à jour ; le mail du soir ne recouvre plus de panneau
  caché.

## 108 — Équipes à droite, effectifs adaptés

- **Panneau** x 1576 → 1880 :
  - pictogramme, nom, centre ;
  - une pastille par équipe : disponible, ou en route / sur place / retour avec les secondes restantes.
- **Envoi :** glisser une pastille disponible sur **n'importe quel marqueur** (ou sur la fenêtre ouverte).
  Clic sur une pastille puis sur un marqueur fait la même chose ; Maj + 1–4 restent.
- **Déblocage :** les équipes sont disponibles dès la semaine 1 (`histoire.js`).
- **Effectif du jour** : `Jeu.effectifJour` = base + ⌊signalements du jour ÷ 3⌋, plafonné à 4 / 3 / 4 / 3
  (police, ambulanciers, techniciens, pompiers).
  - Exemple, premier jour de la semaine du 14/09 : 3 / 2 / 3 / 2.
  - Durées, coûts et effet divisé par deux hors sujet : inchangés.
- **Tests mis à jour** (`scripts/test-jeu.mjs`) : ils ne supposent plus un effectif fixe.

## 109 — Trajets depuis les centres réels

| Équipe | Centre (OpenStreetMap) |
|---|---|
| Police | Commissariat central, place Waldeck-Rousseau |
| Pompiers | Centre de secours principal de Nantes-Gouzé |
| Ambulanciers | Hôpital Nord Laennec (CHU) |
| Techniciens | Semitan (exploitant Naolib), Dalby |

- **Sur la carte :** la pastille avance du centre vers le lieu au prorata du temps de trajet, reste sur
  place, puis rentre.
- **Tracé :** en pointillés, à vol d'oiseau (la légende le dit), avec la partie parcourue en plein.
- **Signalement sans lieu :** l'équipe reste affichée à son centre.
- **Vérifié par calcul :** à mi-trajet, l'équipe est au milieu entre le centre et le lieu ; elle est sur
  place à l'arrivée et au milieu à mi-retour.

## Vérifications

- `npm run build` vert ; `npm test` : 485 + 548 contrôles réussis.
- Audit des textes (`?audit=textes&parcours=1`, FR et EN) : **0 défaut**.
- **Navigateur :**
  - plein écran, carte, panneau des équipes ;
  - fenêtre du plaignant (« Affluence », @nantaise_du_tram, 4 répliques) ;
  - réplique choisie → narration ;
  - police envoyée sur la ligne 97 : tracé depuis le commissariat.
- Partie complète en conditions réelles, à la souris, au clavier et sur mobile : [À COMPLÉTER].
