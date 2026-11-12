# Prompt 102 — Jeu « Nantes en régulation » : l'appli principale devient une carte des alertes réelles, avec le dialogue du plaignant et les équipes envoyées par glisser-déposer

Demande d'origine (12/11/2026) :

> L'application principale se présenterait comme une carte avec des alertes qui ont été réelles. Lorsque l'on
> clique dessus, on a un dialogue d'un plaignant concernant un problème. On a par la suite la possibilité
> d'envoyer une équipe adaptée ou non à la situation en drag and drop.

C'est le premier des trois prompts tirés de cette demande. Les deux autres :
- **103** : les autres applis intégrées à l'appli principale, avec un menu à gauche ;
- **104** : des objets ajoutés sur le bureau au fil des journées.

À exécuter dans l'ordre 102 → 103 → 104.

## Ce qui ne change pas

- `game.js` reste tel quel : règles, Q1–Q61, dés, jauges, effets des équipes (`Jeu.envoyerEquipe`,
  `Jeu.equipesPertinentes`, effets divisés par deux pour une équipe peu adaptée).
  - Seul ajout permis : une fonction **en lecture seule** qui renvoie le plaignant d'un dossier (§ 3).
- Les réponses (cartes du prompt 87, glisser-déposer du prompt 94) restent la décision du dossier.
- L'équipe est une action en plus, comme aujourd'hui ; seul son geste change.
- **Aucune position inventée** (le prompt 73 avait retiré la carte parce que les positions étaient
  arbitraires). Une alerte n'est placée que si une donnée réelle donne son lieu (§ 2). Sinon, elle va dans
  une case « Lieu à préciser ».
- Accessibilité : clavier complet, contraste ≥ 4,5:1, `prefers-reduced-motion`, pas de flash.
- `npm run build` et `npm test` restent verts.
- L'audit des textes (`?audit=textes&parcours=1`) reste à 0 défaut A–D sur l'écran de jeu.

## 1. Disposition de l'écran de jeu (1920 × 1080, dans la fenêtre RégulOS)

| Zone | Où | Rôle |
|---|---|---|
| Bandeau | en haut, inchangé | jauges, heure, objectif |
| Réserve du menu | x 40 → 152 | colonne laissée vide pour le menu du prompt 103 |
| **Carte** | x 168 → 1880 sans dossier ouvert ; x 168 → 740 avec un dossier ouvert | l'écran principal |
| Panneau du dossier | x 756 → 1880 (`PANNEAU`) | dialogue du plaignant, réponses |
| Plateau des équipes | bas de la carte, 96 px | quatre jetons à faire glisser |

- La liste des signalements (`dessinerFileSignalements`) disparaît de l'écran : les marqueurs la remplacent.
- Ses messages utiles passent sur la carte, en une ligne en `blanc50` en haut :
  - « Aucun signalement, prochain à 10:40 » ;
  - « 3 signalements » ;
  - la prévision du prompt 88 si elle est débloquée.
- Ses traces du jour (prompt 89 bis) restent dans le Journal.
- Avec un dossier ouvert, la carte se resserre et **se centre sur le marqueur ouvert** : glissement de
  300 ms, instantané si les animations sont réduites.

## 2. La carte : fond réel, alertes placées seulement si le lieu est connu

**Fond**
- Couches déjà chargées dans `data/lignes.json` :
  - l'eau (Loire, Erdre, Sèvre — occupation du sol 2022) ;
  - les tracés réels des lignes (GTFS Naolib), en filigrane `blanc15`.
- Réutiliser `projeter` et `tracer` de `sketch.js`.
- Couleurs du Pixel Design System : fond `#0D0C0C`, eau en bleu très sombre, aucune nouvelle couleur vive.

**Placement d'une alerte, selon ce que la donnée dit vraiment**

| Cas réel | Placement |
|---|---|
| Ligne(s) connue(s) du joueur (`dossierConnu`) et présente(s) dans `lignes.json` | la ligne entière est surlignée (sa couleur GTFS) ; le marqueur se pose au point milieu de son tracé, avec l'étiquette « Ligne N ». Le marqueur dit « sur la ligne », pas « à cet endroit précis ». |
| Ligne pas encore identifiée par l'enquête (prompt 50) | case **« Lieu à préciser »** ; le marqueur rejoint la ligne dès qu'elle est identifiée. L'enquête devient visible sur la carte. |
| Alerte météo (Open-Meteo, Nantes) | marqueur au centre de l'emprise, étiquette « Toute la métropole », léger voile sur la carte tant que l'alerte est ouverte |
| Événement de l'agenda (pas de coordonnées dans l'instantané) | case « Lieu à préciser », avec le nom du lieu tiré de `texte_source` |

La case « Lieu à préciser » est en bas à gauche de la carte, au-dessus du plateau. Ses marqueurs sont alignés
et ont le même comportement que les autres.

**Le marqueur**
- Un carré pixel de 28 px, à la couleur de gravité (`couleurGravite`).
- Pas de texte permanent à côté : l'étiquette (heure · type) n'apparaît qu'au survol ou au focus.
- Marqueur pris (actif, prompt 77) : bordure blanche.
- Marqueur ouvert : bordure rouge.
- Nouveau marqueur : une seule onde de 600 ms à l'arrivée (rien si animations réduites, aucun clignotement).

**Interactions**
- **Clic sur un marqueur** = prendre le signalement (`prendreSignalement`) et ouvrir son dossier. L'étape
  intermédiaire « Prendre ce signalement » (`dessinerSelection`) disparaît : c'était un clic de plus.
- **Clavier :**
  - ↑ ↓ (ou Tab dans la carte) parcourent les marqueurs dans l'ordre de la file ;
  - Entrée prend le marqueur focalisé ;
  - l'annonce `aria-live` donne heure, type, gravité et lieu (« ligne 2 » ou « lieu à préciser ») ;
  - le guide (`cibleGuide('fileSignalements')`) pointe le premier marqueur.

## 3. Le dialogue du plaignant (panneau du dossier)

- En tête du panneau, à la place du bloc « Ce qui se passe », une **bulle de dialogue** :
  - avatar pixel de l'usager (`avatarUsager` de `community.js`) ;
  - pseudo ;
  - texte de la plainte.
- Le plaignant vient de `data/messages.json` : les plaintes écrites par le groupe, déclenchées **seulement**
  par un fait réel du dossier (`condition`).
  - Ajouter `Jeu.plaignantPour(index)`, **sans effet de bord**. Elle renvoie la plainte Community déjà
    déclenchée pour ce dossier, sinon la plainte la plus spécifique qui correspond, choisie de façon
    déterministe comme dans `Jeu.declencherPlainte`, sans l'ajouter à `Jeu.plaintes`.
  - Si aucune plainte ne correspond, c'est **la source qui parle**, sans plaignant inventé : bulle
    « Signalement · {source} » et le `texte_source` réel.
- Sous la bulle, en `blanc50` sur une ligne : le fait réel (`phraseSituation`) et sa source.
- **Rien n'est répété** : le titre du panneau donne la ligne et la gravité ; la bulle ne les redit pas.
- Les blocs « Pourquoi c'est important » et « À savoir », « En savoir plus », le conseil et les cartes de
  réponse restent, dans cet ordre.

## 4. Les équipes par glisser-déposer

- **Plateau** en bas de la carte : quatre jetons (police, ambulanciers, techniciens, pompiers).
  - Chaque jeton porte un pictogramme pixel, son nom court et ses disponibilités (« 2/2 »).
  - Indisponible : grisé avec « retour 12 s ».
  - Verrouillé avant la semaine 2 (`Jeu.elementDebloque('equipes')`) : cadenas, et le texte de verrou
    existant au survol.
- **Glisser un jeton** sur le marqueur du dossier ouvert ou sur son panneau envoie l'équipe :
  `envoyerEquipeIncident(cle)`, mêmes règles et mêmes messages qu'aujourd'hui.
  - Pendant le glisser, le marqueur et le panneau montrent la zone de dépôt en pointillés blancs.
  - Lâché ailleurs : le jeton revient en 200 ms, sans effet.
  - **Adaptée ou non** : le joueur peut envoyer n'importe quelle équipe. Ce n'est qu'**après** le dépôt que
    le retour dit « adaptée » (vert) ou « peu adaptée : effet réduit de moitié » (alerte), d'après
    `Jeu.equipesPertinentes`. Le jeton ne dit pas à l'avance lequel est le bon : c'est la décision du
    joueur.
- **Équipes engagées** : un petit jeton à côté du marqueur, avec un anneau d'état :
  - pointillé = en route ;
  - plein = sur place ;
  - estompé = retour.

  Leur position ne bouge pas sur la carte : aucun trajet n'est inventé.
- **Clavier et tactile :**
  - Maj + 1/2/3/4 envoient toujours l'équipe ;
  - un clic (ou un tap) sur un jeton puis sur le marqueur fait la même chose que le glisser ;
  - en mobile portrait, un tap sur le jeton l'envoie au dossier ouvert.
- L'onglet / la section « Équipes » du panneau (`dessinerEquipesIncident`) n'est plus utile : son contenu
  est sur le plateau. Le retirer pour ne pas répéter l'information.

## 5. Vérifications

- **Partie complète en 1920 × 1080 :** semaine 1 et semaine 2 (équipes), à la souris puis au clavier seul.
- **Placement :** chaque marqueur placé sur une ligne correspond à une ligne réellement citée par le dossier
  et identifiée. Les autres sont dans « Lieu à préciser ».
- **Plaignant :** chaque bulle vient de `messages.json` (identifiant noté dans le rapport) ou de la source
  réelle.
- `npm test` et `npm run build` sont verts ; l'audit des textes reste à 0 défaut A–D sur l'écran de jeu.
- Le rapport va dans `jeu/102-carte-plaignant-equipes.md`, avec des captures avant / après ou un
  descriptif écran par écran.
- `prompts/README.md` (statut) et une ligne en tête de `journal.md`.
