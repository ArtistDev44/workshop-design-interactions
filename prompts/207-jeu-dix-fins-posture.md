# Prompt 207 — Jeu : dix fins de semaine selon la posture du joueur

Origine : discussion du 13/11/2026 avec Guillaume. Le joueur doit sentir que **ses gestes** (pas seulement la somme
des jauges) décident de la fin. Retenues par lui : la capture virale, le fauteuil du patron (= la bonne fin), les
usagers d'abord ; complétées par la sélection ci-dessous. Statut : **à exécuter**.

## Constat

- Aujourd'hui : 3 fins (bonne / moyenne / mauvaise) sur le **seul score** (`Jeu.typeFin`, `site/public/game.js`),
  plus 2 fins anticipées (démission, prompt 47 ; licenciement, prompt 84) et 3 cinématiques en mode histoire (prompt 37).
- Le jeu enregistre déjà des gestes qui ne pèsent jamais sur la fin : réponse par dossier (`Jeu.historique`),
  évaluation de chaque décision (`evaluationDe`, rangs bon / moyen / mauvais), clash, réponse Community jugée bonne,
  « Signaler » (`Jeu.repondrePlainte`), mauvaise source (`mauvaiseSource`), objectifs du jour
  (`Jeu.objectifsResultats`), non traités (`Jeu.malus.non_traite`).
- Une semaine passée à clasher tout le monde et une semaine de communication exemplaire peuvent finir pareil.

## Décision (exception à Q47–Q55, à consigner dans `jeu/04-jauges-et-fins.md`)

**10 fins de semaine + 2 fins anticipées inchangées.** Évaluées **dans l'ordre** ; la première condition vraie gagne.
Seuils de départ ci-dessous, **à régler par la simulation de l'étape 5** (noter les valeurs finales dans le rapport).

| Ordre | Clé | Fin | Condition (départ) | Ce qu'elle raconte |
|---|---|---|---|---|
| — | `licenciement` | Licenciement | inchangé (prompt 84) | — |
| — | `demission` | Démission | inchangé (prompt 47) | — |
| 1 | `virale` | La capture virale | clashs ≥ 3 | Ta réplique tourne sur les réseaux ; mutation aux archives, **même avec un bon score** |
| 2 | `burnout` | Le burn-out | cafés ≥ 2 × jours joués, aucune sieste, aucun départ anticipé, renforts ≥ 40 % des décisions | Bon travail, mais Camille t'impose une semaine de repos ; bureau vide au dernier plan |
| 3 | `imposteur` | L'imposteur | score ≥ 200 et décisions « bon choix » ≤ 40 % | Promu par erreur ; seule Camille sait, et te le fait comprendre |
| 4 | `fauteuil` | Le fauteuil du patron — **bonne fin** | score ≥ 240 | Promotion. (Score ≥ 240 implique budget ≥ 40 : pas de condition budget à ajouter) |
| 5 | `diplomate` | Le diplomate de Quai | 0 clash, ≥ 5 réponses Community, ≥ 80 % jugées bonnes (« Signaler » compte bonne), score ≥ 150 | On te confie la parole publique du réseau |
| 6 | `insoumis` | L'insoumis | objectifs du jour ratés ≥ moitié des jours joués, score ≥ 180 | Tu avais raison contre la consigne ; c'est le patron qui demande sa mutation |
| 7 | `usagers` | Les usagers d'abord | budget ≤ 25 et fluidité + réputation ≥ 130 | Les usagers t'adorent, la direction épluche les factures |
| 8 | `boucEmissaire` | Le bouc émissaire | score < 150 et décisions « bon choix » ≥ 60 % | On te reproche la météo de la semaine ; le rapport cite la vraie pluie / les vraies rafales |
| 9 | `correcte` | Semaine correcte | score ≥ 150 (ancienne « moyenne ») | Texte actuel de `fin.moyenne` |
| 10 | `reprimande` | Réprimande | sinon (ancienne « mauvaise ») | Texte actuel de `fin.mauvaise` |

Le **décor** (Q53) suit toujours le score en 3 paliers (clair ≥ 240, neutre ≥ 150, sombre) ; la **fin** donne le titre,
le texte et la lettre. `Jeu.typeFin()` garde son rôle de palier (compatibilité : palmarès, tampon, tests) ; nouvelle
fonction pure `Jeu.finDeSemaine(signaux)` → clé de la table.

## Étapes

1. **Signaux** — `Jeu.signauxPosture()` (game.js), pure, recalculable depuis l'état sauvegardé : clashs, réponses
   Community (total, bonnes, signalées), part des décisions par évaluation, part par action, objectifs ratés, non
   traités, mauvaises sources, jours joués. **À ajouter** (absents aujourd'hui) et sauvegardés : `cafes`, `siestes`,
   `departsAnticipes` (incrémentés là où ces gestes ont lieu : `cafe.js`, `sieste.js`, départ du prompt 51).
2. **Table des fins** — `Jeu.finDeSemaine()` + constante `Jeu.SEUILS_POSTURE` ; `Jeu.bilan()` renvoie `fin` (clé),
   `titre`, `texte` et `pese` : 2 ou 3 faits **réels** de la partie qui ont fait basculer (« 4 clashs », « 2 objectifs
   du jour ratés sur 5 », « budget 18 »). Textes FR + EN dans `i18n.js` (`fin.<clé>.titre`, `fin.<clé>.texte`,
   `fin.pese.*`), ton du patron selon `Jeu.tonPatron()` quand c'est lui qui parle. Aucun chiffre inventé : seules les
   valeurs de `signauxPosture()` et du bilan.
3. **Annoncer pendant la partie** (les conséquences se sentent avant l'écran final) — un seul message par seuil et par
   semaine, jamais pendant une décision :
   - 2ᵉ clash → mail du patron « On en parle déjà sur Quai » (vers `virale`) ;
   - budget ≤ 30 → Camille : « Les usagers sont contents. La compta, moins » (vers `usagers`) ;
   - 2ᵉ soir à ≥ 2 cafés sans sieste → Camille s'inquiète (vers `burnout`) ;
   - 2ᵉ objectif du jour raté avec score ≥ 180 → le patron, piqué (vers `insoumis`) ;
   - soir où ≥ 60 % de bons choix et score < 150 → Camille : « Tu fais ce qu'il faut. C'est la semaine qui est dure »
     (vers `boucEmissaire`).
4. **Écran de fin / rapport papier** — titre et texte de la fin, bloc « Ce qui a pesé » (`pese`), décor par palier.
   **Galerie des fins** : liste des 10 fins découvertes / à découvrir (titre caché « ??? » + indice d'une ligne),
   stockée dans la sauvegarde (`sauvegarde.js`, clé versionnée, try/catch), visible depuis le menu et l'écran de fin ;
   accessible au clavier, annoncée au lecteur d'écran. Le licenciement efface la partie mais **pas** la galerie.
5. **Mode histoire** — posture **cumulée** sur les 3 semaines pour la fin finale ; chaque rapport hebdomadaire montre la
   fin de la semaine. Cinématique : plan 1 (ciel) selon le palier, plan 2 (lettre de la direction) selon la fin — texte
   propre à chaque clé, pas de nouvelle animation lourde ; plan 3 inchangé.
6. **Simulation d'équilibrage** — dans `test-jeu.mjs`, bloc « Prompt 207 » : profils de joueurs scriptés (clasheur,
   accro au café, renforts partout, attentiste, appliqué, désobéissant, communicant) joués sur les semaines archivées
   du fallback ; vérifier que **chaque fin est atteinte par au moins un profil**, qu'aucune ne dépasse ~40 % des
   parties d'un profil neutre aléatoire, et que l'ordre de priorité est respecté (test unitaire par ligne de la table).
   Ajuster `SEUILS_POSTURE` jusqu'à ce que ce soit vert.

## Contraintes

- Démission et licenciement inchangés ; palmarès séparé du Défi chrono inchangé.
- Pas de nouvelle donnée inventée : les fins sont de la fiction de personnages (patron, Camille) ; tout chiffre cité vient
  du bilan réel. Inconnu → `"[À COMPLÉTER]"`.
- Accessibilité : contraste ≥ 4,5:1, clavier, `prefers-reduced-motion`, pas de flash ; la galerie se lit sans souris.
- Sauvegardes anciennes : signaux absents = 0, pas d'erreur.
- `npm run build` puis `npm test` avant le push ; `jeu/207-dix-fins-posture.md` (table finale des seuils, répartition
  mesurée par profil), `jeu/04-jauges-et-fins.md` (exception), `journal.md`, `prompts/README.md`.

## Hors périmètre

- Nouvelles cinématiques dessinées (une par fin) ; nouvelles mécaniques de jeu ; effets de jauge nouveaux pour les
  messages d'annonce (ils n'ont **aucun delta**, comme le trait du patron au prompt 189).
- Pistes écartées en discussion, gardées en réserve : le fantôme, le comptable, le lecteur de données, le binôme, la
  grève, la sieste filmée, le dernier tram.
