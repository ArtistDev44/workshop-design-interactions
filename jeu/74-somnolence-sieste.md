# Prompt 78 — la somnolence remplace le sablier, la sieste devient centrale (malus « réponse trop tard »)

## La somnolence remplace le sablier

- **Sablier supprimé** sans code mort : `SABLIER`, `clicSablier`, `facteurSablier`, `dessinerSablier`
  (`journee.js`), objet du bureau, appels (`immersion.js`, `bureau.js`, `soir.js`) et clés i18n
  `sablier.*` / `objet.sablier*` (FR + EN).
- À la place : **jauge de somnolence 0–100** dans le bandeau d'état (`bandeauEtat`, `sketch.js`),
  cliquable, avec infobulle explicative (`somnolence.aide`). Valeurs verrouillées dans `SOMNOLENCE`
  (`immersion.js`) : montée avec le temps de jeu et l'inactivité.
- Objet « **se reposer** » sur le bureau (coussin + Z, `dessinerRepos`) → sieste volontaire
  (`seReposer` → `lancerSieste(false)`) : temps **×100** pendant la sieste (`facteurSieste`),
  paupières qui se ferment (animation du prompt 65 réutilisée).
- À **100 de somnolence** : sieste **forcée** (`lancerSieste(true)`) — on ne peut plus agir tant qu'on
  n'a pas « Se réveiller » (bouton sous les paupières ou barre espace).

## La sieste est centrale mais punitive

- Pendant la sieste, les **signalements continuent d'arriver et leurs compteurs tournent** ; ceux qui
  expirent sont réglés « non traité » (Q25, malus du prompt 23) — le malus vient du fait qu'on a
  **répondu trop tard** (`activerEtExpirer` dans `avancerTemps`).
- Au réveil : **bilan de la sieste** (signalements arrivés / expirés, chiffres réels) en message du
  patron + annonce `aria-live` (`bilanSieste`), en plus du malus fixe existant (`Jeu.malusSiette`).
- La sieste reste annulable/interrompable par le **geste webcam** (prompt 67) et par une **alerte**
  (réveil d'urgence existant).
- L'inactivité de 20 s ne déclenche plus la sieste « par surprise » : c'est la jauge qui décide.

## Comprendre le jour face à la sieste (FR + EN)

Tutoriel (`tuto.4.texte`), aide (`aide.texte`) : le rythme du jour (8 h → 20 h, prompt 76) et le
compromis sieste — plus on dort, plus on avance vite, plus on risque de rater des signalements.

Règles Q1–Q61 inchangées ; `game.js` inchangé (le malus « non traité » Q25 et `Jeu.malusSieste`
existent déjà, ils sont simplement appliqués aux signalements expirés pendant la sieste).
