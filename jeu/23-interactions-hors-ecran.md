# 23 — Interactions hors écran, dans la pièce (prompt 29)

Décisions verrouillées. En vue bureau, on peut interagir avec cinq objets de la pièce. Ce sont de simples micro-interactions : elles ne mettent pas la partie en pause, ne touchent pas aux jauges et ne remplacent jamais une action du jeu.

Note de numérotation : le prompt demandait `jeu/16-interactions-hors-ecran.md`, mais le n° 16 est déjà pris (apps du PC). Ce fichier prend donc le n° 23.

## Objets (`OBJETS_BUREAU`, `immersion.js`, marqués `piece: true`)
| Objet | Zone (pixel art) | Effet |
|---|---|---|
| Lampe d'architecte | abat-jour 62,140 · 26×12 | Allumer ou éteindre. Éteinte : pas de cône de lumière ni d'ampoule, et le plateau est assombri d'un voile bleu nuit `rgba(18,22,40,0.15)` (`dessinerAmbianceLampe`). L'écran du PC, dessiné après, n'est pas touché. État persistant dans `localStorage` (`pxe-nte001:jeu:lampe`). |
| Fenêtre (baie, panneaux de droite) | 340,14 · 132×96 | Baisser ou relever un store vénitien (`dessinerStore`) : lames claires, la ville reste visible entre elles. Message : météo réelle et heures (voir plus bas). |
| Plante | 69,153 · 16×21 | Réaction selon la pluie réelle du jour (≥ 1 mm), sinon selon l'heure. |
| Tasse | 118,178 · 22×28 | Heure du jeu et nombre réel de dossiers du jour (si une partie est en cours). |
| Pile de dossiers | 390,160 · 44×15 | Date et nombre réel de dossiers de la journée, ou invitation à choisir une semaine. |

- La zone de la fenêtre ne recouvre pas l'écran du PC. Les zones passent par `versEcranBureau()` : elles suivent donc le dézoom et la caméra du prompt 25.
- Météo de la fenêtre (`meteoFenetre()`), sans aucune donnée inventée :
  1. météo réelle du jour joué (archives de la semaine) ;
  2. sinon, météo du moment (Open-Meteo, `Jeu.meteoActuelle`) ;
  3. sinon, instantané local `fallback` (date affichée) ;
  4. sinon, « Météo indisponible ».
- Heures affichées : l'heure réelle (`new Date()`) et l'heure du jeu (`heureAffichee()`).

## Affordance et accessibilité
- Au survol ou au focus Tab : cadre jaune `#f2c94c`, curseur main et infobulle « Objet — Entrée : … ».
  - Le curseur main s'affiche au survol de toute zone cliquable, et seulement quand l'état change.
  - Infobulle : texte `#FFFDF7` sur `rgb(28,39,51)`, contraste > 12:1.
- Activation au clic, ou Tab puis Entrée. La réaction s'affiche dans une bulle pendant 5 s (`bulleTexte`, multiligne), est annoncée en `aria-live` et s'accompagne d'un bip discret. L'infobulle de survol est masquée pendant la réaction.
- Aucune animation de transition : l'état change d'une image à l'autre, ce qui convient aussi à `prefers-reduced-motion`.
- Aide (H) : nouvelle ligne « Tab → Bureau : objets (lampe, fenêtre, plante, tasse, dossiers…) ». L'interligne passe à 28 px.

## Frontières
- Les objets ne sont cliquables qu'en vue bureau : au poste, `zonesObjetsBureau()` n'est pas appelée.
- Aucune pause, aucune jauge modifiée. Échap et la porte (prompt 26) fonctionnent comme avant.

## Vérifications
- `npm run build` OK.
- Test automatisé (Chromium, 1920×1080), sans erreur console, en FR (en ligne) et en EN (API bloquées) :
  - chaque objet : curseur `pointer` au survol, clic → réaction ;
  - lampe persistée `eteinte` ;
  - fenêtre : météo réelle du jour en ligne, instantané local du 12/10/2026 hors ligne ;
  - jauges inchangées ;
  - Tab ×5 → lampe, Entrée → bascule.

## Mise à jour (prompt 59, check-up du 10/11/2026)
- `dessinerAmbianceLampe` a été remplacé au prompt 51 par `dessinerEclairage` (`journee.js`) : lampe, stores et heure assombrissent toute la pièce, halo de l'écran.
