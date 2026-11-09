# 11 — Direction artistique (à coder telle quelle)

Style : **clair 2D, low poly léger simulé en couches**. Cible : salle de contrôle
lumineuse, esprit dossier administratif. Jamais l'identité Naolib (pas de bleu
`#005AE1`, pas de police Picon).

## Palette (hex)

| Rôle | Hex | Usage |
|---|---|---|
| Fond page | `#F5EFE3` | crème/papier, plein écran |
| Panneau | `#FFFDF7` | cartes, dossier, jauges, menu, paramètres |
| Texte principal | `#1C2733` | titres, textes, boutons |
| Accent | `#0E3B46` | bleu pétrole foncé : boutons, titres, contours, sélection |
| Vert (à l'heure) | `#1E7A3C` | état des lignes, jauge positive |
| Orange (retard) | `#B45309` | état des lignes, avertissements |
| Rouge (incident) | `#B3261E` | alertes, jauge critique, clignotement |
| Gris secondaire | `#6B7280` | textes secondaires, désactivé, mode hors ligne |

Contraste : toutes les paires texte/fond ci-dessus dépassent 4,5:1.

## Polices

- **Données chiffrées** : `IBM Plex Mono` (monospace).
- **Textes et boutons** : `Inter` (sans-serif).
- Chargement Google Fonts, **fallback système obligatoire** hors ligne :
  `ui-monospace, Menlo, Consolas, monospace` et `system-ui, sans-serif`.

## Low poly (décor uniquement)

- 2–3 couches max, formes géométriques simples, ombres portées douces.
- Couche 1 (fond) : eau (Erdre, Loire) en polygones plats.
- Couche 2 : quais et îlots en relief léger.
- Couche 3 : tracé des lignes **par-dessus, net et lisible**, jamais noyé dans le relief.
- La météo du jour se lit dans le décor (nuages, pluie, soleil) en formes simples.

## Menu d'accueil

- Fond `#F5EFE3` plein écran, décor low poly léger identique au jeu (météo du jour visible).
- Titre **« Nantes en régulation »** en Inter, `#1C2733`, grand, centré en haut.
- Liste des 3 semaines : panneaux `#FFFDF7` ; semaine sélectionnée = bordure + texte
  `#0E3B46` ; difficulté affichée en IBM Plex Mono (facile / normale / difficile).
- Bouton **Jouer** : fond `#0E3B46`, texte `#FFFDF7`, police Inter.
- Bouton **Paramètres** : même style, accès à l'écran de réglages.
- Indicateur **« mode hors ligne »** discret : texte gris `#6B7280`, IBM Plex Mono,
  uniquement si l'API est injoignable.

## Paramètres (écran réglages)

- Même fond `#F5EFE3`, réglages dans un grand panneau `#FFFDF7`.
- Une ligne par réglage : libellé en Inter `#1C2733` à gauche, contrôle à droite,
  **valeur active en IBM Plex Mono**.
- Réglages : son on/off (`M`), mode en ligne / hors ligne (forcer le fallback),
  accessibilité (réduire les animations, contraste renforcé, taille du texte
  petit / normal / grand).
- Bouton **Retour** : fond `#0E3B46`, texte `#FFFDF7`.
- Persistance en `localStorage` inchangée (voir `09-parametres.md`).

## UI de jeu (rappel)

- Panneaux `#FFFDF7` à coins légèrement arrondis, ombre douce.
- Carte + liste des lignes à gauche, dossier + actions + jauges à droite (1920×1080).
- Jauges : 3 barres horizontales en bandeau, couleurs de la palette.
- Compteur de temps : barre horizontale qui se vide en haut du dossier.
- Code couleur des lignes : vert / orange / rouge clignotant (le clignotement
  doit pouvoir être réduit avec `prefers-reduced-motion`).

## À faire / à éviter

- À faire : fond crème uni derrière les panneaux, hiérarchie claire (dossier en avant).
- À éviter : relief sur les tracés de lignes, textes sur le décor sans panneau,
  couleurs Naolib, plus de 3 couches de parallaxe.
