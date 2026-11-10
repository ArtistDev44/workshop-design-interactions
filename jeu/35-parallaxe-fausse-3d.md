# 35 — Parallaxe multicouche, fausse 3D (prompt 40)

Quand la vue se décale légèrement au mouvement de la souris ou aux flèches (caméra du prompt 25, 12 px au plus), chaque plan de la pièce bouge maintenant à sa propre échelle. Le lointain bouge à peine, les objets proches un peu plus : cela donne une impression de fausse 3D. Les décisions Q1–Q61 ne changent pas.

## Plans (`COUCHES_PIECE`, `bureau.js`)
| Plan | Contenu | Coefficient k | Décalage max |
|---|---|---|---|
| Lointain | Ciel, ville, grue, Loire, péniche, pluie (`dessinerVueNantes`) | 0,35 | ≈ 4 px |
| Baie | Plafond, menuiseries, store, mur de droite (horloge, applique), allège | 0,7 | ≈ 8 px |
| Plateau | Plateau, écran du PC, lumière du jour | 1 (référence) | 12 px |
| Fond du plateau | Clavier, dossiers, plante (`dessinerObjetsDuFond`) | 1,1 | ≈ 13 px |
| Objets proches | Souris, tasse, téléphone, livres (`dessinerObjetsProches`) | 1,25 | 15 px |
| Voile | Lampe éteinte, paupières de la sieste | 1 | 12 px |

- Décalage d'un plan = `(k − 1) × caméra`, ajouté au décalage de référence. Entre la souris au bord gauche et au bord droit, on mesure 30 px pour un livre, 24 px pour l'écran et 17 px pour l'horloge murale.
- Chaque plan est un calque transparent de 480×270, redessiné au même rythme qu'avant (66 ms, 250 ms avec animations réduites). Les plans sont composés hors écran (`cCouches`) puis posés en une seule fois. Le flou éventuel du temps accéléré s'applique donc une seule fois.
- `gBureau` reste l'image composée et alignée, utilisée par le menu principal, la vue au poste et les bords flous.
- Aucun trou visible : le surcadrage (≈ 48 px à gauche et à droite, ≈ 27 px en haut et en bas) absorbe tous les décalages.

## Zones et repères qui suivent leur plan
- `versEcranBureau(x, y, l, h, k)` reçoit le coefficient du plan. `COEF_OBJETS` le donne pour chaque objet :
  - livres, tasse, téléphone : 1,25 ;
  - plante, dossiers : 1,1 ;
  - applique, fenêtre : 0,7.
- Suivent aussi leur plan : les zones cliquables, les infobulles et bulles des objets, l'étiquette de l'horloge murale (plan « baie ») et les flèches du guide (prompt 37).
- Au poste, pendant les zooms et avec animations réduites, la caméra vaut 0 : tous les plans sont alignés.

## Vérifications
- `npm run build` et `npm test` OK.
- Test automatisé, sans erreur console :
  - souris au bord gauche puis au bord droit → livre 29,8 px, écran 23,9 px, horloge 16,7 px ;
  - clic sur le livre « stress » avec la caméra décalée → le livre s'ouvre ;
  - animations réduites → caméra à 0.
- Tests des prompts 25, 26, 29, 33, 35, 37 et 38, et des livres, relancés sans régression.
