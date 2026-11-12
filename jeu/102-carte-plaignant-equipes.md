# Prompt 102 — carte des alertes réelles, dialogue du plaignant, équipes par glisser-déposer

Date : 12/11/2026. Branche `jeu/102-carte-plaignant-equipes` (partie de la correction 101 b).

## Ce qui a été fait

- **Carte** (`site/public/carte-alertes.js`, nouveau) à la place de la liste des signalements :
  - pleine largeur (x 168 → 1880) entre deux signalements ;
  - resserrée (x 168 → 740) et centrée sur le marqueur quand un dossier est ouvert ;
  - colonne x 40 → 152 réservée au menu du prompt 103.
- **Fond réel** (`data/lignes.json`) : eau (occupation du sol 2022) et tracés GTFS Naolib en filigrane.
- **Placement, jamais inventé** (`lieuAlerte`) :

| Cas | Placement |
|---|---|
| Ligne identifiée (`dossierConnu`) et présente dans le GTFS | ligne surlignée, marqueur au milieu de son plus long tracé |
| Alerte météo | centre de l'emprise, « Toute la métropole », voile bleu léger |
| Ligne pas encore identifiée, événement de l'agenda | case « Lieu à préciser » (le nom du lieu de l'agenda est dans l'infobulle) |

- **Marqueur :**
  - carré de la couleur de gravité ;
  - bordure rouge pour le dossier ouvert, blanche pour un signalement actif ;
  - une onde unique à l'arrivée (rien si animations réduites) ;
  - infobulle au survol ou au focus.
- **Clic sur un marqueur** = `prendreSignalement` : l'étape « Prendre ce signalement » (`dessinerSelection`)
  n'est plus affichée. Le clavier (↑ ↓ Entrée) est inchangé : `toucheFileSignalements`.
- **Une seule ligne d'état** en haut de la carte : nombre de signalements, ou reste de la journée, ou la
  prévision du prompt 88. L'indicateur « reste de la journée » sous la liste est retiré, ce qui supprime
  un doublon.
- **Dialogue du plaignant** (`bulleDuPlaignant`, `panneau.js`) à la place du bloc « Ce qui se passe » :
  - `Jeu.plaignantPour(index)` (ajout **en lecture seule** dans `game.js`) renvoie la plainte Community déjà
    déclenchée, sinon la plus spécifique de `data/messages.json` qui correspond aux faits réels. Exemple
    vérifié : `affluence`, @nantaise_du_tram ;
  - sans plainte correspondante, c'est la source qui parle (« Signalement · Agenda des événements… ») ;
  - le fait réel (`phraseSituation`) reste dessous, en `blanc50`.
- **Plateau des équipes** en bas de la carte :
  - 4 jetons (pictogrammes pixel), disponibilités ou « retour 12 s » ;
  - disposés en 2 × 2 quand la carte est resserrée ;
  - glisser un jeton sur le marqueur ou le panneau du dossier ouvert = `envoyerEquipeIncident` (règles
    inchangées). Lâché ailleurs, il revient (200 ms) ;
  - clic sur un jeton puis sur le dossier = même chose. Maj + 1–4 restent. Un tap sur mobile envoie au
    dossier ouvert ;
  - l'adéquation n'est dite **qu'après** le dépôt : « Équipe adaptée », ou le message existant « hors
    sujet : effet divisé par deux » ;
  - les équipes engagées ont un petit jeton à côté du marqueur, avec un anneau pointillé (en route), plein
    (sur place) ou rien (retour).
- **L'onglet « Équipes »** de « En savoir plus » est retiré : son contenu est sur le plateau.
- **Correction au passage** (`glisser.js`) : les cartes de réponse étaient relevées dans le repère de
  l'appli (fenêtre réduite à 91 %), mais la souris était lue dans le repère de l'écran du PC. Les deux
  utilisent maintenant `sourisAppli()`.

## Vérifié dans le navigateur (pane 1024 × 768)

- Carte pleine (jour 1), marqueur « Lieu à préciser » (événement), infobulle avec le lieu réel.
- Dossier ouvert : carte resserrée, bulle @nantaise_du_tram, panneau complet.
- Équipes (déblocage forcé pour le test) :
  - envoi Police → « Équipe adaptée » ;
  - **vrai glisser à la souris** du jeton Techniciens sur le panneau → envoyé, « hors sujet : effet divisé
    par deux ».
- **Vrai glisser** d'une carte de réponse sur le dossier → décision prise (phase narration).
- Marqueur sur la ligne 97 (Vertou - Trentemoult) surligné, et alerte météo au centre avec voile. Ce test a
  forcé `dossierConnu` : il ne remplace pas une partie réelle.
- `npm run build` vert ; `npm test` : 467 + 543 contrôles réussis.

## Reste à vérifier

- Partie complète au clavier seul en semaine 2 : [À COMPLÉTER].
- Mobile portrait 412 px : [À COMPLÉTER].
