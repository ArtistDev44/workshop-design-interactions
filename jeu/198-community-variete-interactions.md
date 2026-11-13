# Prompt 198 — Community : variété d'interactions, au plus 1/3 de provoquantes, volume ×4, tirage semé

Date : 13/11/2026. Branche `198-jeu-community-variete-interactions-proportion-provoquante`.
Demande d'origine : « une plus grande variété d'interactions pour l'application community management.
Ajuste la proportion de publications provoquantes : seulement 1/3 le sont. Rajoute 300 % d'interactions et
mets une fonction aléatoire pour éviter d'avoir toujours les mêmes interactions. »
Sur la base des prompts 63 (réactions reproductibles), 85 (compte Community), 117–118 (trio mélangé,
plaignants agressifs), 196–197 (clash, réaction du plaignant).

## Mesure de référence (§ 1)

Simulation complète des trois semaines (`test-jeu.mjs`, bloc 198), une partie jouée de bout en bout,
avec `Jeu.NB_INTERACTIONS_EN_PLUS = 0` (référence) puis `3` (prompt 198). Interactions d'usagers arrivées
par journée jouée :

| Semaine | Référence (par jour) | Prompt 198 (par jour) | Provoquantes | Catégories distinctes | Variantes différentes (semaine) |
|---|---|---|---|---|---|
| 14/09/2026 | 4 · 5 · 1 · 3 · 1 (14) | 16 · 20 · 4 · 12 · 4 (56) | 5 · 6 · 1 · 4 · 1 | 7 · 8 · 4 · 9 · 4 | 23 |
| 12/10/2026 | 5 · 2 · 4 · 2 · 1 (14) | 20 · 8 · 16 · 8 · 4 (56) | 6 · 2 · 5 · 2 · 1 | 9 · 5 · 7 · 6 · 4 | 25 |
| 02/11/2026 | 4 · 3 · 3 · 1 · 2 · 1 (14) | 16 · 12 · 12 · 4 · 8 · 4 (56) | 5 · 4 · 4 · 1 · 2 · 1 | 7 · 6 · 6 · 4 · 5 · 4 | 23 |

Volume : exactement **4 ×** la référence chaque jour (+300 %). Provoquantes : au plus 1/3 de chaque
journée, jamais deux de suite (le tiers est vérifié à chaque arrivée, pas seulement en fin de journée).

## Ce qui change

- **`data/messages.json`** (87 entrées, régénéré en `messages.js` par `npm run messages`) : 53 nouvelles
  interactions en 8 catégories (`categorie`) — question, remerciement, suggestion, témoignage, relance,
  doublon, accessibilité, photo —, FR + EN, 3 réponses (une `bonne`, une autre, un clash du prompt 197),
  `effets` sur les jauges existantes. Leurs conditions ne portent que sur des champs réels du dossier
  (type, ligne, retard) ; `condition.fil` (relance, doublon) exige qu'une plainte existe déjà sur ce dossier.
- **Champ `ton`** sur chaque entrée : `provoquant` | `neutre` | `positif`. Les plaintes `agressif` du
  prompt 118 deviennent `provoquant` (liseré d'alerte de la bulle conservé, `panneau.js`). Répartition :
  20 provoquantes, 57 neutres, 10 positives. Les provocations gardent leurs mots grossiers masqués hors
  alphabet.
- **Quota 1/3** (`Jeu.provocationPermise`, `Jeu.tonsDuJour`) : une provocation n'est retenue que si elle
  reste dans le tiers de la journée (elle comprise) et ne suit pas une autre provocation ; sinon la
  variante la plus proche du contexte parmi `neutre` / `positif`. S'applique à la plainte principale
  (`choisirSelonTon`) comme aux interactions en plus.
- **×4** (`Jeu.programmerInteractions`, `Jeu.majInteractions`) : chaque plainte déclenchée réserve 3
  interactions de plus sur le même dossier, à des heures tirées dans la journée ; elles arrivent au fil de
  l'horloge (`immersion.js`, bip « choix »), le lendemain matin si la journée est finie, et patientent si
  la file d'attente est pleine (la plainte principale garde sa limite `MAX_PLAINTES_EN_ATTENTE`).
- **Tirage varié semé** (`Jeu.hasard(graine)`) : mulberry32 semé par la graine de la partie + dossier +
  jour + rang ; aucun `Math.random()`, les dés de la partie (`Jeu.tirages`) ne sont pas consommés. Il
  choisit la catégorie (d'abord une absente du fil), la variante, le pseudonyme fictif (jamais deux fois
  le même dans un fil) et l'heure d'arrivée.
- **Anti-répétition** (`Jeu.tirerVarie`) : historique circulaire `Jeu.derniersTextes[catégorie]` (taille =
  pool − 1) ; pool épuisé → la plus ancienne revient ; jamais la même variante deux fois de suite.
- **Community** : les interactions s'ajoutent au fil du dossier réel avec les mêmes badges et le même
  trio de réponses (117, ordre mélangé 197), mêmes délais (79), mêmes effets. Aucun nouveau mécanisme.
- **Sauvegarde** : `interactionsPrevues` et `derniersTextes` sont dans l'instantané et restaurés.

## Hors périmètre respecté

Règles Q1–Q61, jauges, effets, trio mélangé, réactions reproductibles (63) et clash (−8, raté) inchangés.
Aucune donnée inventée : chaque interaction cite le fait réel du dossier ; pseudonymes fictifs.

## Vérification

- `test-jeu.mjs`, bloc 198 : tons et catégories valides, FR + EN complets, mots masqués, pas de
  `Math.random` ; sur les 3 semaines : volume = 4 × référence par jour, provocations ≤ 1/3 et jamais de
  suite, ≥ 4 catégories par jour, aucun texte à variable vide, aucune variante répétée de suite (≥ 20
  tirages), même graine → mêmes textes, autre graine → autre habillage, anglais identique, reprise de
  sauvegarde fidèle ; `Jeu.hasard` reproductible ; historique circulaire borné.
- Audit des textes `?audit=textes&parcours=1` (FR + EN) : voir `journal.md`.
- Ressenti joueur (le fil paraît-il vivant sans saturer ?) : [À COMPLÉTER] en salle.
