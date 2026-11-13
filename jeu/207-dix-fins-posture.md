# Prompt 207 — Dix fins de semaine selon la posture du joueur

Date : 13/11/2026. Branche `207-jeu-dix-fins-posture`. Prompt : `prompts/207-jeu-dix-fins-posture.md`.
Exception à Q47–Q55 consignée dans `jeu/04-jauges-et-fins.md`.

## Ce qui a changé

| Étape | Réalisation | Fichiers |
|---|---|---|
| 1 · Signaux | `Jeu.signauxPosture()` (pure, recalculée depuis l'état) : clashs (décisions + Quai), réponses Quai (total, bonnes, signalées), part des « bon choix » (toutes décisions / décisions prises), renforts, non traités, mauvaises sources, objectifs ratés, jours joués, météo réelle des jours joués. Compteurs nouveaux, sauvegardés dans l'instantané : `cafes` (+ jours avec café), `siestes` (volontaires seulement), `departs` (départ avant la fin). Ancienne sauvegarde → compteurs à 0. | `posture.js`, `cafe.js`, `sieste.js` |
| 2 · Table des fins | `Jeu.finDeSemaine(signaux)`, `Jeu.SEUILS_POSTURE`, `Jeu.FINS_SEMAINE` ; `Jeu.bilan()` renvoie `fin`, `titre`, `texte`, `ton`, `numeroFin` et `pese` (1 à 3 faits réels). `Jeu.typeFin()` reste le palier de score (décor, son, palmarès). | `posture.js`, `i18n.js` |
| 3 · Annonces | Mail du patron au 2ᵉ clash (vers « capture virale ») et au 1ᵉʳ objectif raté avec score ≥ 160 (vers « insoumis ») ; SMS de Camille le soir (burn-out, usagers d'abord, bouc émissaire), avant celui de la météo. Une fois par semaine et par fin, jamais pendant une décision, aucun delta de jauge. | `posture.js`, `soir.js` |
| 4 · Rapport et galerie | Rapport papier : titre et texte de la fin, tampon à sa couleur, ligne « Fin n sur 10 · d découvertes (nouvelle !) », bloc « Ce qui a pesé » ; tout est annoncé au lecteur d'écran à l'ouverture. Galerie des fins (fenêtre `fins`, bouton dans le Palmarès ou touche G ; Échap / Entrée pour revenir) : 10 cartes, titre caché « ??? » + indice d'une ligne tant qu'elle n'est pas obtenue, date, meilleur score et nombre de fois sinon. Stockée à part (`pxe-nte001:jeu:fins-decouvertes`, try/catch) : survit au licenciement et aux nouvelles parties. | `histoire.js`, `mecaniques.js`, `sketch.js`, `audit-textes.js` |
| 5 · Mode histoire | Signaux gardés par semaine dans la progression ; à la semaine 3, fin finale sur le cumul (`Jeu.cumulerSignaux` : comptes additionnés, parts recalculées, score moyen). Cinématique : ciel selon le palier de score, titre « Épilogue · <fin> » et lettre de la direction propres à la fin, tampon à sa couleur. | `histoire.js`, `i18n.js` |
| 6 · Équilibrage | Profils scriptés (`site/scripts/profils-posture.js`) joués avec les vraies fonctions du jeu sur les 3 semaines archivées ; bloc « Prompt 207 » de `test-jeu.mjs` : une ligne de test par fin + ordre, chaque fin atteinte, aucune fin > 45 % du joueur neutre, annonces une fois, sauvegarde / reprise / ancienne sauvegarde, cumul, galerie, textes FR + EN. `POSTURE_DETAIL=1 node scripts/test-jeu.mjs` affiche la répartition. | `test-jeu.mjs`, `profils-posture.js` |

## Table finale (ordre d'évaluation, la première condition vraie gagne)

| Ordre | Clé | Fin | Condition finale | Départ (prompt) |
|---|---|---|---|---|
| — | `licenciement`, `demission` | inchangées | prompts 84 et 47 | — |
| 1 | `virale` | La capture virale | clashs ≥ **4** | ≥ 3 |
| 2 | `burnout` | Le burn-out | ≥ 3 jours joués, un café **chaque** jour joué (cafe.js limite à 1 par jour), aucune sieste volontaire, aucun départ anticipé, renforts ≥ 40 % | cafés ≥ 2 × jours |
| 3 | `imposteur` | L'imposteur | ≥ 4 décisions, score ≥ **180**, « bon choix » ≤ 40 % | score ≥ 200 |
| 4 | `fauteuil` | Le fauteuil du patron (bonne fin) | score ≥ 240 (= `SEUILS_FIN.bonne`) | idem |
| 5 | `diplomate` | Le diplomate de Quai | 0 clash, ≥ 5 réponses Quai, ≥ 80 % bonnes (« Signaler » compte bonne), score ≥ 150 | idem |
| 6 | `insoumis` | L'insoumis | objectifs du jour ratés ≥ **2**, score ≥ **160** | ≥ moitié des jours, score ≥ 180 |
| 7 | `usagers` | Les usagers d'abord | budget ≤ 25 et fluidité + réputation ≥ 130 | idem |
| 8 | `boucEmissaire` | Le bouc émissaire | ≥ 4 décisions, score < **180**, « bon choix » ≥ **70 % des décisions prises** (non traités exclus) | score < 150, ≥ 60 % |
| 9 | `correcte` | Semaine correcte | score ≥ 150 (= `SEUILS_FIN.moyenne`) | idem |
| 10 | `reprimande` | Réprimande | sinon | idem |

Pourquoi ces écarts : 3 clashs étaient à portée d'un joueur au hasard (le clash est tentant depuis le prompt 196) ;
« 2 cafés par jour » est impossible (un café par jour au plus) ; à 200 l'imposteur n'était jamais atteint ; les
objectifs du jour sont bas, en rater la moitié n'arrivait qu'à des scores faibles ; sous 150, aucun joueur appliqué
n'avait 60 % de bons choix, les non traités pesant dans la part.

## Répartition mesurée (3 semaines archivées ; neutre : 30 graines par semaine, 90 parties)

| Profil | Fins obtenues |
|---|---|
| appliqué | fauteuil 3 |
| autre réplique | imposteur 1, licenciement 2 |
| clasheur | virale 3 |
| café + renforts | burn-out 3 |
| renforts | fauteuil 1, usagers 1, réprimande 1 |
| communicant | fauteuil 2, diplomate 1 |
| désobéissant | correcte 2, fauteuil 1 |
| débordé | bouc émissaire 2, licenciement 1 |
| neutre (90) | fauteuil 30 (33 %), correcte 21, virale 20, imposteur 17, insoumis 2 |

Les dix fins sont atteintes ; aucune ne dépasse 33 % des parties du joueur neutre (plafond du test : 45 %).

## Vérifications

- `npm run build` : vert. `npm test` : jeu 6 934 contrôles réussis ; smoke vert après `npm run auteurs`.
- Audit des textes `?audit=textes&parcours=1` en 1920 × 1080 (FR + EN, contraste normal et renforcé, fenêtre « fins »
  ajoutée au parcours) : **0 défaut**.
- Non vérifié : lecteur d'écran réel, ressenti joueur `[À COMPLÉTER]`.

## Limites

- « Insoumis » n'est atteint que par le joueur neutre (2 parties sur 90) : aucun profil scripté ne rate volontairement
  ses objectifs en gardant un bon score.
- Les textes des fins sont de la fiction de personnages (patron, Camille) ; les seuls chiffres cités (« Ce qui a
  pesé ») viennent de `Jeu.signauxPosture()` et de la météo archivée de la semaine.
- Pas de nouvelle cinématique dessinée (hors périmètre) : seule la lettre change selon la fin.
