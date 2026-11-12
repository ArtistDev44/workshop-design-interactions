# Prompt 104 — le bureau se remplit au fil des journées jouées

Date : 12/11/2026. Branche `jeu/104-bureau-au-fil-des-journees` (partie de la branche du prompt 103).

## Table appliquée (`site/public/progression-bureau.js`, `OBJETS_PROGRESSION`)

| Journées terminées | Objet | Écart avec la proposition |
|---|---|---|
| toujours | téléphone, clavier, souris, écran, pièce (baie, lampe, horloge, webcam) | — |
| 1 | tasse de café (mécanique du café disponible dès qu'elle est là) | — |
| 2 | livre « Aide », plante grasse | le livre d'aide est aussi là **dès le jour 1 tant que le guide « Prendre en main » est actif** : sa dernière étape le montre. L'aide reste toujours accessible par H et par le menu |
| 3 | pile de dossiers | — |
| 4 | micro du poste | sans micro, l'appui long sur M ne l'ouvre pas ; l'appui bref (son) reste |
| 5 | livre « stress » | — |
| 6 | **nouveau** : deux post-it | posés sur le plateau au pied de l'écran (et non collés sur l'écran) : ils ne couvrent jamais l'écran du PC |
| 8 | **nouveau** : cadre photo vu de dos | — |
| 10 | **nouveau** : la plante a grandi | — |

## Fonctionnement

- **Compteur** (`joursPasses`), le plus grand de ces nombres :
  - journées de la carrière (`Taches.carriere().jours`, gardé en local entre les parties) ;
  - journées de la partie (`joursJoues`) ;
  - jour de la semaine en cours.

  Sans stockage local, il reste donc au moins le jour de la semaine.
- **Un objet absent :**
  - n'est pas dessiné (`dessinerObjetsDuFond`, `dessinerObjetsProches`, `dessinerLivres`) ;
  - n'est pas cliquable : `visible` dans `OBJETS_BUREAU`, sauté par Tab.
- **Arrivée :**
  - posé de 4 px en 250 ms (`poseObjet`, rien si animations réduites) ;
  - annonce `aria-live` « Nouveau sur votre bureau : … », **une seule fois** (clé locale
    `pxe-nte001-bureau-annonces`) ;
  - ni notification ni son.
- **Carrière remise à zéro :** la liste des annonces est vidée, et le bureau redevient celui du premier jour.
- **`?jours=N`** : outil de test qui n'écrit rien.
- **Au passage :** l'étape « applis » du guide montre maintenant le menu à gauche (prompt 103). Son texte
  dit « Dans le menu à gauche : Patron, Community, Journal ou Données ».

## Vérifié dans le navigateur

- `?jours=0` : bureau nu (clavier, souris, téléphone). Seuls l'écran, la lampe, le téléphone, la fenêtre,
  l'horloge et la webcam sont atteignables.
- Test à 6 jours : post-it au pied de l'écran, pas de cadre.
- Test à 10 jours : tous les objets, plante qui a grandi.
- Annonce : carrière simulée à 1 journée → « Nouveau sur votre bureau : la tasse de café. » une fois ;
  second passage → aucune annonce.
- `npm run build` vert ; `npm test` : 475 + 547 contrôles réussis.

## Reste à vérifier

- Une vraie partie de deux journées sans paramètre (arrivée de la tasse au 2e matin) : [À COMPLÉTER].
- Navigation privée (stockage indisponible) : [À COMPLÉTER].
