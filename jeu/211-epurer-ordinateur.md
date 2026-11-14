# 211 — Épurer l'interface sur ordinateur : rapport (14/11/2026)

Prompt : `prompts/211-jeu-epurer-ordinateur.md`. Revue d'origine : `ux-informations-2026-11-14.md`.

## Ce qui a changé

| Écran | Avant | Après | Fichier |
|---|---|---|---|
| Équipes | pictogramme + nom, base tronquée, cases, « 3/3 libres · coût 10 », consigne permanente | nom et « coût 10 » sur une ligne, puis les cases ; consigne jusqu'au premier envoi | `carte-alertes.js` |
| Carte | « Zoom ×1,0 » | retiré | `carte-alertes.js` |
| Bandeau | 3 traits par jauge (20, 40, objectif) | le repère d'objectif seul | `panneau.js` |
| Fiche dossier | « DOSSIER 1 / 16 · ÉVÉNEMENT » | « DOSSIER 1 / 5 DU JOUR » | `sketch.js`, `i18n.js` |
| Fiche dossier | phrase de la source coupée sur une ligne (« Les Cabanes d… ») | deux lignes, « Le jeu suppose de l'affluence » lisible | `panneau.js` |
| Répliques | « Fluidité ≈ Réputation ▲ Budget ▼ » sous chaque réplique | en-tête de colonnes unique, symboles seuls dessous | `panneau.js` |
| Poste | « Somnolence 0 % · Z : repos » toujours affiché | masqué sous 30 % (survol, guide et Z restent actifs) | `sieste.js` |
| Poste | « Quitter le PC » rouge primaire | contour sur fond sombre | `bureau.js` |
| Bureau | « Incident en cours… » immédiat | après 10 s sans geste (pastille de l'écran d'abord) | `bureau.js` |
| Mails | « ● en ligne », compteurs à 0 | statut écrit en panne seulement ; zéros masqués | `patron.js` |
| Community | titre « Comptes cités » sur une liste vide | titre seulement avec au moins un compte | `community.js` |
| Données | « Ouvrir l'API ↗ › » | « Ouvrir l'API ↗ » | `donnees.js` |

Clés de traduction : `equipes.cout` ajoutée ; `equipes.etat`, `carte.niveauZoom` et `patron.statut.enLigne`
retirées (FR + EN) ; `dossier.entete` réécrite. Le test du prompt 182 (`test-jeu.mjs`) accepte maintenant le style
secondaire du bouton : le bouton reste désactivé tant qu'un choix attend.

Captures avant / après en 1920 × 1080 : `jeu/211-captures/` (le poste, puis la fiche dossier).

## Correction de la revue

La revue du 14/11 disait que le tampon « SIGNALEMENT » restait sur le titre. C'est faux : il s'efface après 2,1 s
depuis le prompt 204. La capture avait été prise pendant l'animation. Rien n'a été modifié pour le tampon.

## Vérification

- `npm run build` : 2 pages. `npm test` : smoke 654 contrôles, test du jeu 6 934 contrôles, tous réussis.
- Audit des textes `?audit=textes&parcours=1` (FR + EN) : **0 défaut** en 1920 × 1080 et en 1366 × 768. En
  412 × 915 : 862 défauts « T », contre 867 sur `main` au même moment. Tous sont hors du poste : c'est le
  périmètre du prompt 209.

## Laissé au groupe

L'heure numérique sous l'horloge murale ; le bandeau réduit à ✓ / ✗ ; l'alignement des compteurs « actifs 1/3 »
(carte) et « 0/1 » (Journal) sur le compteur du jour ; les filtres du Journal masqués à zéro (liés à la navigation
au clavier, prompt 186). Ressenti des joueurs : [À COMPLÉTER].
