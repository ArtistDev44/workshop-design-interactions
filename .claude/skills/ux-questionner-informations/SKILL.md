---
name: ux-questionner-informations
description: Questionner chaque information affichée par le jeu « Nantes en régulation » (texte, chiffre, badge, icône, couleur, infobulle, annonce lecteur d'écran) — à quoi elle sert, pour qui, à quel moment, d'où elle vient — et rendre un verdict argumenté (garder, reformuler, déplacer, différer, fusionner, supprimer). À utiliser pour une revue UX de l'architecture d'information d'un écran ou du jeu entier, avant d'ajouter ou de retirer un élément d'interface, ou quand on demande « est-ce que cette info est utile ? », « l'écran est trop chargé », « le joueur ne comprend pas ».
---

# Questionner chaque information du jeu

Une information à l'écran coûte de l'attention. Elle doit **servir une décision**, **dire une vérité sur la
source**, ou **porter l'œuvre** (sens, ton). Sinon elle se retire, se diffère ou se fusionne.

## Contexte à garder en tête (PATRIMOINE.EXE · NTE001)

- Chaîne du brief : **source → grammaire → système → œuvre**. Le jeu rejoue des données réelles de transport
  nantais (Open Data Nantes Métropole) ; une information qui n'est pas tirée de la source doit le dire
  (« Fictif », hypothèse du jeu) — jamais de donnée inventée présentée comme réelle.
- Trois publics : le **visiteur d'exposition** (2 à 5 min, debout, aucune lecture préalable, mode `?expo=1`),
  le **joueur** qui fait une semaine complète, le **jury** qui vérifie la chaîne source → œuvre.
- Contraintes : contraste ≥ 4,5:1, clavier, `prefers-reduced-motion`, pas de flash, FR/EN via `t()`
  (`site/public/i18n.js`), portrait téléphone (`portrait.js`).
- Décisions verrouillées : `jeu/00-concept.md` … `jeu/13-*.md` ; historique des choix : `jeu/*.md`,
  `prompts/README.md`. Une information peut avoir été ajoutée ou retirée exprès : chercher le prompt d'origine
  (commentaires `// prompt NN` dans le code) avant de la contester, et citer ce prompt.

## Méthode

### 1. Inventorier (par écran, dans l'ordre du parcours)
Pour chaque information, une ligne : écran · élément · contenu exact (clé i18n) · forme (texte, nombre, couleur,
icône, son, annonce) · moment d'apparition et durée · source (`fichier.js:ligne`) · origine (donnée réelle API,
donnée calculée par le jeu, fiction assumée, texte d'interface) · prompt d'origine.

Une même information répétée à plusieurs endroits = une ligne par endroit (la redondance est un constat).

Si possible, regarder l'écran réel (build servi localement + Chromium sans interface, ou outils
`?audit=textes&parcours=1`, `?audit=densite`) plutôt que de déduire du code seul.

### 2. Questionner (les 8 questions)
1. **Décision** — quelle décision du joueur cette information éclaire-t-elle ? Aucune → pourquoi est-elle là ?
2. **Public** — pour qui : visiteur, joueur, jury ? Le visiteur de 3 min en a-t-il besoin maintenant ?
3. **Moment** — arrive-t-elle quand on en a besoin (ni trop tôt, ni après la décision, ni disparue avant
   d'être lue) ?
4. **Vérité** — vient-elle de la source réelle, d'un calcul du jeu, ou de la fiction ? Est-ce lisible pour le
   joueur ? Contredit-elle la grammaire (`grammar.md`) ou le cartel ?
5. **Redondance** — est-elle déjà dite ailleurs (autre panneau, couleur + texte + son) ? La redondance
   est-elle voulue (accessibilité : jamais la couleur seule) ou du bruit ?
6. **Hiérarchie** — son poids visuel (taille, couleur, position, rouge primaire) correspond-il à son importance ?
7. **Forme** — le bon format : chiffre ou mot, tendance (▲▼) ou valeur, icône ou libellé ? Compréhensible
   sans légende ? En anglais aussi ?
8. **Absence** — que perd-on si on la retire ? Et inversement : quelle information **manque** pour décider ?

### 3. Trancher
Verdict par information, un seul mot, puis une phrase de raison :
**Garder** · **Reformuler** · **Déplacer** · **Différer** (montrer plus tard / à la demande) · **Fusionner** ·
**Alléger** (moins de poids visuel) · **Supprimer** · **Ajouter** (information manquante) · **À trancher**
(choix de design qui revient au groupe : poser l'alternative, ne pas décider à sa place).

Priorité : **P1** gêne la décision ou trompe sur la source · **P2** coûte de l'attention sans rien rendre ·
**P3** finition.

### 4. Rendre
Un fichier Markdown daté à la racine (`ux-informations-AAAA-MM-JJ.md`) :
- synthèse (5 à 10 constats transverses, les P1 d'abord) ;
- une section par écran : tableau `Information | Où | Origine | Sert à | Questions soulevées | Verdict | P` ;
- informations manquantes ;
- questions ouvertes pour le groupe (les « À trancher ») ;
- ne rien modifier dans le code : la revue propose, les prompts `prompts/NN-*.md` exécutent ensuite.

## Pièges
- Ne pas juger un texte sans lire sa traduction anglaise et sa longueur réelle à l'écran.
- Ne pas confondre une information **cachée volontairement** (tension, « Pression visible » désactivée,
  répliques clash indiscernables du prompt 117) avec un oubli : citer l'intention et la questionner.
- Ne pas proposer de nouvelle donnée sans source : inconnu → « [À COMPLÉTER] ».
- Une recommandation par information, pas une refonte générale.
