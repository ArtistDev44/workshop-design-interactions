# Prompt 226 — Tableau des fins en trois séquences (à valider avant de coder)

Date : 15/11/2026. Prompt : `prompts/226-jeu-fins-en-trois-sequences.md`. Statut : **tableau proposé, en attente de
validation** — aucune ligne de code écrite.

Ce document fixe, pour chacune des 12 fins, les trois séquences de la petite vidéo qui précède le rapport papier :
**(a) le moment** — ce qui a fait basculer la semaine ; **(b) la conséquence** — ce que ça provoque autour ;
**(c) l'après** — le personnage, la pièce, le lendemain. Chaque ligne indique le décor, le mouvement, les données
réelles de la partie utilisées et le sous-titre (FR ici ; EN écrit à l'exécution).

## Règles communes

| Sujet | Règle |
|---|---|
| Durée | 3 séquences de **5 s** (4 à 6 s selon le texte), fondu de 0,4 s entre elles ; ≈ 15 s au total. |
| Rendu | Dessiné par le code (p5.js), pixel art du design system, 1920 × 1080 recomposé en mobile. Aucun fichier vidéo, aucune ressource réseau. |
| Couleur | Tampon et lumière à la couleur du **ton** de la fin (`Jeu.FINS_SEMAINE[].ton`, prompt 207) ; ciel du palier de score (décor existant de `planVille`). |
| Données | Uniquement ce que la partie a produit : `bilan.signaux`, `bilan.pese`, jauges finales, dates et lignes jouées (`Jeu.evenementsJournee`), météo réelle (`signaux.meteo`), lettre de licenciement (`Jeu.lettreLicenciement`). **Donnée absente → l'élément n'est pas dessiné**, le sous-titre a une variante sans chiffre. |
| Personnages | Le patron et Camille (prompt 189) en silhouettes pixel, sans visage détaillé ; les usagers en foule anonyme. |
| Texte à l'écran | Un sous-titre par séquence (bande basse de la cinématique actuelle, ≥ 4,5:1), lu au lecteur d'écran. Chiffres réels en petites étiquettes dans l'image. |
| Mouvement réduit | Plan fixe de chaque séquence (l'image à 60 % de son mouvement), aucun fondu, avance à la main ou toutes les 6 s. Aucun clignotement > 3 / s, jamais de flash plein écran. |
| Son | Une ambiance courte par fin (`Confort.Son`), coupée si le son est coupé. |
| Commandes | Entrée / Espace / → / clic : séquence suivante ; Échap : passer (rapport) ; P : pause. |

## Décors

| Code | Décor | Existe ? |
|---|---|---|
| **V** | Ville et Loire au loin, ciel du palier (`planVille`) | oui |
| **L** | Lettre posée sur le bureau (`planLettre`) | oui |
| **B** | Pièce du bureau, poste vu de dos (`planPiece`, `dessinerPieceBureau`) | oui |
| **C** | Écran du PC : carte du réseau (lignes réelles `lignes.json`) | oui (appli) — à réduire en plan |
| **T** | Téléphone en main (`telephone-main.js`) : notification, Quai | oui — à réduire en plan |
| **S** | Salle de contrôle de nuit (pièce B, lumières éteintes, écran seul allumé) | variante de B |
| **P** | Bureau du patron (porte vitrée, fauteuil, plante) | **nouveau** |
| **A** | Couloir / ascenseur du siège (portes qui se ferment) | **nouveau** |
| **Q** | Quai de tram au matin (abri, foule pixel, tram qui entre) | **nouveau** |

Trois décors nouveaux, réutilisés par plusieurs fins ; les autres existent déjà.

## Tableau

### 1 · `virale` — La capture virale (ton : négatif)

| Séq. | Décor | Mouvement | Données réelles | Sous-titre (FR) |
|---|---|---|---|---|
| a · le moment | T | Le doigt tape « Envoyer » ; la bulle du clash part (mots masqués `&#(` comme dans le jeu). | nombre de clashs (`signaux.clashs`) en étiquette « 1/4… 4/4 » ; jour réel du premier clash | « {jour}, une réponse de trop. » (sans jour connu : « Une réponse de trop. ») |
| b · la conséquence | T puis V | La capture se multiplie en vignettes ; un compteur de partages monte ; elles s'envolent au-dessus de la ville. | clashs sur les signalements / sur Quai (`pese.clashsDetail`) | « La capture a fait le tour de Nantes. » |
| c · l'après | A | Un carton « ARCHIVES » dans les bras, les portes de l'ascenseur se ferment. | score de la semaine | « Mutation aux archives, le temps que ça retombe. » |

### 2 · `burnout` — Le burn-out (ton : sombre)

| Séq. | Décor | Mouvement | Données réelles | Sous-titre (FR) |
|---|---|---|---|---|
| a | B | Un gobelet de café par jour joué s'empile à côté du clavier. | `joursCafe` sur `joursJoues` | « Un café par jour. Jamais de pause. » |
| b | C | La carte : un renfort part sur chaque incident, les jetons s'épuisent un à un. | renforts sur décisions (`pese.renforts`) | « Des renforts partout, tout le temps. » |
| c | S | Le fauteuil vide ; le téléphone vibre sur le bureau, l'écran affiche un SMS de Camille. | — | « Camille a posé votre semaine. Le poste vous attend, vide. » |

### 3 · `imposteur` — L'imposteur (ton : ambigu)

| Séq. | Décor | Mouvement | Données réelles | Sous-titre (FR) |
|---|---|---|---|---|
| a | C | Les trois jauges remontent toutes seules, malgré des décisions marquées d'une croix. | bons choix sur décisions (`pese.bons`) | « Les jauges sont belles. » |
| b | P | Le patron applaudit derrière sa vitre ; un tampon « FÉLICITATIONS » tombe. | score | « La direction vous félicite. » |
| c | B | Camille, de dos, referme le bilan sans un mot ; la lumière baisse. | — | « Camille a lu le bilan. Elle ne dira rien, cette fois. » |

### 4 · `fauteuil` — Le fauteuil du patron (ton : bonne fin)

| Séq. | Décor | Mouvement | Données réelles | Sous-titre (FR) |
|---|---|---|---|---|
| a | C | Toutes les lignes jouées de la semaine passent au vert, une à une. | lignes réellement jouées (`evenementsJournee[].ligne`) | « Une semaine tenue de bout en bout. » |
| b | P | Le patron range son bureau dans un carton et tend un badge. | budget final, score | « Le patron part à la direction régionale. » |
| c | P | Vous vous asseyez dans le fauteuil ; vue sur la salle de contrôle. | — | « La salle de contrôle est à vous. » |

### 5 · `diplomate` — Le diplomate de Quai (ton : positif)

| Séq. | Décor | Mouvement | Données réelles | Sous-titre (FR) |
|---|---|---|---|---|
| a | T | Les réponses partent ; un message haineux est signalé et se replie. | bonnes réponses sur Quai, signalées (`signaux.quai`) | « Pas un clash. Des réponses justes. » |
| b | T | Les cœurs et les « merci » des usagers remontent le fil. | nombre de réponses Quai | « Sur Quai, les usagers ont fini par vous remercier. » |
| c | P | Une plaque « Communication de crise » est vissée sur une porte. | score | « On vous confie la parole du réseau en temps de crise. » |

### 6 · `insoumis` — L'insoumis (ton : ambigu)

| Séq. | Décor | Mouvement | Données réelles | Sous-titre (FR) |
|---|---|---|---|---|
| a | B | Le mail du patron (objectif du jour) est glissé à la corbeille, jour après jour. | objectifs ratés sur objectifs (`pese.objectifs`) | « Les objectifs du patron ? Ignorés. » |
| b | C | Le réseau, lui, reste fluide : les lignes roulent. | score | « Et le réseau s'en porte mieux. » |
| c | A | C'est le patron, carton dans les bras, qui prend l'ascenseur. | — | « C'est lui qui a demandé sa mutation. » |

### 7 · `usagers` — Les usagers d'abord (ton : ambigu)

| Séq. | Décor | Mouvement | Données réelles | Sous-titre (FR) |
|---|---|---|---|---|
| a | Q | Un tram entre à l'heure, les usagers montent, l'abri se vide. | fluidité et réputation finales (`pese.fluiditeReputation`) | « Les trams ont roulé. Les Nantais l'ont vu. » |
| b | B | La jauge Budget se vide ; des factures s'empilent. | budget final | « Il ne reste presque rien du budget. » |
| c | L | Une convocation de la direction financière, datée du lundi suivant. | date du lundi suivant la semaine jouée | « Convocation lundi, factures à l'appui. » |

### 8 · `boucEmissaire` — Le bouc émissaire (ton : injuste)

| Séq. | Décor | Mouvement | Données réelles | Sous-titre (FR) |
|---|---|---|---|---|
| a | V | La météo réelle de la semaine : pluie et rafales sur la ville. | pluie (mm) et rafales (km/h) de la semaine (`signaux.meteo`) ; sans donnée : ciel gris seul | « La semaine a été plus forte que vous. » |
| b | C | Les bonnes décisions s'allument en vert… puis la carte rougit quand même. | bons choix sur décisions prises | « Vos décisions étaient les bonnes. » |
| c | P | Derrière la vitre, la direction pointe du doigt ; votre nom sur un post-it. | — | « Il fallait un responsable. Ce sera vous. » |

### 9 · `correcte` — Semaine correcte (ton : neutre)

| Séq. | Décor | Mouvement | Données réelles | Sous-titre (FR) |
|---|---|---|---|---|
| a | C | Une journée-type en accéléré : des incidents s'allument et s'éteignent. | nombre de dossiers de la semaine | « Le réseau a fonctionné… » |
| b | B | Les trois jauges oscillent puis se posent au milieu. | jauges finales | « …pas sans à-coups. » |
| c | V | Le soir tombe sur la Loire ; une lumière reste allumée dans la tour. | score | « Un bilan nuancé. Lundi, on recommence. » |

### 10 · `reprimande` — La réprimande (ton : négatif)

| Séq. | Décor | Mouvement | Données réelles | Sous-titre (FR) |
|---|---|---|---|---|
| a | C | Des incidents restent rouges sur la carte, sans réponse. | non traités (`signaux.nonTraites`) | « La semaine a échappé à la salle. » |
| b | L | Le bilan imprimé, les décisions surlignées au feutre rouge. | score, décisions | « La direction demande des comptes. » |
| c | P | La porte du patron se ferme ; on attend dehors, sur une chaise. | — | « Entrez. On a à parler. » |

### 11 · `licenciement` — Licencié (prompt 84)

| Séq. | Décor | Mouvement | Données réelles | Sous-titre (FR) |
|---|---|---|---|---|
| a | C | La jauge la plus basse descend jusqu'à zéro ; l'alarme du bandeau (sans flash). | jauge la plus basse, sa valeur ; date et heure (`lettre.quand`) | « Le {date}, à {heure}, la jauge est tombée. » |
| b | L | La lettre du patron (texte réel de `Jeu.lettreLicenciement`), la signature. | avertissements, pires décisions (`lettre.pires`, 1 citée) | « Après {n} avertissements, la lettre est arrivée. » |
| c | A | Le carton d'affaires (plante, mug, badge) ; les portes se ferment. | — | « Votre badge ne passe plus les portiques. » |

### 12 · `demission` — La démission (prompt 47)

| Séq. | Décor | Mouvement | Données réelles | Sous-titre (FR) |
|---|---|---|---|---|
| a | B | Les trois jauges sous 20, côte à côte ; on écrit sur une feuille. | fluidité, réputation, budget au moment de la démission | « Tout était sous le seuil critique. » |
| b | B | Le badge posé sur le clavier ; la chaise recule. | — | « Vous avez rendu votre badge. » |
| c | V puis Q | Dehors, les quais de Loire au matin ; un tram passe sans vous. | date du jour de la démission | « Le réseau roule encore. Sans vous. » |

## Ce qui reste à décider (avant de coder)

1. **Les trois décors nouveaux** (P bureau du patron, A ascenseur, Q quai de tram) : les dessiner, ou les remplacer
   par des décors existants (B, V, L) pour réduire le travail ? Sans eux : 9 séquences sur 36 à recomposer.
2. **Sous-titres** : ces formulations, ou plus courtes encore (≤ 50 caractères) ?
3. **Mode histoire** : la vidéo de la fin finale remplace la cinématique par palier (semaine 3) — confirmé dans le
   prompt ; garder la ville du palier en fond de la séquence (c) ?
4. **Galerie** : « Revoir la fin » rejoue avec les données de la partie où elle a été obtenue (stockées dans la
   galerie) — accepter ce stockage en plus (quelques nombres par fin) ?
