# Revue UX : l'information dans l'appli de régulation (volet B, cœur de la décision)

12/11/2026 · méthode `ux-questionner-informations` (inventorier, 8 questions, verdict + priorité) · aucun fichier
du dépôt modifié.

**Périmètre** : bandeau/HUD, carte, « liste » des alertes, panneau Équipes, fenêtre du dossier (plaignant,
répliques, tendances, « conseillé »), volet « Dites-m'en plus » (PLUS : Enquête / Historique), retour après
décision (narration et juice), annonces au lecteur d'écran, rythme et multitâche dans l'appli, modèle
`journal-donnees.js`.
Hors périmètre : menu, intro, aide, bureau, applis secondaires (Patron, Community, Journal, Données), bilans.

**Matériel** : le build est servi sur `localhost:8737` (`?expo=1`, 1920×1080). Semaine jouée : **lundi
2026-09-14, difficulté « facile »**. J'ai joué 5 dossiers, avec et sans les options Pression visible et Dé
visible. Pour les 16 dossiers du paquet, j'ai relevé ce que le code calcule en lecture seule. Je n'ai lu aucun
fichier de `data/fallback/`.

Les captures sont dans `…/scratchpad/ux/B/` :

- `01-carte.jpg`, `02-survol-marqueur.jpg` : la carte ;
- `03-dossier.jpg`, `05-sources.jpg`, `06-narration.jpg` : premier dossier, affluence ;
- `d01-dossier.jpg` : incident fictif ;
- `d03-dossier.jpg`, `d03-sources.jpg`, `n03-narration.jpg` : alerte météo ;
- `d00`, `d02`, `d04`, puis `n00` à `n04` : les autres dossiers et narrations.

**Ce que contient la semaine d'exposition** (relevé dans le paquet joué) :

| Sorte de dossier | Nombre | Exemples |
|---|---|---|
| Événements de l'agenda | 11 | « Ateliers parents-enfants », « Pause-café », « Atelier couture », « Repair café numérique » |
| Perturbations réelles (changelog GTFS) | 2 | « Feu d'artifice ligne 97 », « Foulées sur la 97… » |
| Alertes météo (ERA5, 95e centile de la semaine) | 2 | température 30 °C, rafales 50,4 km/h |
| Incident fictif | 1 | agression, ligne 1 |
| Retard en minutes | 0 | `retard: null` partout, comme le dit `grammar.md` (prompt 134) |

---

## B1. Bandeau / HUD (`panneau.js:14-92`)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Titre et valeur des jauges : « Fluidité 50 », « Réputation 50 », « Budget 60 » | `panneau.js:29`, `jaugeTitre.*` (EN « Flow ») | Calcul du jeu (0–100, départ 50/50/60 selon la difficulté, `game.js:284`) | Tout arbitrage. C'est l'état du système. | Utile à tout moment, aux trois publics. Le chiffre double la barre, ce qui est juste. Rien n'indique que le budget est aussi la monnaie des équipes. | Garder | – |
| Barre colorée : vert ≥ 40, orange 20–40, rouge < 20 qui pulse | `panneau.js:35-38`, `feedback.js:82` | Calcul (Q46) | Voir le danger d'un coup d'œil | Le chiffre est écrit, la couleur n'est donc pas seule. La pulsation à 1 Hz respecte la règle « pas de flash ». | Garder | – |
| Deux traits blancs à 20 et 40 sur chaque barre | `panneau.js:40` | Interface (seuils réels) | Situer les seuils d'alerte et de ton | Aucune légende ni infobulle : le visiteur ne sait pas ce qu'ils marquent. Les seuils du licenciement (score < 120/90/45, `game.js:180`) ne figurent nulle part. | Reformuler : infobulle « 20 : critique · 40 : tendu » | P3 |
| Delta flottant « +10 » / « −3 », vert ou rouge, et éclair sur la barre | `feedback.js:48-79` | Calcul (delta réel) | Relier la décision à son effet | Il apparaît après la décision et dure 1,6 s, ce qui est bien. Il double le retour écrit (B8) et l'annonce vocale : redondance voulue. | Garder | – |
| « Priorités : budget ≥ 40 · zéro non traité » | `panneau.js:49`, `bandeau.priorites`, `tache.prioCourt.*` | Fiction de gestion (tâches du patron, prompt 91) | Orienter l'arbitrage du jour | Avec l'objectif, cela fait 2 ou 3 consignes sur une même ligne grise de 16 px (`01-carte.jpg`). « budget ≥ 40 » s'ajoute à l'objectif sur une autre jauge, et la différence entre priorité et objectif n'est jamais dite. Le visiteur d'exposition n'en a pas l'usage. | Fusionner avec l'objectif en une seule consigne du jour, différer le reste dans Patron | P2 |
| « Objectif : Garder la fluidité ≥ 40 (50) » | `panneau.js:50`, `bandeau.objectifCourt`, `obj.garder` (`game.js:1844`) | Calcul (objectif fixe par jour) | Fixer le cap du jour | Le « (50) » n'est pas expliqué et répète la jauge écrite au-dessus. Il n'y a ni état atteint ou en danger, ni rappel de l'effet (bonus/malus). | Reformuler : « Objectif : fluidité ≥ 40 — tenu (50) », avec symbole ✓/⚠ | P2 |
| Thème du jour (« Journée tempête », « Journée animée »…) | `panneau.js:47,50`, `theme.*` | Calcul (météo et agenda réels) | Donner le ton | Il n'apparaît que s'il n'est pas « ordinaire ». Le mot « tempête » peut exagérer une donnée ERA5 modeste. | Garder, vérifier les seuils | P3 |
| « ▶ 10:06 » / « ▶▶ ×100 10:06 » / « en pause 10:07 » | `panneau.js:50`, `temps.*`, infobulle `temps.explication` (prompt 95) | Interface (horloge de la partie) | Savoir si le temps file | Le symbole « ▶ » seul ne se comprend pas sans survol. Au toucher, l'infobulle est inaccessible. | Garder, reformuler « ▶ » en « ▶ 1 min/s » | P3 |
| « · mode hors ligne » | `panneau.js:50`, `jeu.horsLigne` | Interface (état réel) | Dire la vérité sur la source | Bon : dit la provenance. Rien n'est affiché en mode archive (« archive du 14/09 ») ni en temps réel. | Ajouter l'état de la source (archive / temps réel / repli) au même endroit | P2 |
| Ligne complète au survol, avec « … » quand elle est coupée | `panneau.js:56-73`, `sketch.js:227` | Interface | Lire la ligne entière | C'est un pansement : la ligne est trop longue (voir le verdict « Fusionner » plus haut). | Garder en attendant | P3 |
| Bouton « CELLULE DE CRISE » | `panneau.js:74-87`, `crise.bandeau` | Fiction (tâches, prompt 88) | Ouvrir la crise du jour | Rouge plein dans le bandeau, alors que DESIGN.md réserve le rouge primaire. Son importance est réelle mais ponctuelle. | Garder, vérifier le poids | P3 |
| « Somnolence 9 · Z » et sa barre | `sieste.js:126`, `sieste.jauge` (appelée par `sketch.js:296`) | Calcul (prompt 78) | Gérer la fatigue et la sieste | Elle est hors du bandeau, en bas à droite : une 4e jauge que le HUD ne présente pas comme telle. Le guide (étape 3/8) affirme que les signalements qui expirent sont perdus, ce qui est faux sans défi chrono (`multitache.js:140`). | Déplacer près des jauges ou l'assumer comme jauge du corps ; corriger le texte du guide (autre volet) | P2 |
| Bandeau d'état « À VOUS · … » | `sketch.js:283-298`, `etat.*` | Interface | Dire quoi faire maintenant | Il n'est plus affiché (prompt 124) et reste annoncé au lecteur d'écran. `etat.decision` dit « 1 à 3 », ce qui est juste. | Garder | – |

## B2. Le menu de gauche vu comme indicateur de régulation (`menu-app.js:25-79`)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Entrée « Carte » (logo PXE) marquée d'un liseré rouge quand elle est active | `menu-app.js:44-54`, `menuApp.carte` | Interface | Savoir où l'on est | Le logo tient lieu d'icône de la carte : peu explicite, mais le libellé est écrit. | Garder | – |
| Badge rouge chiffré sur Patron et Community (2 → 7 en 5 dossiers) | `menu-app.js:71-74`, `badge.libelle` | Calcul (nouveautés) | Signaler la pression multitâche | Le compteur monte vite (`n03-narration.jpg` : 4 et 7). Il n'indique pas l'urgence (plainte qui s'envenime ou info). Le rouge erreur est utilisé pour du simple non lu. | À trancher : distinguer « urgent » et « non lu » | P2 |
| Badge « ! » sur Carte (incident en cours) | `menu-app.js:73`, `badgeIcone` | Calcul | Revenir à la carte | Il n'est utile que depuis une autre vue, ce qui est cohérent. | Garder | – |

## B3. Carte des alertes (`carte-alertes.js`)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Eau (Loire, Erdre) et tracés des lignes (tram plus épais) | `carte-alertes.js:192-204` | API réelle (occupation du sol 2022, GTFS Naolib via `data/lignes.js`) | Situer, porter l'œuvre (Nantes réelle) | Aucune légende ne dit qu'il s'agit de tracés réels, ni leur source. Les lignes sont très pâles (alpha 0,09–0,18). | Garder ; ajouter la source en pied de carte (« Tracés GTFS Naolib ») | P3 |
| Ligne du dossier surlignée à sa couleur réelle | `carte-alertes.js:205-212` | API réelle (`couleur` GTFS) | Voir où est le problème | Bien. Seule la première ligne citée porte le marqueur (`lieuAlerte:67-71`). | Garder | – |
| Infobulle d'une ligne survolée (« Ligne 23 · Libellé ») | `carte-alertes.js:274`, `sujet.ligne` | API réelle | Explorer | Elle ne sert pas la décision. Coût faible. | Garder | – |
| Marqueur carré, couleur selon la gravité (gris, orange, rouge foncé) et taille 20/28/36 px avec liseré blanc pour « élevée » (prompt 133) | `carte-alertes.js:381-394`, `carte.js:102` | **Calcul du jeu** (`Jeu.gravite`, `game.js:1679`) | Hiérarchiser les alertes | **En mode archive, la gravité ne dépend que du type**, puisqu'aucun retard n'est connu : tout événement = moyenne, toute perturbation réelle = faible, toute alerte météo ou incident fictif = élevée. Un « Atelier parents-enfants » pèse donc plus qu'une perturbation réelle du réseau. Le joueur la lit comme une évaluation de la situation. Couleur doublée par la taille : accessible. | Reformuler la règle (perturbation ≥ moyenne, événement ≤ faible sauf grand public) ou l'afficher comme « type » | **P1** |
| Contour rouge (dossier ouvert), blanc (actif), pointillé (focus clavier) | `carte-alertes.js:395-403` | Interface | Savoir quel dossier est ouvert | Trois états distingués par le trait plein ou pointillé et la couleur : correct. | Garder | – |
| Halo d'arrivée de 600 ms | `carte-alertes.js:371-378` | Interface | Remarquer un nouveau signalement | Désactivé si les animations sont réduites : OK. | Garder | – |
| Marqueur creux avec sablier pixel (« en attente du retour ») | `carte-alertes.js:420-449`, `carte.attenteRetour` (prompt 121) | Fiction (plaignant) et calcul (équipe) | Suivre les interventions | Aucune légende sur la carte. On ne comprend qu'au survol. | Ajouter une mini-légende | P3 |
| Infobulle d'un marqueur : « 10h00 · Affluence signalée · Gravité moyenne · Lieu » | `carte-alertes.js:272` (prompt 133) | Mélange : l'heure est celle **de la partie** (créneau calculé, `game.js:808`, mélangé par `rythme.js:44`) ; le type et le lieu sont réels ; la gravité est calculée | Choisir quel dossier ouvrir | **L'heure est présentée comme un fait** alors que l'agenda et le changelog n'ont pas d'heure : sur les 16 dossiers, seuls 3 ont une heure de source. Le texte est coupé derrière la fenêtre du guide (`01-carte.jpg`). | Reformuler : distinguer « arrivé à 10h00 (heure de jeu) » de « heure de la source » | P2 |
| « Lieu à préciser » et ses marqueurs (bas de la carte) | `carte-alertes.js:239-257`, `carte.lieuAPreciser` | Interface (lieu inconnu, jamais inventé) | Être honnête sur l'absence de lieu | C'est le cas de 7 dossiers sur 16 (lieux non géocodés, perturbations sans ligne). C'est honnête, mais la boîte devient la vraie « liste » et la carte reste vide. Le marqueur n'est pas lié au lieu cité. | Garder ; à terme, géocoder `data/lieux.json` pour les lieux de l'agenda | P2 |
| Voile bleu (alpha 16/255) « Toute la métropole » pour une alerte météo | `carte-alertes.js:214-217`, `carte.metropole` | Réel (alerte ERA5 sur Nantes) | Montrer l'étendue | Le voile est quasi invisible (`d03-dossier.jpg`). Seule l'infobulle le dit. | Alléger le doute : contour ou étiquette « Toute la métropole » | P3 |
| Ligne d'état : « Signalements · 1 · actifs 1/3 · 1 en attente de retour » | `carte-alertes.js:259-266`, `sig.titre`, `multi.actifs`, `sig.attente` | Calcul | Mesurer la charge | « actifs 1/3 » ne se comprend pas sans contexte (capacité de multitâche, `game.js:184`). | Reformuler : « 1 ouvert sur 3 possibles » | P2 |
| Ligne d'état sans dossier : « Aujourd'hui : 4 à traiter · prochain vers 14h30 » | `sketch.js:461-468`, `jour.reste` | Calcul | Anticiper | Elle est coupée par « … » quand une fenêtre est ouverte (`06-narration.jpg`). | Garder, éviter la coupe | P3 |
| « Prévision à 1 h : … (gravité …) » | `carte-alertes.js:264`, `deblocage.prevision` | Calcul (option de grade) | Anticiper | Option : invisible par défaut. | Garder | – |
| « Zoom ×1,0 » | `carte-alertes.js:351`, `carte.niveauZoom` | Interface | Aucune décision | Ne sert à personne : les boutons + et − suffisent. | Supprimer | P3 |
| « Trajets des équipes : à vol d'oiseau » | `carte-alertes.js:352`, `carte.volOiseau` | Interface (avertissement de vérité) | Ne pas lire le trait comme un itinéraire réel | Bonne honnêteté, affichée seulement quand une équipe roule. | Garder | – |
| Boutons + / − / Recentrer | `carte-alertes.js:329-349` | Interface | Naviguer | « Recentrer » est coupé (« entrer › ») sous la fenêtre du guide (`01-carte.jpg`). | Garder | P3 |
| Centres d'intervention (pictos) et leur infobulle « Nom · OpenStreetMap » | `carte-alertes.js:462-480` | Réel (OSM, `data/lieux.json`) | Estimer la distance de l'équipe | Bien sourcé. Leur position n'influe pas sur le délai (constant, `DELAI_EQUIPE_MS`) : la carte suggère une distance qui ne compte pas. | À trancher : délai lié à la distance, ou le dire | P2 |
| Équipe en route (carré blanc, trait plein puis pointillé) | `carte-alertes.js:498-531` | Calcul | Suivre l'intervention | Bien lisible. | Garder | – |
| **Météo dans le décor de la carte** | absente : `dessinerDecor` / `dessinerMeteo` (`sketch.js:512-574`) ne servent plus qu'à l'écran de fin (prompt 73) | – | – | En jeu, la météo réelle du jour n'est visible nulle part sur la carte. Elle n'apparaît que dans la phrase d'une alerte météo ou derrière la source Météo (7). Pourtant la météo change les tendances (contexte, `game.js:544-552`). | Ajouter : la météo du jour en une ligne chiffrée sur la carte (`meteo.jour` existe déjà) | **P1** (voir « Informations manquantes ») |
| Légende de la carte | absente (`SELECTION.legendeRepliee` déclaré, `carte.js:12`, jamais dessiné) | – | – | Les tailles et couleurs de gravité, le sablier, les centres et les tracés ne sont expliqués que dans l'aide (autre volet). | Ajouter une légende repliable (4 entrées) | P2 |

## B4. La « liste des alertes »

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Liste textuelle des signalements (heure, type, lignes, gravité, « s'aggrave ↑ », « Prendre ▸ ») | `carte.js:216-310` (`dessinerFileSignalements`) | – | Comparer et choisir | **Ce code n'est plus appelé** depuis le prompt 102 : la carte remplace la liste. Au clavier, ↑ ↓ annoncent le marqueur (`carte.js:313-322`), mais il n'existe **aucune vue textuelle** des dossiers en attente. Les dossiers « Lieu à préciser » forment une rangée de carrés sans texte. | À trancher : rétablir une file compacte (texte) à côté de la carte, ou faire de « Lieu à préciser » une liste titrée | P2 |
| Panneau « Signalement choisi » (`dessinerSelection`) et « Prendre » | `carte.js:63-100` | – | – | Code mort lui aussi. Le clic sur le marqueur prend le dossier directement. | Retirer le code mort (hors UX) | P3 |
| Annonce « Signalement : Affluence signalée (gravité moyenne). Entrée pour le prendre. » | `carte.js:56`, `carte.signalement` | Réel (type) et calcul (gravité) | Prévenir le lecteur d'écran | Correcte, mais la gravité y garde le défaut signalé en B3. | Garder | – |

## B5. Panneau Équipes (`carte-alertes.js:545-618`)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Titre « Équipes », pictos, noms (Police, Ambulance, Techniciens, Pompiers) | `:553-561`, `equipes.titre` | Fiction de gestion | Second levier de décision | Il est toujours visible, ce qui est juste puisque l'envoi se fait par glisser. | Garder | – |
| Centre de départ réel (« Commissariat central… », « Semitan (exploitant d… ») | `:562-563` | Réel (OSM) | Crédibilité | Le texte est coupé. Il ne sert pas la décision (voir le délai constant en B3). | Alléger (infobulle) | P3 |
| Pastilles : disponible / engagée, avec secondes restantes (« 12s ») | `:564-592` | Calcul | Savoir ce qu'on peut envoyer | Les « s » sont des secondes **réelles**, alors que les refus parlent de « min de jeu » (`equipe.aucune`) : deux unités de temps pour la même chose. | Reformuler : une seule unité | P2 |
| « 3/3 disponible · −10 » | `:594`, `equipes.dispo` | Calcul (effectif du jour, coût) | Disponibilité et coût | « −10 » n'est pas étiqueté comme coût en budget. Aucune ligne ne dit **quelle équipe convient** à quel type, alors que c'est la règle qui compte : effet divisé par deux hors sujet, `game.js:1660-1677`, `1718-1722`. | Reformuler « −10 budget » ; ajouter la pertinence (voir B6) | P2 |
| Consigne « Glissez une équipe sur un signalement de la carte. » ou message d'envoi / refus (5 s) | `:599-602`, `equipes.glisser`, `equipe.enRoute*`, `carte.adaptee` | Interface et calcul | Retour sur l'envoi | Le message disparaît au bout de 5 s. Le texte distingue bien « adaptée » et « hors sujet », la couleur ne fait que doubler. | Garder | – |

## B6. Fenêtre du dossier (`panneau.js:142-402`, `sketch.js:618-676`)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| En-tête « DOSSIER 1 / 16 · ÉVÉNEMENT » | `sketch.js:637`, `dossier.entete`, `type.*` | Calcul (rang) et réel (type) | Se situer dans la semaine | « 16 » est le total de la semaine (15 + 1 fictif), pas celui de la journée, alors que le joueur raisonne en journée. Le même dossier porte trois noms : « ÉVÉNEMENT », « Affluence signalée » et la catégorie « affluence ». | Reformuler : « Lundi · 1 sur 5 » ; un seul nom par sorte | P2 |
| Titre : « Ligne 1 · Gravité élevée » ou « Affluence signalée · Gravité moyenne » | `panneau.js:173`, `dossier.ligne`, `enq.signalement.*`, `carte.gravite` | Réel (ligne, type) et calcul (gravité) | Comprendre l'objet et l'urgence | La gravité hérite du problème décrit en B3 (P1). Pour l'incident fictif, le titre « Ligne 1 » ne dit pas « fictif » : il faut lire le badge, deux blocs plus bas. | Reformuler (gravité) ; préfixer « Fictif · » au titre | **P1** |
| Tampon « SIGNALEMENT » incliné (prompt 53) | `sketch.js:675`, `feedback.js:94` | Interface (juice) | Marquer l'arrivée | **Il reste affiché et recouvre la fin de « Gravité moyenne / élevée »** (`03-dossier.jpg`, `d03-dossier.jpg`). Il masque l'information la plus utile du titre. | Déplacer (coin opposé) ou ne l'afficher que 1 s | P2 |
| Bouton × (réduire, Échap) | `panneau.js:182`, `dialogue.fermer` | Interface | Voir la carte | OK. | Garder | – |
| Avatar et pseudo du plaignant (« @coincee_dans_la_foule ») | `panneau.js:288-317` (prompt 102) | **Fiction** (`data/messages.json`) | Incarner la plainte (œuvre) | Ce n'est marqué nulle part comme fiction : le pseudo ressemble à un vrai compte. Sans plaignant, le pseudo est remplacé par « Signalement · {source} », qui est réel. | À trancher (voir la liste) | P2 |
| Texte de la plainte (20 px, blanc) avec liseré rouge si le ton est agressif (prompt 118) | `panneau.js:291-313` | **Fiction** remplie avec des variables réelles | Donner la tension | **Le gabarit insère la nature brute de l'agenda comme si c'était un nom** : « « Stage - Atelier - Activité à partager » et vous mettez toujours aussi peu de trams ? On est serrés comme des s@#!nes » pour un atelier parents-enfants à Couëron (`03-dossier.jpg`), ou « Pendant « événement », par où passe mon bus ? ». C'est la première chose que lit le visiteur d'exposition, et elle contredit la source. | Reformuler les gabarits (`{nom}` de l'événement, pas `{nature}`) ; ne pas déclencher « bondé » sur un atelier | **P1** |
| Annonce du plaignant (« mot masqué ») | `panneau.js:314-317`, `plaignant.annonce` | Fiction | Lecteur d'écran | Bon traitement de la censure. | Garder | – |
| Badge « Fictif · scénario du jeu, pas une donnée réelle » (prompt 119) | `panneau.js:319-325`, `fictif.badge` | Fiction assumée | Vérité sur la source | Bien formulé, mais en 16 px sous la bulle, après le titre. | Garder ; le remonter dans le titre (voir plus haut) | P2 |
| Phrase de situation, 16 px, blanc 50 %, coupée par « … » | `panneau.js:95-110,326-328`, `phrase.*`, `chaine.phrase` | Réel (texte de la source) sauf `phrase.affluence` | Donner le fait réel | **C'est le seul fait réel visible avant d'ouvrir les sources, et il a le poids visuel le plus faible.** Il est coupé : « Ateliers parents-enfants attire du monde (Les Cabanes des Loul… ». **« attire du monde » est une hypothèse du jeu** (grammar.md, prompt 134) affirmée comme un fait. « Vigilance température 30 °C » emprunte le vocabulaire de Météo-France pour un seuil du jeu (95e centile de la semaine). « 50.4 km/h » garde le point décimal anglais (`phrase.alerteMeteo` sans `nombreFr`). | Reformuler : « Événement à l'agenda : … (le jeu suppose de l'affluence) », « Pic de température de la semaine », nombres à la française ; remonter le poids | **P1** |
| Dossier « conséquence de jeu » (chaîne, prompt 88) | `panneau.js:96,133`, `chaine.*`, `taches.js:537-570` | Calcul du jeu | Montrer la conséquence | Il est dit « pas un fait réel » dans la phrase grise ; le titre, la carte et la gravité le présentent comme un dossier réel (type « ligne en difficulté »). | Ajouter un badge du même modèle que « Fictif » (« Conséquence de jeu ») | P2 |
| « → Publier sur Community (B) » | `panneau.js:196-198`, `applis.publier` (prompt 91) | Interface | Informer les usagers | Placé entre le fait et les réponses, il coupe le parcours « lire → répondre ». Absent pour l'affluence, ce qui n'est pas expliqué. | Déplacer sous les réponses | P3 |
| « Vos réponses » | `panneau.js:203`, `dialogue.titre` | Interface | Repère | OK. | Garder | – |
| 3 répliques numérotées 1–3, mélangées : la meilleure, une autre, le clash (prompt 117) | `panneau.js:208-223,388-402`, `repl.*`, `clash.*` | Fiction (écrite par le groupe) | La décision | **Quand la meilleure réponse est « attendre », le trio contient deux fois « attendre »** : le clash est construit sur « attendre » (`reponsesDialogue:398-399`). Constaté sur les dossiers 4 et 5 (`d03-dossier.jpg` : répliques 1 et 3, mêmes effets). Il ne reste alors que deux vrais choix. | Corriger : si `best` est de la famille « rien », prendre deux autres réponses et faire porter le clash sur « attendre » | **P1** |
| Tendance sous chaque réplique : « Flu. ▲▲ Rép. ≈ Bud. ▼ » (prompt 130) | `panneau.js:271-285`, `jaugeCourt.*` | Calcul (dé moyen, contexte, `Jeu.effetsAttendus`) | Anticiper l'effet | C'est la seule aide chiffrée à la décision, et elle est bien doublée par le symbole. **Elle trahit le clash** (Rép. ▼▼ toujours, `:273`), contre l'intention du prompt 117 (« aucune tendance affichée qui trahirait la bonne réponse »). Le prompt 130 l'assume (« la tendance reste honnête »). Elle ne dit pas *pourquoi* deux dossiers de même type donnent des tendances différentes (contexte invisible, voir plus bas). « Flu. / Rép. / Bud. » : abréviations non expliquées. | À trancher (117 contre 130) ; Garder la tendance | P2 |
| Pastille « ✓ conseillé » (option Pression visible) | `panneau.js:207,283`, `rep.conseillee`, `game.js:922` | Calcul (évaluation pondérée par les jauges, prompt 130) | Apprendre la règle | Elle est désactivée par défaut, conformément au prompt 130 (« le joueur doit pouvoir se tromper »). Elle conseille **« On continue à rouler »** sur une alerte de gravité élevée (`d03-dossier.jpg`) : c'est cohérent avec le calcul, pas avec le titre. | Garder ; corriger l'incohérence de gravité | P2 |
| Réplique « Pouvez-vous m'en dire plus ? » (E) + « ouvre les sources de l'enquête (E) » (prompt 116) | `panneau.js:225-236`, `dialogue.plus`, `dialogue.plusAide`, `dialogue.plusFerme` | Interface déguisée en réplique | Ouvrir PLUS | Elle est rangée avec les choix mais n'en est pas un. Elle a été déplacée exprès (prompt 116). Une fois ouverte, la réplique devient « Merci, c'est noté. », ce qui veut dire « refermer » : ambigu. Elle est en partie masquée sous le cadre du guide (`03-dossier.jpg`). | Reformuler l'état ouvert : « Revenir au plaignant (E) » | P3 |
| Onglet réduit « Affluence signalée · Gravité moyenne › » | `panneau.js:159-168` | Interface | Rouvrir | OK. | Garder | – |
| Contradiction : « Deux sources se contredisent : à vérifier. », puis A « Date de publication du changelog : … » / B « Date annoncée dans le texte : … » | `panneau.js:363-374`, `savoir.contradiction`, `contra.*`, `game.js:216-229` | Réel (dates du changelog) | Choisir la source à croire | **Ce n'est pas deux sources** : c'est une annonce publiée à l'avance (« Foulées sur la 97 le 4/10 et … la 50 le 26/09 », publiée le 17/09). Le texte cite deux dates, le jeu ne garde que la première. La « bonne » réponse est figée à B. | Reformuler : « Publiée le 17/09, l'annonce vise le 4/10 : quel jour agir ? » ; traiter les textes à plusieurs dates | P2 |
| Conflit de deux lignes A / B (Q27) | `sketch.js:705-738`, `conflit.*` | Réel | Prioriser | Il n'existe qu'à partir de la semaine 3. Le texte est en 32/40 px dans la fenêtre du dialogue, ce qui fait un changement brutal de style. | Garder ; aligner sur le style du dialogue | P3 |
| Puces « Pourquoi c'est important » (heure de pointe, pluie, aggravation, agenda, historique de ligne) et « Ce que vous savez / ne savez pas » | `panneau.js:112-140` | Réel et calcul | Contexte de décision | **Code mort** depuis la fenêtre du plaignant (prompt 107). C'est exactement le contexte qui manque à la décision (voir la liste en fin de document). | Réintroduire 1 ligne de contexte (voir la liste) | **P1** |
| Cartes de réponse avec explication, équipe liée et disponibilité (`rep.equipe`) | `panneau.js:417-476` | Calcul | – | Code mort lui aussi. L'information « équipe liée à cette réponse » a disparu de l'écran. | Voir la liste | P2 |
| Options « Pression visible » et « Trace dans le dossier » (Paramètres) | `optjeu.pressionVisible.detail`, `optjeu.traceDossier.detail` ; `Traces.pression` et `Traces.memoire` jamais appelées | Interface | – | **Les options promettent un affichage qui n'existe plus** : retard qui grimpe, gravité avec son seuil, temps écoulé, rappel de la dernière décision sur la ligne. Seul « conseillé » est branché. | Reformuler le libellé (« Aide : réponse conseillée ») ou rebrancher | P2 |

## B7. Volet PLUS : « Dites-m'en plus » (`enquete.js:363-430`, `carte.js:108-170`)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Onglets « Enquête » / « Historique » | `carte.js:108-112`, `carte.onglet.*` | Interface | Choisir le détail | « Enquête » ressemble à un bouton d'action rouge plein (`05-sources.jpg`). | Alléger (onglet, pas bouton primaire) | P3 |
| Zone défilante des sources : **environ 140 px de haut** quand les 3 répliques restent affichées | `panneau.js:189-195` | Interface | Lire les faits | Les répliques passent en mode compact et perdent leurs tendances (`:220`). Les sources n'ont presque plus de place : on voit une carte (`05-sources.jpg`, `d03-sources.jpg`). On ne peut pas lire les sources **et** comparer les tendances en même temps. | À trancher : sources en remplacement de la bulle (pleine hauteur), tendances conservées | P2 |
| Bouton d'une source non consultée : « 5 Lignes — Révèle les lignes concernées » ; 6 Info trafic, 7 Météo, 8 Agenda | `enquete.js:331-348`, `enq.source.*`, `enq.revele.*` | Interface | Choisir quoi révéler | Hors défi chrono, révéler ne coûte rien (`enquete.js:51`). Cacher derrière des clics devient donc une étape gratuite. C'est un choix de mise en scène voulu (prompt 50). | À trancher : tout révéler d'office hors chrono ? | P2 |
| En-tête de carte : picto, « AGENDA », « consultée à 10h07 » | `enquete.js:231-241`, `enq.consultee` | Interface (heure de jeu) | Traçabilité | « consultée à » ne sert à aucune décision. | Supprimer | P3 |
| Lignes : « 1 ligne(s) concernée(s) », pastille à la couleur réelle et libellé ; « ⚠ La source ne précise aucune ligne : lieu inconnu. » | `enquete.js:119-125`, `enq.fait.lignes`, `enq.lignes.inconnue` | Réel (GTFS) | Identifier la ligne | Bien. Le titre de la fenêtre dit déjà « Ligne 97 » : la source n'apporte que le libellé. | Garder | – |
| Info trafic : fait (« Retard de 12 min », « Retard non précisé par la source (Exposition) »), paires nature / heure / retard initial / actuel / dates, citation en italique et « Lire tout », provenance « Source · Archive du 14/09 · heure » | `enquete.js:126-141`, `enq.fait.*`, `enq.cle.*`, `dossier.citation` | Réel, sauf retard actuel (calcul, prompt 79) | Lire la source | **Pour un événement ou une alerte météo, la carte « INFO TRAFIC » affiche le texte de l'agenda ou d'ERA5** : mauvais libellé. La citation d'une alerte météo, « température : 30 °C le 2026-09-14 à 15:00 (95e percentile…) », est une phrase **composée par `preparer-semaines.mjs`**, mise entre guillemets comme une citation. | Renommer la carte selon le type (« Source du signalement ») ; ne pas guillemeter un texte généré | P2 |
| Météo : « Pluie 0 mm · rafales 22,3 km/h », puces ☀ ☂ ≋ avec ⚠ orange en gras au-dessus du seuil, provenance « Archive Open-Meteo du … » | `enquete.js:143-155`, `enq.fait.meteo`, `journal.puce.*` | Réel (ERA5) | Contexte météo | **Seuils incohérents** : le ⚠ apparaît à 1 mm / 40 km/h (`SEUILS_METEO_ENQ`, `:97`), le contexte « météo défavorable » à 5 mm / 50 km/h (`game.js:548`), la catégorie « météo » à 10 mm / 60 km/h (`game.js:498`). Un ⚠ à 41 km/h ne change rien aux effets. | Aligner sur un seul seuil, celui du contexte | P2 |
| Agenda : « Événement réel du jour, cité par l'agenda » + titre / lieu, ou « Aucun événement grand public à l'agenda du 14 septembre 2026. » | `enquete.js:156-166`, `enq.fait.evenement`, `enq.agenda.rien` | Réel (agenda) | Anticiper l'affluence | **Contradiction visible** : le 14/09, la source Agenda d'un autre dossier dit « Aucun événement grand public » (`d03-sources.jpg`), alors que le jeu a présenté trois « Affluence signalée » ce jour-là. Il y a deux définitions de l'affluence : `scoreAffluence` (≥ 0, presque tout, `game.js:207`) et `MOTIF_AFFLUENCE` (concert, sport…, `game.js:2012`). | Unifier : seuls les événements « grand public » deviennent des dossiers d'affluence | **P1** |
| Provenance en petit (« Agenda des événements de Nantes Métropole », « Archive Open-Meteo du … ») | `enquete.js:125-165` | Réel | Pour le jury | Bien. C'est la vérité sur la source au bon endroit. | Garder | – |
| Historique : « Ligne 97 : bus », « Ligne(s) … : n incident(s) déjà traité(s) », dernière décision et évaluation, aggravation durable | `carte.js:114-138`, `carte.histo.*` | Calcul sur la partie | Cohérence entre les décisions | L'historique est réservé aux dossiers avec ligne, et demande d'avoir consulté « Lignes » (5). En archive, la même ligne revient rarement : l'onglet est souvent vide. | Différer (n'afficher l'onglet que s'il y a un historique) | P3 |

## B8. Retour de décision : narration et juice (`sketch.js:750-826`, `panneau.js:491-507`, `juice.js`, `feedback.js`)

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| « JOURNAL DE LA SALLE · ton neutre » (couleur du ton) | `sketch.js:753-760`, `narration.entete`, `ton.nom.*` | Calcul (`Jeu.ton`, jauge minimale) | Ambiance | « ton neutre » est un terme de mécanique affiché au joueur. | Alléger : supprimer « · ton … », garder la couleur et la phrase | P3 |
| Pastille « Signalement clos » / « En attente du retour · Police » (prompt 121) | `sketch.js:761-780`, `sig.statut.*` | Calcul | Savoir si une équipe agit encore | Utile. | Garder | – |
| Titre « 14/09/2026 15:00 — température » | `game.js:693-712`, `narr.titre` | Réel (date, objet) ; l'heure vient de la source si elle existe | Rappeler le fait | L'année est inutile, alors que l'heure de jeu est absente pour 13 dossiers sur 16. | Reformuler | P3 |
| Texte « Agents sur les quais. Réputation +10, budget −3. Rien d'alarmant : le réseau suit son cours. » (+ « Le plaignant a très mal pris votre réponse : réputation −8. ») | `game.js:703-709`, `narr.texte`, `ton.*.v*`, `narr.avecClash` | Calcul et fiction | Conséquence narrée | **« Rien d'alarmant » juste après une alerte de gravité élevée** (`n03-narration.jpg`) : le ton suit les jauges, pas le dossier. Le nom de l'action (« Agents sur les quais ») ne reprend pas la réplique choisie (« des agents arrivent… »). | Reformuler (ton lié au dossier quand il est grave) | P2 |
| Liste des effets « Réputation +10 (dé : 6) », vert / rouge / gris | `sketch.js:795-799`, `narration.de` | Calcul (dé réel) | Lisibilité (soutenance) | **Elle répète pour la 3e fois les mêmes deltas** (texte de narration, cette liste, puis `retour.passe`), plus la pastille flottante et l'annonce. Le dé est **toujours** affiché ici, ce qui rend l'option « Dé visible » presque sans objet : avec l'option, une ligne « Dés tirés : … » s'ajoute en doublon (`n03-narration.jpg`). | Fusionner : une seule ligne d'effets ; dé seulement avec l'option | P2 |
| « Contexte : météo défavorable / heure de pointe / affluence (effet renforcé) » | `sketch.js:800-802`, `narration.contexte`, `ctx.*` | **Affirmation fausse dans la plupart des cas** | Expliquer l'amplitude | Pour les réponses par catégorie (prompt 87, tous les dossiers sauf repli), `Jeu.decider` **n'applique pas** `coefContexte` : seul `bonusSituation` joue, et seulement si la situation correspond (`game.js:590-601`). Vérifié : « Réputation +10 (dé : 6) » = 5 + 5, sans ×1,25, sous « Contexte : affluence (effet renforcé) » (`06-narration.jpg`). | Reformuler : n'afficher « effet renforcé » que si le bonus a joué, et dire lequel | **P1** |
| « Vous avez choisi : X. Effets : … » | `panneau.js:495`, `retour.passe`, `trace.retardFige` | Calcul | Récapituler | Redondant avec ce qui précède (voir plus haut). | Fusionner | P2 |
| « Bon choix, parce que : la situation est calme. » / « « Ne rien changer » convenait mieux, parce que : la situation est calme. » / « votre jauge X est basse (v) » | `panneau.js:498-506`, `retour.*`, `raison.*` (prompt 130) | Calcul (`Jeu.situation` + pondération des jauges) | Apprendre la règle | **La raison contredit l'écran** : « la situation est calme » pour une **agression en cours** (fictif, gravité élevée), une **alerte température** (gravité élevée) et toutes les affluences. `Jeu.situation` ne regarde que météo, pointe et retard > 20 min ; la gravité n'y entre jamais (`game.js:505-518`). Quand la vraie raison est la pondération des jauges (prompt 130), elle n'est dite que sous 45. | Reformuler : la raison doit citer ce qui a pesé (jauge en manque, budget, situation) ; supprimer « calme » quand la gravité est élevée | **P1** |
| Phrase de contexte réelle (« Ce jour-là : 30 °C au plus, 0 mm de pluie, rafales à 22,3 km/h. ») | `sketch.js:805`, `rythme.js:127` (prompt 74) | Réel (ERA5) | Ancrer dans la source | **C'est la première fois que le joueur voit la météo du jour, et c'est après avoir décidé.** | Déplacer avant la décision (voir la liste) | **P1** |
| Boutons « Dossier suivant (Entrée) » / « Pause (P) » ; barre de suite automatique en défi chrono | `sketch.js:812-825` | Interface | Rythme | Suite manuelle hors chrono (prompt 131) : bien. | Garder | – |
| Secousse, hit-stop, sons, éclair de jauge (prompt 96) | `juice.js`, `sketch.js:369-371` | Interface | Faire sentir l'ampleur | Réglable (intensité 100/50/0), coupée par `reduireAnimations`. Le tier suit l'effet réel le plus fort. | Garder | – |
| Annonce « titre. texte. Fluidité −2, Réputation −8… » puis phrase de contexte | `sketch.js:368,374`, `annonce.decision` | Calcul | Lecteur d'écran | La 2e annonce peut écraser la 1re selon le mode aria-live. | À vérifier | P3 |

## B9. Annonces au lecteur d'écran dans l'appli

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| « Nouveau signalement : {quoi}. Enquêtez (5 à 8) puis décidez. » | `sketch.js:349`, `annonce.signalement` | Interface | Prévenir | Elle ne dit ni la gravité ni la ligne, alors que `carte.signalement` les donne. | Fusionner les deux annonces | P3 |
| Plainte lue (`plaignant.annonce`) | `panneau.js:314-317` | Fiction | Lecture | OK. | Garder | – |
| **Répliques, tendances et « conseillé »** | absentes (aucun `annoncer` sur `repliquesDuDossier` / `dessinerTendanceReponse`) | – | La décision | **Un joueur au lecteur d'écran entend « répondez (1 à 3) » sans jamais entendre ce que disent 1, 2 et 3**, ni leurs tendances. Le texte d'aide `poste.geste.repondre` dit en plus « quatre répliques… 1 à 4 » alors qu'il y en a trois. | Ajouter une annonce à l'ouverture du dossier (et sur Tab) : « 1 : … Fluidité en hausse… » ; corriger « quatre » | **P1** |
| Sources (`annonceSource`, citation complète) | `enquete.js:170-181` | Réel | Lecture | Très bien (citation jamais tronquée). | Garder | – |
| Équipes : « Police choisie… », message d'envoi, « Équipe adaptée… » | `carte-alertes.js:623-643` | Calcul | Lecture | OK. | Garder | – |
| Aggravation du retard (« Le retard s'aggrave : +12 → +17 ») | `sketch.js:680-696`, `retard.aggrave` | Calcul (prompt 79) | Pression | Elle ne joue qu'en temps réel : en archive, elle n'est jamais entendue. | Garder | – |

## B10. Rythme, multitâche et modèle du journal

| Information | Où | Origine | Sert à | Questions soulevées | Verdict | P |
|---|---|---|---|---|---|---|
| Temps ×100 sans dossier, pause pendant la lecture (prompt 77/87) | `immersion.js:263`, bandeau | Interface | Rythme | Sans défi chrono, **aucune pression en archive** : pas d'expiration en journée (`multitache.js:140`) et pas d'aggravation (retard null). Le guide, l'option « Pression visible » et `carte.aggrave` décrivent une pression qui ne s'exerce pas. | À trancher (voir la liste) | P2 |
| « s'aggrave ↑ (17 min) » / « expire dans 12 s » | `carte.js:41-46` | Calcul | Pression | Ils n'étaient affichés que dans la liste (code mort, B4). En temps réel, la carte ne montre donc plus l'aggravation, sauf dans PLUS / Info trafic. | Ajouter à l'infobulle du marqueur | P2 |
| Événements de rythme à 10 h, 12 h, 17 h, liaisons, séries (« 2 bonnes d'affilée ») | `rythme.js:17,83-168` | Réel (agenda, météo) et calcul | Faire vivre la journée | Ils passent par le patron et les notifications (autre volet). Aucune information n'est rendue dans la carte. | Garder | – |
| `JournalDonnees` : tuiles (reçus / traités / non traités, bonnes réponses n/total, jauges début → fin, objectif) et contexte (météo, pointe, agenda) | `journal-donnees.js:47-189` | Calcul sur la partie (rien d'inventé, `null` → « non renseigné ») | Relire la journée (appli Journal) | « bonnes » repose sur la même évaluation pondérée que B8, donc hérite de l'incohérence « calme ». Le contexte utilise `ctx.pointe`, fondé sur l'heure de la source : le défaut de l'heure (voir plus bas) se propage au journal. | Garder (le rendu relève d'un autre volet) | P2 |

---

## Informations manquantes pour décider

1. **Le contexte du dossier avant la décision (P1).**
   - Météo du jour (pluie, rafales).
   - Heure de pointe ou creuse.
   - Affluence supposée.
   - Jauge en manque.

   C'est exactement ce qui fait varier les tendances (`effetAttendu`, `game.js:888-914`). Les puces existent mais ne sont plus appelées (`pucesImportance`, `panneau.js:112`). Proposition : une ligne sous la phrase de situation, par exemple « Contexte : pluie 6 mm (défavorable) · 17 h, pointe · budget bas (38) ». La météo du jour ne paraît aujourd'hui qu'*après* la décision (B8).
2. **Une heure de pointe calculée sur l'heure affichée (P1).**
   - Le contexte « pointe » lit l'heure de la **source** (`d.heure`, `game.js:546`).
   - Le joueur voit l'heure **de la partie** (`d.minute`).
   - Un dossier affiché à 17h20 (n° 7 de la semaine) n'est pas en pointe pour le moteur.

   Il faut soit afficher l'heure de la source, soit calculer la pointe sur l'heure de jeu ; et le dire.
3. **Les équipes adaptées et leur effet (P2).** La pertinence (`equipesPertinentes`) divise l'effet par deux, et l'effet arrive après coup. Rien ne dit avant l'envoi quelle équipe convient. L'ancienne mention « Police : 2 dispo » sous la réponse a disparu avec les cartes (prompt 107).
4. **La règle de gravité (P2).** Elle n'est expliquée que dans l'aide. Sur la carte, une infobulle « Gravité moyenne : événement à l'agenda » éviterait de lire une évaluation de la situation.
5. **La source et le mode en un coup d'œil (P2).** « Archive du 14/09 », « Temps réel » ou « Repli local » devraient figurer dans le bandeau, sans attendre d'ouvrir PLUS. Seul « hors ligne » s'affiche aujourd'hui.
6. **L'état de l'objectif (P2) :** tenu, menacé ou raté, et ce que cela rapporte ou coûte ce soir.

## À trancher par le groupe

1. **Clash indiscernable (prompt 117) ou tendance honnête (prompt 130) ?** Aujourd'hui, la tendance « Rép. ▼▼ » et le texte insultant rendent le clash évident.
   - Option A : masquer la tendance du clash (la mettre en « ? »).
   - Option B : assumer qu'il se voit et retirer « indiscernables » du prompt 117.
   - Quelle que soit l'option, corriger le doublon « attendre / clash ».
2. **Affluence comme hypothèse.** Le prompt 134 l'a écrit dans `grammar.md`, pas dans l'interface.
   - Option A : garder les événements « fourre-tout » (ateliers, pause-café) et le dire : « le jeu suppose ».
   - Option B : ne retenir que les événements grand public (`MOTIF_AFFLUENCE`). La semaine aurait alors moins de 15 dossiers.
3. **Hiérarchie fiction / source dans la fenêtre.** La plainte inventée est en 20 px blanc, le fait réel en 16 px gris coupé.
   - Option A : inverser (le fait d'abord, la plainte en citation).
   - Option B : garder la plainte en tête (œuvre, incarnation), mais avec une étiquette « usager fictif » et le fait réel non tronqué.
4. **Gravité.** La garder calculée sur le type (alors la renommer, par exemple « priorité de jeu »), ou la calculer sur la situation (alerte + pointe + ligne tram…).
5. **Révéler les sources par clic** (prompt 50) alors que c'est gratuit hors chrono : mise en scène voulue, ou étape à supprimer pour le visiteur d'exposition ?
6. **Pression en mode archive.** Sans chrono, rien n'expire ni ne s'aggrave dans la journée. L'assumer (jeu de lecture), ou rétablir une pression douce (la plainte s'envenime, prompt 79) visible sur la carte ?
7. **Les options « Pression visible » et « Trace dans le dossier ».** Les rebrancher (`Traces.pression`, `Traces.memoire`), ou réécrire leurs libellés pour qu'ils décrivent ce qu'elles font.

## Constats transverses

1. **Ce qui est présenté comme réel ne l'est pas toujours (P1).**
   - « X attire du monde », « Affluence signalée », « Vigilance », « effet renforcé », l'heure d'arrivée, la citation météo générée : chacun mélange source, calcul et fiction sans le dire.
   - Le jeu marque bien « Fictif » (prompt 119) et « à vol d'oiseau ». Il faut appliquer la même rigueur aux **hypothèses du jeu** (affluence, gravité, heure de partie, conséquence de chaîne).
   - J'ai vérifié le chargement : semaines par `data/semaines.js` (prérempli), repli par `data/fallback.js`, temps réel par GTFS-RT et Open-Meteo (`game.js:35-134`). Les données brutes sont réelles. Les écarts viennent des textes qui les présentent.
2. **La logique d'évaluation et l'écran se contredisent (P1).**
   - La gravité dépend du type.
   - La « situation » ignore la gravité.
   - Le conseil dépend des jauges.
   - Le retour dit alors « calme » après une agression ou une alerte élevée, et le ton dit « rien d'alarmant ».

   Le joueur ne peut pas apprendre une règle qui se contredit d'un panneau à l'autre.
3. **Le contexte de décision a disparu à la refonte du prompt 107 (P1).** Puces, savoirs, cartes de réponse et équipes liées sont du code mort. La fenêtre du plaignant n'a rendu que les tendances (prompt 130). Les informations du « pourquoi » n'apparaissent qu'après la décision (météo du jour, contexte, raison).
4. **Les choix ne sont pas toujours trois (P1)** : quand la meilleure réponse est « attendre », le clash est son jumeau. C'est fréquent en semaine calme (dossiers 4 et 5 sur 5 joués).
5. **L'accessibilité de la décision est incomplète (P1).** Le lecteur d'écran n'entend ni les répliques ni leurs tendances, et l'aide annonce « quatre répliques, 1 à 4 ». Ailleurs, la règle « jamais la couleur seule » est bien tenue (gravité par la taille, tendances par le symbole, deltas par le signe).
6. **La redondance est mal placée (P2).** Les deltas sont dits cinq fois après la décision (narration, liste, retour, pastille, annonce), alors que le contexte n'est dit aucune fois avant. Le bandeau empile priorités, objectif et thème sur une ligne de 16 px. La carte affiche « Zoom ×1,0 » mais pas de légende.
