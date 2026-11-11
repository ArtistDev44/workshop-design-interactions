# Prompt 84 — Jeu « Nantes en régulation » : rappel à l'ordre du patron, puis licenciement et écran « game over »

Demande d'origine (11/11/2026) :

> Je souhaite créer un nouveau prompt concernant la logique du jeu : lorsque l'on arrive à un certain
> score sur les 3 valeurs qui n'est pas bon, du genre un seuil où on se fait rappeler à l'ordre par le
> patron par message, et ensuite on se fait virer avec un écran game over.

Objectif : ajouter une **sanction progressive** quand la gestion du joueur devient mauvaise.

1. Sous un premier seuil, le patron envoie un **rappel à l'ordre** par message.
2. Si la situation ne s'améliore pas, il envoie un **dernier avertissement**.
3. Ensuite, le joueur est **licencié** : la partie s'arrête sur un écran **« game over »**.

Le joueur doit toujours **voir venir** la sanction et avoir une **chance de se rattraper**. Le licenciement ne
tombe jamais sans au moins un avertissement lisible, sauf effondrement total (§ 2.3).

Exception aux décisions verrouillées, à documenter dans `jeu/04-jauges-et-fins.md` :
- Q47 prévoit **3 fins** (bonne, moyenne, mauvaise).
- La fin « démission » (prompt 47) en est déjà une exception.
- Ce prompt ajoute une autre **fin anticipée imposée : « licenciement »**.

Les trois fins de fin de semaine, leurs seuils (Q48) et les boutons (Q55) restent inchangés.

Règles :
- Rien n'est inventé : les messages et la lettre de licenciement ne citent que des chiffres et décisions
  réels de la partie.
- FR + EN via `t(...)` / `T(...)`.
- Pas de flash, `prefers-reduced-motion` respecté, clavier seul possible.

## 0. Point de départ : lire le code existant avant toute modification

Fichiers concernés :
- `site/public/` : `game.js`, `sketch.js`, `immersion.js`, `os.js` (appli Patron), `journee.js`, `i18n.js`,
  `confort.js` / son en service, sauvegarde (prompt 33) ;
- `site/scripts/test-jeu.mjs` ;
- une mise à jour de `jeu/`, `prompts/README.md` et `journal.md`.

Repérer, sans rien supposer (les numéros de ligne bougent) :
- **`game.js`** :
  - `REGLAGES` (dont `seuilCritique: 20`, Q46), `Jeu.jauges`, `Jeu.score()` (somme 0–300) ;
  - `Jeu.appliquerDeltas()`, `Jeu.verifierAlertesPatron()` (alerte « jauge < 20 », une fois par jauge et
    par jour), `Jeu.verifierConseilsPatron()` (jauge < 30) ;
  - `Jeu.messagePatron()`, la panne de messagerie (`panne_messagerie`, prompt 23) ;
  - `Jeu.demission` / `Jeu.peutDemissionner()` (prompt 47) ;
  - `Jeu.bilan()`, les malus (`Jeu.MALUS`), la fin de journée (`finDeJourneeTactique`) ;
  - le mail du dernier soir (prompt 56).
- **`sketch.js`** :
  - `dessinerFin()` ;
  - `fenetreDemission()` et le rapport tamponné « DÉMISSION » ;
  - le bandeau d'état des jauges.
- **`immersion.js`** : `allerFin()` (palmarès, sauvegarde effacée, défis), le mail du soir.
- **`os.js`** : appli Patron (bulles, badges, message mis en avant).
- Prompts **68** (la Carte devient l'appli principale) et **69** (fin de journée de nuit) : s'ils sont déjà
  exécutés, s'aligner sur leur mise en page et leur phase `soir`.

## 1. Mesure de la « mauvaise gestion »

La mesure est calculée à chaque changement de jauge, dans `Jeu.appliquerDeltas()`, à partir des **trois
jauges réelles**. Les valeurs vont dans `REGLAGES.licenciement`, sont documentées dans l'aide et testées :

| Niveau | Condition (l'une ou l'autre) | Nom affiché |
|---|---|---|
| **Vigilance** | score combiné < 120 **ou** deux jauges < 25 | « Sous surveillance » |
| **Danger** | score combiné < 90 **ou** deux jauges < 20 | « Dernier avertissement » |
| **Effondrement** | score combiné < 45 **ou** une jauge à 0 | licenciement immédiat (§ 2.3) |

Le score combiné est celui de Q44 (somme des trois jauges, 0–300). À titre de repère, la fin
« mauvaise » est sous 150 (Q48) : la vigilance arrive donc après une semaine déjà mal engagée.

**Hystérésis** : on ne sort d'un niveau que nettement au-dessus de son seuil (score ≥ 140 pour quitter la
vigilance, ≥ 110 pour quitter le danger). Ainsi, le niveau ne clignote pas d'une décision à l'autre.

## 2. Sanction progressive

### 2.1 Rappel à l'ordre (entrée en vigilance)

Le patron envoie un **message mis en avant** dans l'appli Patron : badge rouge, notification sonore,
annonce `aria-live`.

- Le message est construit sur les vraies valeurs. Exemple : « Rappel à l'ordre : fluidité 22,
  réputation 31, budget 48. Score de la salle 101 / 300. Redressez la situation avant ce soir. »
- Il cite la **jauge la plus basse** et la **dernière décision ratée** de la partie, si elle existe.
- Compteur `Jeu.avertissements` = 1.
- Bandeau d'état : pastille orange « Sous surveillance ».

### 2.2 Dernier avertissement (entrée en danger, ou vigilance toujours active à la fin de journée suivante)

Deux déclencheurs :
- immédiat, si le niveau **danger** est atteint ;
- sinon, en **fin de journée**, si le joueur est encore en vigilance alors qu'un rappel a déjà été envoyé
  un jour précédent.

Effets :
- Message du patron mis en avant, plus sec, avec les vraies valeurs : « Dernier avertissement. … Si
  demain soir la salle est toujours sous 90, vous êtes remercié. »
- Le **mail du soir** s'ouvre sur ce même avertissement, en tête et en rouge.
- Compteur `Jeu.avertissements` = 2.
- Bandeau : pastille rouge « Dernier avertissement ». Les jauges concernées gardent la pulsation douce
  sous 20 (prompt 53), sans flash.

### 2.3 Licenciement (game over)

Le joueur est licencié dans l'un de ces cas :
- **(a)** à la **fin de la journée qui suit** le dernier avertissement, si le score combiné est toujours
  < 90 ;
- **(b)** **immédiatement**, en cas d'effondrement (§ 1), même sans avertissement préalable, car la
  situation n'est plus tenable ;
- **(c)** si le niveau danger est atteint **à nouveau** alors que le dernier avertissement a déjà été
  donné et que le joueur en était sorti entre-temps.

Moment du déclenchement :
- Jamais au milieu d'une décision : on attend la fin de la narration du dossier en cours.
- En fin de journée : avant le mail du soir. Si la phase `soir` du prompt 69 existe, avant la nuit.

### 2.4 Se rattraper

- Sortir de la vigilance (hystérésis) **efface un avertissement**. Le patron envoie alors un message
  court et réel : « La salle remonte à 142, je lève la surveillance. »
- Le niveau ne descend jamais sous 0.
- **Démission** (prompt 47) : elle reste possible quand les trois jauges sont sous 20. Démissionner
  avant d'être licencié est un choix du joueur ; le licenciement est imposé. Les deux fins restent
  distinctes.

### 2.5 Panne de messagerie (prompt 23)

- Un rappel ou un avertissement émis pendant la panne est **mis en file d'attente**. Il est délivré à la
  fin de la panne.
- Le compteur `Jeu.avertissements` est mis à jour **tout de suite**, panne ou non.
- Le licenciement (a) ne compte que les jours où le dernier avertissement a été **effectivement reçu**.

## 3. Écran « game over » — licenciement

- Transition :
  - **fondu au noir** sur 0,8 s, sans flash ni fondu blanc ;
  - signal sonore grave et court ;
  - musique coupée en fondu.
- Composition (style du design system pixel, prompt 39), dans la pièce assombrie ou sur fond noir :
  - titre pixel **« LICENCIÉ »** / **« FIRED »**, et sous-titre « Game over » ;
  - une **lettre de licenciement** du patron (papier, tampon rouge « RÉSILIÉ ») qui cite uniquement des
    faits réels :
    - date et heure simulées du licenciement ;
    - valeurs finales des trois jauges et score combiné ;
    - nombre d'avertissements reçus et leurs dates ;
    - les 2 ou 3 pires décisions de la partie (incident réel, action, effet réel), reprises de
      `Jeu.bilan()` / `decisionsCles` ;
    - le malus le plus fréquent (prompt 23) ;
  - une ligne de **conseil** pour la prochaine partie, déduite de la jauge la plus basse. C'est un rappel
    de règle, pas une action à copier. Exemple : « Le budget est tombé à 0 : les équipes et les bus de
    renfort coûtent cher. »
- Boutons, au clavier (Entrée / Échap) et à la souris :
  - **Rejouer la même semaine** ;
  - **Changer de semaine** ;
  - **Revoir le journal de la partie** : ouvre le Journal ou l'enquête du prompt 63, en lecture seule.
- Effets sur la partie :
  - la sauvegarde de la partie est **effacée** ;
  - le licenciement **n'entre pas au palmarès** et ne valide pas les défis ni la progression de
    l'histoire (comme la démission) ;
  - un compteur « licenciements » peut être gardé pour les statistiques locales.
- `aria-live` : « Vous êtes licencié. Score 84 sur 300. Entrée : rejouer la semaine. »
- `prefers-reduced-motion` : pas de fondu animé ni d'animation du tampon.

## 4. Lisibilité et aide

- **Aide (H)** et **guide « Prendre en main »** (prompt 37) : un encart « Le patron vous surveille »
  explique les trois niveaux, avec leurs seuils, l'hystérésis et le délai d'un jour avant licenciement.
- **Indicateurs** (prompt 36) : une ligne « Statut auprès du patron » avec le niveau actuel et le nombre
  d'avertissements.
- Le **conseil contextuel** (prompt 23) prévient dès la vigilance. Exemple : « Encore 15 points de score
  et la salle sort de la surveillance. »
- Les textes du patron restent dans son ton habituel (prompts 22, 28) : ferme, sans insulte.

## 5. Sauvegarde et cas particuliers

- La sauvegarde (prompt 33) enregistre :
  - le niveau ;
  - `Jeu.avertissements` ;
  - les dates des avertissements ;
  - le jour où le dernier avertissement a été reçu.
- Mode « Aujourd'hui, en temps réel » : même logique. Si la partie n'a qu'un jour, le licenciement (a)
  est remplacé par la fin de service, et seul l'effondrement (b) licencie.
- **Dernier jour de la semaine** : si le délai d'un jour du licenciement (a) dépasse la semaine, la
  semaine se termine normalement. La fin est très probablement « mauvaise » (score < 150), et le mail
  du dernier soir (prompt 56) mentionne l'avertissement en cours.
- Les décisions Q1–Q61, l'effet des actions, les dés et la graine ne changent pas. Seule la sanction
  s'ajoute par-dessus les jauges.

## 6. Textes (FR + EN, exemples de clés)

| Clé | Français | English |
|---|---|---|
| `patron.rappel` | Rappel à l'ordre : {liste}. Score de la salle {score} / 300. Redressez la situation avant ce soir. | Formal warning: {liste}. Control room score {score} / 300. Turn things around before tonight. |
| `patron.dernier` | Dernier avertissement : {liste}, score {score} / 300. Si demain soir la salle est toujours sous {seuil}, vous êtes remercié. | Final warning: {liste}, score {score} / 300. If the room is still below {seuil} tomorrow evening, you're out. |
| `patron.leve` | La salle remonte à {score}, je lève la surveillance. | The room is back up to {score}, I'm lifting the warning. |
| `statut.surveillance` | Sous surveillance | Under watch |
| `statut.dernier` | Dernier avertissement | Final warning |
| `gameover.titre` | LICENCIÉ | FIRED |
| `gameover.sous` | Game over | Game over |
| `gameover.tampon` | RÉSILIÉ | TERMINATED |

## 7. Vérifications détaillées

- `npm run build` et `npm test` dans `site/`.
- `site/scripts/test-jeu.mjs` couvre :
  - les seuils et l'hystérésis : pas de va-et-vient d'une décision à l'autre ;
  - le rappel envoyé une seule fois en entrant en vigilance ;
  - le dernier avertissement : immédiat en danger, ou à la fin de journée suivante ;
  - le licenciement le lendemain si le score est toujours < 90 ;
  - le licenciement immédiat en cas d'effondrement ;
  - le rattrapage, qui efface un avertissement ;
  - la file d'attente pendant la panne de messagerie ;
  - la sauvegarde et le chargement ;
  - aucune entrée au palmarès, sauvegarde effacée.
- Partie réelle, en français puis en anglais, au clavier puis à la souris :
  - jouer mal volontairement → rappel (badge, son, `aria-live`) → dernier avertissement dans le mail du
    soir → licenciement le lendemain soir → écran game over (lettre avec les vraies valeurs) → Rejouer ;
  - autre essai : se rattraper après le rappel → surveillance levée ;
  - mobile : boutons ≥ 44 px.
- Accessibilité :
  - contraste ≥ 4,5:1 ;
  - aucun flash ni fondu blanc ;
  - `prefers-reduced-motion` ;
  - hors ligne (fallback) ;
  - 1920×1080.
- Aucune régression des prompts précédents : rejouer une semaine complète **bien gérée** et vérifier
  qu'aucun avertissement n'apparaît.
- Documenter :
  - dans `jeu/NN-rappel-licenciement-game-over.md` (numéro libre suivant dans `jeu/`), avec la ligne au
    sommaire de `jeu/README.md` ;
  - l'exception à Q47 dans `jeu/04-jauges-et-fins.md`.
- Branche `jeu/prompt-84-licenciement`. À chaque push : entrée en tête de `journal.md`. Ne pas fusionner
  dans `main` sans demande.
