# Prompt 85 — Jeu « Nantes en régulation » : l'appli Community devient le compte social de la régulation nantaise (fil, photos pixel, messagerie, réponses)

Demande d'origine (11/11/2026) :

> Je souhaite un nouveau prompt concernant l'aspect visuel de l'appli Community Manager. Je souhaite que tu
> l'améliores de façon significative tout en respectant le design system, par exemple afficher le compte
> d'un réseau social des gestionnaires de la régulation nantaise, avec des photos toujours dans le style
> pixelisé à peine perceptible, pour juste donner l'impression d'un compte fourni, avec l'accès à la
> messagerie du compte, et même pouvoir répondre aux commentaires des posts présentant des problèmes de
> transport ou autre chose / problématique.

Objectif : refondre **visuellement et en profondeur** l'appli **Community** du PC. Elle devient l'interface
d'un **compte de réseau social fictif**, tenu par la salle de régulation nantaise, avec :
- un **profil** ;
- un **fil de publications illustrées** (photos en pixel art très fin) ;
- des **commentaires** auxquels le joueur répond ;
- une **messagerie privée**.

Le jeu ne change pas : les mécaniques existantes passent dans cette nouvelle interface. Ce sont les
plaintes du prompt 28, les réponses et leurs effets, les réactions en chaîne du prompt 63 et le délai
de réponse du prompt 79.

Règles absolues :
- **Design system** (`design-system/DESIGN.md`, Pixel Design System du prompt 39, `ds.js`) : couleurs DS,
  arrondi 0, unité 4 px, polices DS, composants `dsBouton` / `dsBadge` / `dsPanneau`.
- **Aucune imitation d'un vrai réseau social** : pas de logo, de nom, de couleurs ni de mise en page
  reconnaissables (Instagram, X, Facebook…). C'est un réseau **inventé pour le jeu**, nommé dans `i18n.js`
  (proposition : « Quai » / « Quai »).
- **Aucune identité réelle** : pas de logo ni de nom Naolib, TAN, Semitan ou Nantes Métropole. Le compte
  est fictif, par exemple « Régul' Nantes · salle de contrôle » (`@regul.nte`), et marqué comme fiction
  dans les crédits.
- **Rien n'est inventé côté données** :
  - les publications et les commentaires ne citent que les incidents, lignes, météo et événements réels
    de la partie (variables) ;
  - les pseudonymes d'usagers restent fictifs, comme aujourd'hui ;
  - les compteurs (abonnés, mentions « j'aime ») sont des **valeurs de jeu** dérivées de la réputation,
    documentées comme telles, jamais présentées comme réelles.
- **Aucun fichier image ajouté** : toutes les « photos » sont dessinées par le code (§ 3).
- FR + EN via `t(...)` / `T(...)`, contraste ≥ 4,5:1, clavier seul, `prefers-reduced-motion`, aucun flash.

## 0. Point de départ : lire le code existant avant toute modification

Fichiers concernés :
- `site/public/` : `os.js` (appli Community, fenêtres d'applis), `game.js` (plaintes, commentaires,
  réactions), `data/messages.json` + `data/messages.js` (et le script qui les génère), `ds.js`,
  `bureau.js` (fonctions de dessin du décor : Château des ducs, grue Titan, Loire, tram…), `i18n.js`,
  sauvegarde (prompt 33) ;
- `site/scripts/test-jeu.mjs` ;
- une mise à jour de `jeu/`, `prompts/README.md` et `journal.md`.

Repérer, sans rien supposer (les numéros de ligne bougent) :
- **`os.js`** :
  - `appCommunity()`, `blocPlainte()` ;
  - la fenêtre d'appli (`FENETRE_APP` ou équivalent) ;
  - les badges de non-lus (`Jeu.nonLus.community`) ;
  - la navigation clavier dans les applis (Tab / Entrée / Échap).
- **`game.js`** :
  - `Jeu.MESSAGES` (validation de `messages.json`), `Jeu.plaintes` ;
  - `Jeu.repondrePlainte()`, le délai de réponse (prompt 79), les réactions en chaîne (prompt 63) ;
  - `Jeu.commentaires`, `Jeu.commenter()` (prompt 22) ;
  - `Jeu.bilanPlaintes()`.
- **`data/messages.json`** : structure d'une plainte (`id`, `auteur`, `condition`, `texte.fr/en`,
  `reponses[]` avec `bonne` et `effets`).
- **Prompt 68** (la Carte devient l'appli principale) : s'il est exécuté, les liens « voir sur la carte »
  du § 2 y mènent ; sinon ils ouvrent la Carte actuelle.

## 1. Mise en page du compte

La fenêtre d'appli fait 1440×900 environ dans l'écran du PC 1920×1080. Elle est découpée en trois zones,
espacements DS 8/16/24 px.

1. **En-tête de profil**, en haut, toute la largeur :
   - **bannière** pixel, à la même heure et avec la même météo que la baie vitrée (§ 3) ;
   - **avatar** carré : pictogramme pixel original d'un feu de signalisation tram, sans logo existant ;
   - nom du compte, identifiant `@regul.nte`, badge « compte de service » (`dsBadge` info) ;
   - bio courte : « Info trafic et échanges avec les usagers — salle de régulation, Nantes. Fiction
     de jeu. » ;
   - compteurs **valeurs de jeu** :
     - publications = nombre réel de posts de la partie ;
     - abonnés = base fixe × réputation / 50, arrondie, avec la tendance du jour ▲▼ ;
     - réponses données / plaintes reçues = `Jeu.bilanPlaintes()`.
2. **Onglets**, sous l'en-tête, avec un indicateur DS rouge sous l'onglet actif :
   - **Fil** ;
   - **Mentions** : commentaires et plaintes qui attendent une réponse, avec badge du nombre et compte à
     rebours du prompt 79 ;
   - **Messagerie** : messages privés, avec badge ;
   - **Statistiques** : réputation, réponses à temps, tardives, expirées, et réactions reçues ; c'est le
     contenu actuel, remis en forme.
3. **Colonne latérale** à droite, en pixels DS :
   - « Ce qui se passe à Nantes » : incident actif, météo réelle du jour, événement d'agenda en cours ;
   - « Comptes cités » : pseudonymes fictifs les plus actifs.

Navigation :
- Tab entre zones, ← → entre onglets, ↑ ↓ dans les listes, Entrée pour ouvrir, Échap pour revenir.
- Molette ou glisser pour défiler le fil, avec une barre de défilement DS.
- `aria-live` pour les nouvelles mentions et les nouveaux messages.

## 2. Fil de publications (posts du compte)

Le fil donne l'impression d'un compte **fourni**, sans rien inventer. Il mélange trois sortes de posts,
du plus récent au plus ancien.

- **Posts de la partie** : générés automatiquement à partir des faits réels quand un incident est traité.
  Exemple : « Ligne 2 : retard de 18 min, bus de renfort engagés. Merci de votre patience. » Le texte dépend
  de l'action réelle du joueur, de la ligne réelle et du retard réel.
  - Chaque post a une photo pixel (§ 3), l'heure de jeu, un compteur « j'aime » (valeur de jeu, selon
    l'évaluation de la décision) et ses commentaires.
- **Posts d'archive** : 6 à 9 posts **antérieurs à la partie**, pour que le compte paraisse vivant dès
  l'ouverture. Ils sont générés à partir de **vrais faits de la semaine précédente**, pris dans les
  données déjà chargées (changelog GTFS, agenda, météo Open-Meteo archive). Exemples :
  - « Travaux annoncés sur la ligne … » (changelog réel) ;
  - « Fête de … ce week-end, renforts prévus » (agenda réel) ;
  - « Fortes rafales annoncées » (météo réelle).

  S'il n'y a pas de fait réel : pas de post. On ne remplit jamais avec du faux.
- **Posts publiés par le joueur** (option) : bouton « Publier une info trafic » quand un incident est en
  cours ou vient d'être traité. Le joueur choisit l'un de 3 modèles de `messages.json` (annonce, excuses,
  prévention météo), rempli avec les vraies variables.
  - Effet : réputation +1 si le message est **cohérent** avec la décision réelle (par ex. « déviation »
    après « Dévier la ligne »), −2 s'il la contredit.
  - Un post par incident au plus.

Sous chaque post :
- les **commentaires** des usagers (plaintes du prompt 28, commentaires du prompt 22, réactions du prompt
  63), rattachés au post de l'incident concerné ;
- un bouton **« Répondre »**, qui ouvre les choix de réponse existants (`reponses[]`), affichés comme des
  brouillons de réponse ;
- la réponse publiée s'affiche sous le commentaire, avec l'avatar du compte, puis les réactions en chaîne
  arrivent avec leurs délais ;
- un lien « Voir sur la carte » qui ouvre la Carte centrée sur la ligne réelle.

**Autres problématiques** (pas seulement les retards) : de nouvelles entrées dans `messages.json`, avec
conditions sur les champs réels déjà disponibles, rédigées en FR + EN avec ≥ 2 réponses (une bonne, une
mauvaise) :
- affluence d'un événement d'agenda ;
- pluie ou rafales du jour ;
- travaux et déviation du changelog ;
- accessibilité d'un arrêt, propreté, sécurité en soirée, demande d'horaires…

Même structure et même validation que les plaintes actuelles. Une entrée invalide est ignorée, avec un
avertissement en console. Les nouvelles entrées n'apparaissent que si leur condition correspond à un fait
réel de la partie.

## 3. Photos pixel « à peine perceptibles »

But : des illustrations qui ressemblent à des photos de téléphone. La pixellisation reste **subtile**,
assortie au jeu sans être grossière.

Fabrication :
- Chaque photo est dessinée par le code dans un `createGraphics` basse définition (par exemple 240×180).
- Elle réutilise et enrichit les fonctions de dessin du décor (`bureau.js`), avec des couleurs naturelles,
  des dégradés et du flou de profondeur simulé.
- Elle est ensuite agrandie ×2 à ×3 dans le fil, avec un lissage léger : les pixels restent visibles de
  près sans dominer.
- Les photos sont **mises en cache** : une seule génération par sujet, météo et heure.

Sujets, choisis selon le fait réel du post :

| Fait réel | Sujet de la photo |
|---|---|
| ligne de tram | tram sur sa voie, quai |
| ligne de bus / Chronobus | bus à un arrêt |
| navibus | navette sur la Loire |
| travaux (changelog) | barrières et cônes sur la voie |
| événement d'agenda | foule devant le Château des ducs ou sur l'île de Nantes |
| météo | ciel de pluie ou de rafales sur la grue Titan, la Loire |

- La **météo et l'heure** de la photo sont celles du fait réel (jour joué) : pluie si ≥ 1 mm, nuit si
  l'heure simulée l'est.
- **Pas de personnes identifiables**, pas de texte de marque, pas de logos de transporteurs. Les rames et
  les bus sont génériques, avec la couleur de ligne réelle de `data/lignes.js` si elle existe.
- **Texte alternatif** pour chaque photo (`t(...)`, annoncé au focus). Exemple : « Illustration : tram de
  la ligne 2 sous la pluie, quai Moncousu » ; le lieu n'apparaît que s'il est donné par la donnée réelle.
- Galerie : dans l'en-tête, un toggle « Fil / Grille » affiche les photos des posts en grille 3 colonnes.
  Le clic ouvre le post.

## 4. Messagerie privée du compte

Onglet **Messagerie** : liste des conversations à gauche (avatar pixel générique, pseudonyme fictif, extrait,
heure, badge non lu), conversation à droite en bulles DS.

- **Contenu** :
  - les plaintes marquées `prive: true` dans `messages.json` arrivent ici au lieu des mentions ;
  - quelques nouvelles entrées privées sur des sujets réels : objet oublié dans le tram de la ligne
    réelle, demande d'accessibilité, question sur une déviation réelle.
- **Répondre** : mêmes choix de réponse, même délai (prompt 79), mêmes effets.
  - Un message privé mal traité compte comme une plainte expirée.
  - Les réponses privées ne génèrent pas de réactions publiques en chaîne, mais au plus 1 relance privée.
- **Transfert vers le patron** (option) : bouton « Transmettre au patron » pour une demande hors du rôle
  du joueur. Il génère un message dans l'appli Patron et n'a aucun effet de réputation.
- L'appli Patron reste séparée. Cette messagerie est celle du **compte social**.

## 5. Détails visuels et animations (design system)

- Fond DS `#0D0C0C`, cartes de post en `blanc05` avec bordure `blanc15`, titres en police pixel DS, texte
  JetBrains Mono ou repli.
- Couleurs fonctionnelles DS :
  - succès pour une bonne réponse ;
  - erreur pour une mauvaise réponse ou une plainte expirée ;
  - alerte pour un compte à rebours < 30 s ;
  - info pour les messages privés.
- Micro-animations courtes :
  - arrivée d'un post en glissé de 8 px sur 200 ms ;
  - compteur « j'aime » qui monte ;
  - indicateur « en train d'écrire… » avant une réaction.

  Toutes sont désactivées avec `prefers-reduced-motion`.
- Son : clic discret, notification de mention distincte de celle du patron. Le tout suit l'interrupteur
  Son (M).
- Mobile (prompt 60) : en-tête compacte, onglets en barre basse, une colonne, cibles ≥ 44 px.

## 6. Sauvegarde et cohérence

- La sauvegarde (prompt 33) enregistre :
  - les posts publiés par le joueur ;
  - les réponses ;
  - l'onglet actif ;
  - les conversations privées et leurs délais.

  Les posts automatiques et d'archive sont recalculés à partir des faits réels.
- Les effets de jeu (réputation, malus de délai, réactions) sont **identiques** à avant : seule
  l'interface change, à l'exception des deux nouveautés optionnelles (publier une info trafic, messages
  privés), documentées avec leurs effets.
- Les dés et la graine ne changent pas. Les réactions restent reproductibles, comme au prompt 63.

## 7. Vérifications détaillées

- `npm run build` et `npm test` dans `site/`.
- `site/scripts/test-jeu.mjs` couvre :
  - validation des nouvelles entrées de `messages.json` (FR + EN, ≥ 2 réponses, conditions sur champs
    réels) ;
  - posts automatiques fidèles à l'action et aux valeurs réelles ;
  - posts d'archive uniquement à partir de faits chargés, aucun sinon ;
  - cohérence d'une info trafic publiée (+1 / −2), un post par incident au plus ;
  - messages privés : délai, effets, relance ≤ 1 ;
  - sauvegarde et chargement.
- Partie réelle, en français puis en anglais, au clavier puis à la souris :
  - ouvrir Community : profil, fil d'archive illustré, grille de photos ;
  - incident traité → post avec photo cohérente (ligne, météo, heure) → commentaire → Répondre →
    réactions ;
  - onglet Mentions avec compte à rebours ;
  - Messagerie : répondre, transmettre au patron ;
  - jour pluvieux → photos et bannière sous la pluie.
- Vérification visuelle :
  - pixellisation **subtile** (pas de gros pixels) ;
  - aucune ressemblance avec un réseau social existant ;
  - aucun logo ou nom réel de transporteur ou de collectivité ;
  - textes alternatifs présents.
- Accessibilité :
  - contraste ≥ 4,5:1 ;
  - clavier seul ;
  - `aria-live` ;
  - `prefers-reduced-motion` ;
  - aucun flash ;
  - hors ligne (fallback) ;
  - 1920×1080 et mobile ;
  - aucun fichier image ajouté.
- Aucune régression des prompts précédents, en particulier 22, 28, 63 et 79 : rejouer une semaine
  complète.
- Documenter dans `jeu/NN-community-compte-social.md` (numéro libre suivant dans `jeu/`) et ajouter la
  ligne au sommaire de `jeu/README.md`. Ajouter le compte fictif et le réseau inventé aux crédits
  (fiction).
- Branche `jeu/prompt-85-community-compte-social`. À chaque push : entrée en tête de `journal.md`. Ne pas
  fusionner dans `main` sans demande.
