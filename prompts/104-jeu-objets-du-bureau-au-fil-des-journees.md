# Prompt 104 — Jeu « Nantes en régulation » : le bureau se remplit au fil des journées jouées

Demande d'origine (12/11/2026) :

> Nous souhaitons également l'ajout progressif, en fonction des journées passées, d'éléments sur le bureau
> (à part le téléphone, car il appartient au joueur, et également le clavier et la souris).

Troisième des trois prompts (102 → 103 → **104**).

## Principe

- **Toujours présents dès le premier jour :**
  - le téléphone (il appartient au joueur) ;
  - le clavier et la souris ;
  - l'écran ;
  - les éléments de la pièce, qui ne sont pas posés sur le bureau : baie, lampe murale, horloge, webcam
    posée sur l'écran.
- **Tout le reste du plateau** arrive **au fil des journées jouées**. Le joueur s'installe : son bureau
  raconte le temps passé au poste.
- Le compteur utilisé est le nombre de **journées terminées**, toutes semaines confondues : la carrière déjà
  enregistrée, `Taches.etat().joursJoues` (prompt 91, clé locale `pxe-nte001-carriere`).
  - Si le stockage local est indisponible (navigation privée, données effacées), on prend le jour de la
    semaine en cours (`Jeu.jourIndex`), au minimum.
- Les éléments liés à un **événement** gardent leur propre règle :
  - le rapport du soir (prompt 41 / 89 bis) ;
  - la flèche de sortie du soir (prompt 69).

## 1. Calendrier d'apparition (proposition, à valider en groupe)

| Journées terminées | Ce qui apparaît | Fonction |
|---|---|---|
| 0 | rien d'autre que le téléphone, le clavier et la souris | — |
| 1 | la tasse de café (prompt 52) | mécanique du café, disponible dès qu'elle apparaît |
| 2 | le livre « Aide » (prompt 34 / 70) et la petite plante grasse (prompt 29) | aide (aussi dans le menu et touche H), interaction plante |
| 3 | la pile de dossiers (prompt 29) | interaction existante |
| 4 | le micro du poste (prompt 54) | appui maintenu, disponible dès qu'il apparaît |
| 5 | le livre « stress » (prompt 20) | interaction existante |
| 6 | **nouveau** : deux post-it collés au pied de l'écran (motifs pixel, sans texte lisible inventé) | décor |
| 8 | **nouveau** : un cadre photo de dos (on ne voit que le dos du cadre : aucune personne représentée) | décor |
| 10 | **nouveau** : la plante grasse a grandi (une feuille de plus, dessin existant agrandi) | décor |

- **Les nouveaux décors** sont dessinés en pixel art dans le style du bureau (palette `P` de `bureau.js`,
  ombre `ombreObjet` du prompt 51). Ils ne sont pas cliquables et n'ont aucun effet de jeu.
- Une **mécanique liée à un objet** n'est pas disponible tant que l'objet n'est pas là : la tasse et le
  micro. On vérifie avant l'exécution :
  - qu'aucun tutoriel ni guide du jour 1 ne demande cet objet (`cibleGuide`, `tutoriel`) ;
  - si c'est le cas, l'objet apparaît le jour où le guide en a besoin, et le rapport le note.
- L'aide reste toujours accessible par le menu et la touche H, même avant l'arrivée du livre.

## 2. L'arrivée d'un objet

- Le premier matin où un objet est là, il apparaît avec un **léger posé** : 4 px de chute, 250 ms, sans
  rebond. Rien du tout si les animations sont réduites.
- Une **annonce** `aria-live` l'accompagne : « Nouveau sur votre bureau : la tasse de café ».
- **Pas de notification** ni de son supplémentaire.
- Les objets ajoutés sont **mémorisés** avec la carrière : on ne les annonce qu'une fois.
- **Remettre la carrière à zéro** (prompt 88, `remettreCarriere`) vide aussi le bureau, comme au premier jour.

## 3. Mise en œuvre

- **Table :** une table `OBJETS_PROGRESSION` (clé → journées requises) dans un nouveau fichier
  `progression-bureau.js`, chargé avant `bureau.js` et ajouté au cache du service worker (`sw.js`).
- **Dessin :** `dessinerObjetsDuFond`, `dessinerObjetsProches` et `dessinerLivres` testent
  `objetPresent(cle)` avant de dessiner chaque objet. Les couches de la pièce sont redessinées quand le
  compteur change (`dessinerPieceBureau`).
- **Zones cliquables :** chaque entrée de `OBJETS_BUREAU` concernée reçoit `visible: () => objetPresent(cle)`,
  en combinant avec un éventuel `visible` déjà présent. Un objet absent n'est ni cliquable, ni atteignable
  au clavier, ni annoncé.
- **Test :** paramètre `?jours=N` (outil de test, sans effet sur la sauvegarde) pour voir le bureau à N
  journées.

## 4. Vérifications

- `?jours=0`, `?jours=1`, `?jours=3`, `?jours=6` et `?jours=10` : chaque bureau correspond à la table.
  Aucune zone cliquable ne reste sans objet.
- **Une vraie partie de deux journées** (sans le paramètre) :
  - la tasse arrive au 2e matin, avec l'annonce, une seule fois ;
  - la touche H ouvre l'aide avant l'arrivée du livre.
- **Navigation privée** (stockage indisponible) : pas d'erreur, et le jour de la semaine sert de compteur.
- `npm run build` et `npm test` sont verts ; le service worker met en cache le nouveau fichier.
- **Livrables :**
  - rapport `jeu/104-bureau-au-fil-des-journees.md` (table réelle appliquée, écarts avec la proposition) ;
  - `prompts/README.md` ;
  - une ligne en tête de `journal.md`.
