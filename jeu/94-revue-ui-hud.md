# 94 — Revue UI / HUD : lisibilité, cibles, gestes directs (prompt 98, skill `game-ui-design`)

Skill appliqué : `~/.claude/skills/game-ui-design/` (`SKILL.md` ; `references/patterns.md`, `sharp_edges.md`, `validations.md`).

`game.js`, Q1–Q61 et les données ne sont pas modifiés.

## 1. Audit outillé contre `validations.md`
L'outil `?audit=textes&parcours=1` (prompt 93), en développement seulement, relève désormais en plus :
- **small-font-size** : tout texte affiché sous 14 px (taille réelle, avec l'échelle de 90 % de l'écran du PC au poste) ;
- **small-touch-target** : toute cible cliquable de moins de 44 px à l'écran (hors zones « clic pour continuer » plein écran) ;
- le **nombre de boutons cliquables par écran**, pour suivre l'objectif « moins de boutons ».

Une recherche statique dans `npm test` complète le parcours : elle trouve les tailles fixes qu'il n'affiche pas (axes et légendes du Journal).

| Mesure (1920×1080, FR + EN, contraste ou non) | Avant | Après |
|---|---|---|
| Défauts A à D (prompt 93) | 0 | 0 |
| Textes affichés sous 14 px (parcours) | 18 | 0 |
| Tailles fixes sous 14 px dans le code | 12 | 0 |
| Cibles distinctes de moins de 44 px | 13 | 9 (dont 6 à 42-43 px) |
| Boutons, signalement ouvert / liste | 19 / 15 | 19 / 15 |

## 2. Gestes directs (prompts 94 à 97, vérifiés)
- **Décider :**
  - un geste : glisser la carte sur le dossier, ou un clic direct sur la carte, ou une touche 1 à 4 ;
  - aucune confirmation pendant une décision.
- **Quitter la journée :** un seul bouton visible dans le bandeau, ou Q.
- **Intro :** Échap passe toute la conversation SMS (prompt 97).
- **Applis verrouillées (prompt 91) :** quand l'option « déblocage par semaine » est active, le verrou est réel et pas seulement cosmétique : `appliDebloquee` refuse l'ouverture avec secousse et infobulle. L'option reste désactivée par défaut, comme décidé au prompt 91.
- **Pourquoi le nombre de boutons ne baisse pas :** chaque bouton restant a un rôle immédiat (« does the player need this RIGHT NOW? », `patterns.md`) :
  - les 4 cartes et l'onglet « En savoir plus » ;
  - Quitter, Aide et Recommencer, raccourcis d'actions fréquentes et documentés ;
  - les icônes de la barre des tâches.
  - Les retirer aurait déplacé la complexité vers des raccourcis cachés (`sharp_edges.md`, « Inconsistent button behavior »).

## 3. Corrections (lisibilité en pleine action)
- **Textes sous 14 px** :
  - axes du rapport (13 → 15) ;
  - axes, légendes, échelles et cartes de semaine du Journal (12-13 → 14) ;
  - détail du profil de fin (13 → 14, deux lignes et « … » en fin de mot) ;
  - aide H : « Objets du bureau… » et « Sources… » raccourcis, `ajusterTaille` jamais sous 14.
  - `bouton()` ne réduit plus un libellé sous 14 px. Le bouton de musique passe de 280 à 340 px pour garder le titre du morceau à 14 px.
- **Cibles** :
  - ✕ des applis : zone de clic de 58 × 52 px, le dessin reste 40 × 28 ;
  - barre de somnolence : zone de 54 px de haut, dessin inchangé ;
  - boutons du bandeau (Quitter, Aide, Recommencer) : 48 → 56 px ;
  - « En savoir plus », « Retour au résumé », « Publier » et onglets Enquête / Historique / Équipes : 44 → 52 px (espacements conservés ; zone des sources 238 → 232 px).
- **Infobulles** : celles du bandeau (ligne complète, vitesse du temps) apparaissent après 350 ms de survol (`tooltip-no-delay`).
- **Information jamais portée par la seule couleur** (vérifié) : gravité doublée d'un texte, seuils des jauges en repères visibles, symbole ⚠ sur les dépassements météo.
- **Mouvement** : aucune animation décorative ajoutée. Les seules animations disent quelque chose (prompt 96), et toutes sont coupées avec les animations réduites (`missing-reduced-motion-check`).

## 4. Reste et justification
- **6 cibles à 42-43 px** (onglets et boutons du panneau, ✕) : à 1 ou 2 px du seuil à 1920×1080, et bien au-dessus du minimum WCAG 2.5.8 (24 px) pour la souris. En mobile, la mise en page portrait du prompt 60 a ses propres cibles de 44 px ou plus.
- **3 objets de la pièce le soir** (37 à 42 px) : ce sont des objets du décor diégétique (flèche de sortie, objets). Ils sont aussi atteignables au clavier (Tab, Entrée, S) et par la sortie automatique (prompt 94).
- **Limite de l'outil en mobile portrait** : il mesure en coordonnées du canevas 1920×1080. Les cibles du portrait recomposé (`portrait.js`) ne sont pas comptées par le parcours ; leurs 44 px viennent du prompt 60.
- **Tests humains** (mobile portrait au pouce seul ; partie entière au clavier seul) : [À COMPLÉTER].

## Vérifications
- `npm test` passe : 442 contrôles smoke et 533 contrôles du jeu. Il vérifie en plus : aucune taille fixe sous 14 px dans `site/public/` ; `bouton()` jamais sous 14 px ; délai de l'infobulle ; zones de clic du ✕ et de la somnolence.
- Audit des textes : 0 défaut A à D en 1920×1080 et en mobile portrait.
- Chromium, en FR et en EN : glisser-déposer, clic, touches, Q et Journal (vues Jour et Semaine), sans erreur de console.
- Première décision toujours atteinte en 13 gestes et 10 s.
