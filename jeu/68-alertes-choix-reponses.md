# 68 — Alertes : des choix de réponses pertinents (prompt 72)

Code : `alertes.js` (nouveau, logique pure, testée sous Node), `sketch.js` (affichage et clavier), `enquete.js`

> **Mise à jour (prompt 59, check-up du 11/11/2026) :** `alertes.js` a été retiré au prompt 87 ; les réponses
> rédigées par catégorie (`data/reponses.json`) le remplacent. Voir `80-decision-sans-chrono.md`.

(question à la place de la consigne), `guide.js`, `i18n.js` (clés `alerte.*`, aide, tutoriel). `game.js` est
**inchangé** : règles, effets, dés et Q1–Q61 identiques.

## Quels incidents
Un dossier est une **alerte** si (champs réels du dossier) :
- `type === 'alerte météo'` ;
- le texte de la source (ou la nature) contient accident / malaise / blessé / chute (même règle que la
  pertinence des équipes, prompt 68) ;
- `type === 'événement'` (affluence de l'agenda Open Data).

Les autres dossiers gardent les actions 1 / 2 / 3 / 0 seules.

## Réponses proposées (2 ou 3, plus les actions de base)
| Situation réelle | Réponse | Correspond à |
|---|---|---|
| Alerte météo, rafales ≥ 50 km/h (valeur de la source ou `rafales_max` du jour) | Envoyer les pompiers sur les secteurs exposés (rafales {rafales} km/h) | équipe `pompiers` |
| Alerte météo, pluie ≥ 5 mm (`pluie_mm` du jour) | Dévier les lignes exposées (pluie {pluie} mm) | action 1 Dévier |
| Alerte météo | Retenir les rames en terminus le temps de l'alerte | action 2 Retenir |
| Alerte météo | Prévenir les usagers, ne rien changer au plan de transport | action 0 Ne rien faire |
| Accident / malaise dans la source | Envoyer les ambulanciers · Envoyer la police sécuriser les lieux | équipes `ambulance`, `police` |
| Accident / malaise | Dévier la ligne {ligne} le temps des secours · Retenir les rames… | actions 1, 2 |
| Événement (nom réel) | Envoyer la police gérer l'affluence autour de {événement} | équipe `police` |
| Affluence | Renforcer par des bus · Laisser le réseau absorber l'affluence | actions 3, 0 |

- Les seuils (5 mm, 50 km/h) sont ceux du contexte météo des règles (`contexte()` de `game.js`).
- Une valeur absente ne crée aucun choix ; les trous `{rafales}`, `{pluie}`, `{evenement}`, `{ligne}` sont
  remplis avec les vraies valeurs, jamais traduites (nom d'événement abrégé à 34 caractères à l'affichage).
- Chaque réponse correspond à **exactement une** action ou un envoi d'équipe ; au plus 2 équipes, au moins une
  action (la réponse décide du dossier). Équipes verrouillées (mode histoire, semaine 1) → pas de réponse
  « équipe ».
- Ordre **mélangé** à chaque alerte par la graine de la partie et le n° du dossier (FNV-1a), sans consommer
  `Jeu.alea` : les dés restent identiques, la partie reste reproductible.
- Aucun indice de correction (prompts 50 / 66).

## Affichage et interaction
- Panneau du dossier, phase décision : la consigne devient la **question** (« Alerte météo : quelle
  réponse ? »), les réponses s'affichent en boutons-choix en toutes lettres (deux lignes au plus, touche à
  gauche), puis les **actions de base** 1 / 2 / 3 / 0 en grille 2 × 2.
- Clavier : ↑ / ↓ ou Tab parcourent les réponses (cadre orange), Entrée valide ; 1 / 2 / 3 / 0 et
  Maj + 1 à 4 restent actifs. Souris / tactile : clic (portrait mobile : cibles ≥ 44 px après mise à l'échelle).
- Une équipe envoyée affiche « — envoyée » et se désactive ; refus faute d'effectif : message existant
  (prompt 68) au-dessus des réponses.
- `aria-live` : la question et toutes les réponses à l'entrée en décision, puis chaque réponse au focus.
- Après le choix : narration, effets, évaluation inchangés.

## Hors écran de jeu
- Aide (H) et tutoriel / livre « Aide » (étape 3) : les alertes proposent des réponses adaptées, chacune
  action ou envoi d'équipe — sans dire laquelle est bonne.
- Guide « Prendre en main » : l'étape « actions » pointe les réponses de la première alerte reçue.

## Vérifications
- `npm test` : pour chaque dossier des 3 semaines archivées, réponses 2–3, une cible unique existante, libellés
  FR + EN, trous remplis par des valeurs réelles, mélange reproductible et dépendant de la graine, dés non
  consommés ; rafales réelles 50,4 km/h → pompiers ; événement réel → police avec son nom ; pluie réelle 7,4 mm
  → dévier ; malaise (fixture de test : aucun accident dans les archives) → ambulanciers, police, dévier ;
  équipes verrouillées → aucune réponse « équipe » ; manifestation → actions seules ; `game.js` sans `Alertes`.
- Chromium 1920 × 1080, FR et EN : affluence (semaines 1 et 2), alerte météo, envoi de police au clavier,
  aucune erreur console.
