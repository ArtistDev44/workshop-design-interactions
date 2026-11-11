# Prompt 93 — Jeu « Nantes en régulation » : détecter et réparer les textes qui sortent de leur cadre, sans rien casser

Demande d'origine (11/11/2026) :

> Un nouveau prompt sur les détails concernant les textes : certains textes sont en dehors de leurs cases.
> J'aimerais qu'ils soient détectés et réparés sans rien casser d'autre.

Objectif :
1. **Détecter automatiquement**, sur tous les écrans du jeu, chaque texte qui dépasse de son cadre : bouton,
   carte, panneau, fenêtre d'appli, écran du PC, bulle, tuile, téléphone, canvas.
2. Le **réparer** par la plus petite correction possible.
3. **Prouver par des mesures avant / après** qu'aucune autre partie du jeu n'a été modifiée.

C'est un travail de **finition**, pas de refonte : aucune mise en page, couleur, règle de jeu ni donnée ne
change, hormis ce qu'il faut pour que chaque texte tienne dans sa case.

Règles :
- **Ne rien casser.**
  - Corrections **locales**, une par défaut constaté.
  - Pas de changement de logique de jeu (`game.js` : effets, dés, jauges).
  - Pas de changement de contenu des données ni du sens des textes.
  - Le **raccourcissement d'un libellé** n'est permis que dans `i18n.js`, en gardant le sens, et en FR comme
    en EN.
- **Design system** respecté (`ds.js`, prompt 39) : pas de nouvelle police, pas de taille sous les minimums
  du prompt 92 (corps 22 px, métadonnées 18 px, en coordonnées 1920×1080), contraste ≥ 4,5:1.
- `npm run build` et `npm test` verts **après chaque lot** de corrections.
- FR + EN, clavier, `prefers-reduced-motion`, aucun flash, hors ligne, mobile.

## 0. Point de départ : lire le code existant avant toute modification

Fichiers à repérer dans `site/public/`, sans rien supposer :
- **les fonctions qui dessinent du texte** :
  - `text()` p5 (très utilisé dans `sketch.js`, `immersion.js`, `histoire.js`, `menu.js`, `carte.js`,
    `taches-ui.js`…) ;
  - `dsTexte()`, `dsTitre()`, `dsBouton()`, `dsBadge()` (`ds.js`) ;
  - `bouton()`, `panneau()`, `ajusterTaille()` (`sketch.js`) ;
- **les composants de texte du prompt 92**, s'il est exécuté : `couperLignes()`, `dessinerTexte()`,
  `hauteurTexte()`, `nettoyerTexteSource()` ;
- **les fenêtres et zones** : fenêtres d'appli (`os.js`), écran du PC (`ECRAN_POSTE`, `bureau.js`),
  téléphone (`telephone-main.js`), fenêtres plein écran (aide, paramètres, menu, fin, rapport,
  cinématiques), notifications (`multitache.js`), mobile (`mobile.js`, `portrait.js`) ;
- **le changement de langue** (`i18n.js`, `Langue.changer`) : les textes anglais sont souvent plus longs ou
  plus courts.

Lire aussi `site/scripts/test-jeu.mjs` et `site/scripts/smoke.mjs`, pour brancher les nouveaux contrôles au
même endroit.

## 1. Détecteur de débordements (outil de développement)

Créer `site/public/audit-textes.js`.
- Il est chargé **uniquement** si l'URL contient `?audit=textes`.
- **Aucun effet** sans ce paramètre : pas de coût de performance, rien d'affiché en jeu normal.
- `npm test` vérifie qu'il n'est pas actif par défaut.

### 1.1 Connaître les cadres

- Ajouter une **pile de zones** très légère : `zoneTexteDebut(nom, x, y, l, h)` et `zoneTexteFin()`.
- L'appeler dans les conteneurs existants, sans changer leur rendu :
  - `panneau()`, `dsPanneau()`, `bouton()`, `dsBouton()`, `dsBadge()` ;
  - fenêtres d'appli, cartes et tuiles (si les prompts 85, 86 et 89 sont exécutés) ;
  - bulles, téléphone, écran du PC, notifications.
- Hors audit, ces fonctions sont **vides** (coût nul).
- La zone de référence d'un texte est la **zone la plus intérieure** active. À défaut, c'est l'écran du PC
  (contenu au poste), puis le canvas.

### 1.2 Mesurer chaque texte

Le détecteur enveloppe `text()` (au niveau `p5.prototype`, comme le fait déjà `i18n.js`) et les fonctions
DS. Pour chaque appel, il calcule la **boîte réelle** du texte :
- largeur avec `textWidth` ;
- hauteur avec `textAscent + textDescent` et l'interligne ;
- alignement `textAlign` pris en compte, horizontal et vertical ;
- texte multi-ligne (`text(str, x, y, l, h)`) : coupure recalculée, et **hauteur nécessaire comparée à
  `h`** ;
- transformations en cours (`push`, `translate`, `scale`) prises en compte quand elles existent, sinon le
  défaut est signalé « non mesurable ».

Il **signale** un défaut quand la boîte sort de la zone de référence de plus de 1 px, ou quand un texte
multi-ligne est **coupé** par p5 (hauteur nécessaire > `h`) sans « … ».

### 1.3 Restituer

- En mode audit :
  - un **contour rouge** autour de chaque texte fautif ;
  - un **contour orange** autour de sa zone ;
  - un **panneau de rapport** repliable : liste des défauts, avec écran, fichier ou fonction appelante si
    possible, texte, dépassement en px, langue et taille d'écran ;
  - `window.AUDIT_TEXTES.rapport()` renvoie le rapport en JSON.
- **Dédupliquer** : un même texte au même endroit n'est compté qu'une fois par écran.
- Couleurs du mode audit choisies pour rester visibles, mode de **développement seulement**, sans flash :
  contours fixes.

## 2. Parcours automatique de tous les écrans

`?audit=textes&parcours=1` enchaîne automatiquement tous les écrans et états, sans jouer réellement. Il
s'appuie sur les fonctions existantes (`lancerPartie`, `ouvrir(...)`, `PC.fenetre`, phases), comme les tests
déjà faits à la main dans ce projet.

États à couvrir :
- **Accueil et menu** : chaque semaine sélectionnée, mode direct indisponible (hors ligne).
- **Paramètres, aide, réinitialisation, menu en partie, pause, crédits, partage.**
- **Introduction SMS, téléphone en main** (agenda, conversations), **notifications de bureau**.
- **Bureau** (infobulles des objets) et **PC** (démarrage, bureau des applis, barre des tâches, chaque
  appli) :
  - Signalements, avec un signalement de **chaque type**, la contradiction, le conflit et les sources
    révélées ;
  - Patron, Community, Journal, Indicateurs, Données, Corbeille ;
  - les applis ajoutées par les prompts 84 à 92, si elles sont exécutées.
- **Narration après décision, mail du soir, nuit et sortie** (prompt 69), **rapport de semaine, fin
  (bonne, moyenne, mauvaise), démission, licenciement** (prompt 84).
- **Cas extrêmes** :
  - plus longs textes réels des données (le plus long `texte_source`, nature, nom de ligne, événement
    d'agenda) ;
  - valeurs extrêmes (jauges 0 et 100, budget 0, retards à 3 chiffres) ;
  - noms de ligne multiples (« C1, C2, C3 »).

Chaque état est parcouru :
- dans **les deux langues** (FR, EN) ;
- à **1920×1080**, **1366×768** et **mobile portrait** (prompt 60) ;
- avec **Contraste renforcé** activé et désactivé.

Le rapport agrégé est téléchargeable (`audit-textes-AAAA-MM-JJ.json`), et un résumé s'affiche en console.

## 3. Rapport initial (avant toute correction)

- Lancer le parcours **avant de modifier quoi que ce soit**.
- Enregistrer le rapport dans `jeu/NN-audit-textes-avant.json` (numéro libre suivant dans `jeu/`).
- En faire une synthèse dans la doc : nombre de défauts par écran, langue et taille, et les **10 pires**.
- Classer chaque défaut :
  - **A** : libellé trop long pour son bouton ou sa pastille ;
  - **B** : texte multi-ligne coupé ;
  - **C** : texte sorti d'une carte ou d'un panneau ;
  - **D** : texte sorti de l'écran du PC ou du canvas ;
  - **E** : chevauchement de deux textes (si détectable : boîtes qui se recouvrent dans une même zone).

## 4. Réparer : la plus petite correction, dans cet ordre de préférence

Pour chaque défaut, appliquer **la première solution qui marche** de cette liste, sans passer à la suivante
si ce n'est pas nécessaire.

1. **Retour à la ligne correct** : remplacer une estimation (`textWidth × 1,05`, nombre de lignes deviné)
   ou un `text()` mono-ligne par le composant du prompt 92 (`couperLignes` / `dessinerTexte`), **dans la
   même zone**.
2. **Ellipse et « Lire tout »** : pour une citation ou une donnée réelle trop longue dans une zone fixe,
   tronquer en fin de mot avec « … » et donner un moyen de lire la suite (infobulle au survol et au focus,
   « Lire tout » ou volet).
3. **Ajustement de taille** : `ajusterTaille()` ou son équivalent DS, **sans descendre sous les tailles
   minimales**. Réservé aux libellés courts (boutons, badges, titres).
4. **Libellé plus court** dans `i18n.js` :
   - même sens, en FR et EN ;
   - le libellé long reste disponible en `aria-label` / annonce vocale et en infobulle.
5. **Agrandir la case**, seulement si cela **ne déplace rien d'autre** : vérifier par le parcours que les
   éléments voisins ne bougent pas, et que le défaut n'est pas recréé ailleurs.
6. **Réorganiser** (passer sur deux lignes, empiler) en dernier recours, uniquement sur l'élément concerné.
   Le noter explicitement dans la doc.

Interdits :
- toucher aux règles de jeu ;
- modifier une donnée réelle ou un texte cité (seul l'affichage s'adapte) ;
- baisser le contraste ;
- masquer un texte sans moyen de le lire ;
- corriger un défaut en en créant un autre.

Organisation du travail :
- Une correction par défaut (ou par groupe de défauts de même cause), **commit par lot** :
  1. boutons ;
  2. Signalements ;
  3. applis ;
  4. fenêtres plein écran ;
  5. téléphone et notifications ;
  6. mobile.
- Message de commit qui liste les défauts corrigés.

## 5. Ne rien casser : garde-fous

- **Parcours relancé après chaque lot.**
  - Le nombre de défauts doit **baisser**.
  - **Aucun nouveau défaut** ne doit apparaître (comparaison du rapport avec le précédent, par empreinte
    écran + texte + zone).
- **Tests de jeu** :
  - `npm test` (smoke + `test-jeu.mjs`) vert à chaque lot ;
  - ajouter à `test-jeu.mjs` un contrôle qui charge le module d'audit en mode « tête » (sans p5 si
    possible, sinon via les fonctions de mesure pures du prompt 92) sur une liste de cas réels de
    libellés longs.
- **Comparaison visuelle ciblée** : pour chaque écran corrigé, une capture avant et une capture après en
  1920×1080 FR. Vérifier à l'œil que **seul** l'élément corrigé a changé. Garder les captures en dehors du
  dépôt (scratchpad), ou dans `captures/` si le groupe le souhaite.
- **Partie réelle complète**, au clavier puis à la souris, en FR puis en EN, sur une semaine : rien ne
  change dans le déroulé, les jauges, les effets ni la sauvegarde.

## 6. Prévenir les régressions futures

- Documenter dans `CONTRIBUTING.md` (ou la doc du jeu) la **règle de texte** : tout texte passe par
  - le composant du prompt 92 (multi-ligne),
  - ou `ajusterTaille()` (libellé court),

  et dans une zone déclarée (`zoneTexteDebut` / `zoneTexteFin`). Aucun nouveau `text()` mono-ligne
  sans largeur dans une zone de taille fixe.
- Ajouter à `npm test` un contrôle léger : une recherche dans le code qui signale les estimations
  `textWidth(...) * 1.05` et les `text(...)` sans largeur dans les fichiers d'applis.
  - Liste d'exceptions motivées, commentées dans le script.
- Rappeler dans `prompts/README.md` que l'audit `?audit=textes&parcours=1` est à relancer avant chaque
  fusion qui touche à l'interface.

## 7. Vérifications détaillées

- `npm run build` et `npm test` dans `site/`, à chaque lot.
- Parcours d'audit : rapport **avant** et rapport **après**, enregistrés dans la doc.
  - Objectif : **0 défaut** de catégorie A à D, dans les deux langues et les trois tailles.
  - Les défauts restants (E, « non mesurable ») sont listés avec une justification.
- Sans `?audit=textes` :
  - le jeu se comporte exactement comme avant ;
  - aucune requête, aucun contour, aucun coût mesurable sur la fréquence d'images.
- Accessibilité :
  - contraste ≥ 4,5:1 inchangé ou meilleur ;
  - tailles minimales respectées ;
  - libellés raccourcis disponibles en entier pour les lecteurs d'écran ;
  - clavier, `prefers-reduced-motion`, aucun flash, hors ligne, mobile.
- Aucune régression des prompts précédents : rejouer une semaine complète.
- Documenter dans `jeu/NN-textes-hors-cadre.md` : outil, méthode, rapport avant / après, liste des
  corrections par lot, et règle de texte. Ajouter la ligne au sommaire de `jeu/README.md`.
- Branche `jeu/prompt-93-textes-hors-cadre`. À chaque push : entrée en tête de `journal.md`. Ne pas
  fusionner dans `main` sans demande.
