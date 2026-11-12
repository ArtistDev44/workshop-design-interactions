# Prompt 103 — Jeu « Nantes en régulation » : une seule appli sur le PC, les autres intégrées dans un menu à gauche, sans information répétée

Demande d'origine (12/11/2026) :

> Pour le côté global du PC, on souhaite retirer le reste des applications pour qu'elles soient intégrées à
> l'application principale. On aurait donc la messagerie du patron en menu à gauche, et les autres qui
> suivent. Simplifier au maximum les informations et éviter les informations redondantes.

Deuxième des trois prompts (102 → **103** → 104). Il s'appuie sur la carte du prompt 102 et sur la
correction 101 b (redondances et marges).

## Ce qui ne change pas

- Le contenu et la logique des applis restent ceux d'aujourd'hui : `appPatron`, `appCommunity`, `appJournal`,
  `Données` (prompt 61). Ils changent seulement **de place**.
- `game.js` ne change pas. Les déblocages progressifs du prompt 91 (`appliDebloquee`) sont gardés.
- **Raccourcis conservés :**
  - J (journal), B (publier), Échap (retour) ;
  - les notifications et les liens croisés du prompt 91 (`voirDossierDepuis`, `ouvrirAppPC`,
    `redirigerVers`) mènent toujours à la bonne vue.
- Accessibilité :
  - clavier complet ;
  - contraste ≥ 4,5:1 ;
  - `prefers-reduced-motion` ;
  - annonce `aria-live` à chaque changement de vue.
- Vérifications : `npm run build`, `npm test`, et l'audit des textes à 0 défaut A–D.

## 1. Le bureau RégulOS : une seule appli

- Le bureau n'affiche plus qu'**une icône** : l'appli principale, qui ouvre la carte. Ce sont les icônes de
  `ICONES_OS` qui disparaissent du bureau :
  - Patron, Community, Journal ;
  - Indicateurs : ses jauges sont déjà dans le bandeau ;
  - Corbeille : décorative.
- La barre des tâches suit la même règle : le logo, l'appli principale, l'heure. Les jauges n'y sont plus
  répétées si le bandeau de l'appli est visible.
- L'appli principale garde son nom, tiré des clés `app.*` existantes (« Signalements » / « Reports »), pour
  ne rien inventer.

## 2. Le menu à gauche de l'appli principale (colonne x 40 → 152 réservée au prompt 102)

**Contenu, de haut en bas**
1. **Logo du jeu** (`dessinerLogoPXE`) : revenir à la carte. C'est l'accueil.
2. **Messagerie du patron** : en premier, comme demandé.
3. **Community**.
4. **Journal de bord**.
5. **Données**.

**Chaque entrée**
- Un pictogramme pixel (réutiliser `iconePixel` de `os.js`).
- Un libellé court en dessous, 14 px, `blanc75`.
- Entrée active : fond `blanc15`, barre rouge de 4 px à gauche. C'est le seul rouge du menu.

**Badges**
- Seulement pour ce qui est **à faire**, selon la règle 6 du prompt 101 : plaintes qui attendent une
  réponse, message du patron non lu.
- Un nombre, jamais un point qui clignote.

**Entrée verrouillée** (prompt 91)
- Pictogramme estompé et cadenas.
- Au clic : la secousse et l'annonce existantes (`refuserAppliVerrouillee`).

**Clavier**
- Le menu est une zone de focus.
- ↑ ↓ choisissent une entrée, Entrée l'ouvre.
- Échap revient d'abord à la carte, puis sort du PC comme aujourd'hui.

## 3. Les applis deviennent des vues de l'appli principale

- Une vue intégrée prend la zone de contenu, de x 168 à 1880 et sous le bandeau. Ce n'est plus une fenêtre
  posée sur le bureau.
- **À retirer**, car ces éléments font doublon avec le menu et le bandeau :
  - le cadre de fenêtre (titre, croix, ombre) ;
  - le grand titre de l'appli : le menu indique déjà où l'on est. Un en-tête d'une ligne suffit, et
    seulement s'il apporte une information propre à la vue (filtre, onglet).
- **Changer de vue ne met pas le temps en pause** : c'est le comportement actuel des applis (prompt 22).
  Un signalement qui arrive pendant qu'on lit le Journal :
  - pose un badge sur le logo de la carte ;
  - garde la notification du prompt 77.
- **Une vue est conservée** quand on en change : onglet Community, filtre du Patron, jour du Journal
  (l'état actuel `COMMU`, `PATRON` et `JOURNAL` est gardé).
- **Liens croisés :**
  - « Voir le dossier » (Patron, Community, Journal) ouvre la carte sur le dossier ;
  - « Publier sur Community » (dossier) ouvre la vue Community ;
  - Échap revient à la vue d'origine (pile de navigation du prompt 91, `depilerNavigation`).
- **Souris et molette** : les vues intégrées sont dessinées dans la fenêtre de l'appli, qui est réduite et
  centrée (`FENETRE_APPLI`). Les fonctions de molette (`molletteJournal`, `mollettePatron`,
  `molletteCommunity`, `molletteEnquete`) doivent recevoir la souris convertie dans ces coordonnées.

## 4. Simplifier au maximum, sans redondance (passe sur l'ensemble)

Chaque information n'apparaît qu'à **un seul endroit visible à la fois**.

| Information | Seul endroit où elle reste |
|---|---|
| Valeurs des jauges | le bandeau (plus la barre des tâches, plus le résumé du Journal, plus l'appli Indicateurs) |
| Heure du jeu | le bandeau |
| Nom de la vue | le menu |
| Nombre de signalements | le badge du logo, ou la ligne d'état de la carte (pas les deux à la fois) |
| Effectifs des équipes | le plateau (prompt 102) |

Le message du patron sur les effectifs garde sa date ; il n'est plus ajouté si le plateau est visible.

- Pour chaque retrait, le rapport dit où l'information se trouve maintenant.
- **Mesurer** avec `?audit=densite&parcours=1` (prompt 101) avant et après, sur la carte et sur les quatre vues.
  Le compte des éléments n'est qu'un indice (correction 101 b) : vérifier aussi à l'œil qu'aucune
  information ne se répète.

## 5. Vérifications

- **Partie complète** en 1920 × 1080 et en mobile portrait (412 px) :
  - en portrait, le menu devient une barre d'onglets en bas ;
  - tout reste atteignable au pouce.
- **Clavier seul**, en passant par toutes les vues.
- **Liens croisés**, chacun testé dans les deux sens.
- `npm test` (mettre à jour les tests qui cherchent des icônes du bureau) et `npm run build` sont verts ;
  l'audit des textes reste à 0 défaut A–D.
- **Livrables :**
  - rapport `jeu/103-une-seule-appli.md` ;
  - `prompts/README.md` ;
  - une ligne en tête de `journal.md`.
