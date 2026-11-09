00 / MODE D'EMPLOI

## Ce document est votre base de travail

PATRIMOINE.EXE n'est pas un exercice de reproduction décorative. C'est un protocole de recherche-création : partir d'une source, comprendre comment elle est construite, formaliser ses règles, puis concevoir un comportement numérique.

01

#### Observer avant de coder

Une source réelle, contextualisée et documentée précède la direction artistique.

02

#### Formaliser avant d'ajouter des effets

Votre projet doit pouvoir être expliqué avec des règles simples : modules, relations, variations, invariants.

03

#### Stabiliser avant de complexifier

Une œuvre simple qui fonctionne vaut mieux qu'un système spectaculaire mais fragile ou incompréhensible.

**Principe directeur**Une source réelle avant un style. Une grammaire explicite avant un effet. Un système stable avant une technologie supplémentaire. Un mapping justifié avant une API. Une œuvre exposable avant une démonstration de code.

### Compétences travaillées

| Capacité                             | Preuve attendue                                                             |
| ------------------------------------ | --------------------------------------------------------------------------- |
| Documenter une source patrimoniale   | Fiche-source : contexte, référence, droits, captures/relevés.               |
| Extraire une grammaire               | Diagramme ou fiche montrant primitives, relations, invariants et variables. |
| Prototyper un système numérique      | Sketch p5.js / JS lançable et structuré.                                    |
| Mapper une donnée ou une interaction | Relation explicite entrée → transformation → sortie perceptible.            |
| Tester et itérer                     | Test croisé, observation, décision de correction.                           |
| Restituer                            | Œuvre, cartel, documentation, démonstration et défense orale.               |

01 / MISSION

## Votre projet final

En groupe de 2 à 3 étudiants, vous produisez une œuvre numérique issue d'une source patrimoniale nantaise. Le projet peut être génératif, data-driven, interactif ou hybride. La technologie est choisie parce qu'elle renforce le concept, jamais pour elle-même.

 SOURCEpatrimoine réel GRAMMAIRErègles / relations ALGORITHMEcode / système DATA /INTERACTIONoption pertinente ŒUVREmontrable 

### Ce qui est obligatoire

*   Une **source patrimoniale identifiable et documentée**.
*   Une **grammaire** explicite : au moins une règle structurante clairement formulée.
*   Un **prototype fonctionnel** lançable dans un navigateur.
*   Au moins **trois paramètres réellement opérants** dans le système.
*   Un test par un autre groupe et au moins **une itération documentée**.
*   Une documentation complète permettant à une autre personne de comprendre et relancer le projet.

### Ce qui est optionnel

API météoNantes Open Datadataset local JSON/CSVsouris / touchwebcammicrocapteursThree.jsTouchDesigner

**La complexité n'est pas un critère de qualité.**Un projet sans API peut obtenir une excellente note. Un projet avec plusieurs technologies peut être faible si le lien entre source, système et expérience n'est pas défendable.

02 / PATRIMOINE COMPUTATIONNEL

## Le patrimoine comme système, pas comme image

Une façade, un escalier, un vitrail, une ferronnerie, un objet industriel, une archive ou un paysage contiennent des relations. Le travail computationnel commence lorsque vous cessez de demander « à quoi cela ressemble ? » pour demander « comment cela fonctionne-t-il visuellement, spatialement ou temporellement ? »

### Source → propriétés observables

| Famille       | Questions                                                   | Traductions possibles                           |
| ------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| Géométrie     | Quels axes, angles, modules, proportions ?                  | Coordonnées, rotations, échelles, contraintes.  |
| Répétition    | Qu'est-ce qui se répète ? À quel rythme ?                   | Boucles, grilles, séries, permutations.         |
| Hiérarchie    | Qu'est-ce qui domine ? Qu'est-ce qui articule ?             | Taille, poids, contraste, fréquence.            |
| Matière       | Quelle texture, densité, irrégularité ?                     | Bruit, particules, trames, alpha, grain.        |
| Temporalité   | Y a-t-il un cycle, une transformation, une usure ?          | Animation, croissance, disparition, historique. |
| Usage / geste | Comment le corps rencontre-t-il cet élément ?               | Interaction, parcours, seuil, proximité.        |
| Mémoire       | Que raconte la source ? Qu'est-ce qui doit rester visible ? | Archives, traces, couches, données, texte.      |

EXERCICE / SECRET GEOMETRY

#### Décomposer avant de styliser

1.  Choisissez un détail patrimonial.
2.  Tracez ses axes principaux.
3.  Identifiez 1 à 3 modules.
4.  Notez les symétries et répétitions.
5.  Séparez les **invariants** (ce qui ne change pas) et les **variables** (ce qui peut changer).
6.  Écrivez une règle en une phrase : « une unité est répétée tous les X pixels et tourne de Y selon Z ».

### Copie, citation, traduction, génération

A

#### Copie

Reproduire l'apparence. Utile pour comprendre, insuffisant comme projet final.

B

#### Citation

Réutiliser une forme identifiable en assumant la référence.

C

#### Traduction

Préserver une relation ou une logique plutôt qu'une forme exacte.

D

#### Génération

Construire un système capable de produire des variantes cohérentes avec la grammaire extraite.

Le patrimoine n'est pas un style. C'est une source, une structure, une mémoire et un système à interroger.

03 / GÉOMÉTRIE & GRAMMAIRE

## Transformer une observation en règles calculables

Le code ne comprend ni « élégant », ni « ancien », ni « patrimoine ». Il comprend des nombres, des relations, des conditions et des fonctions. Votre grammaire fait le pont entre perception et calcul.

### Les primitives utiles

#### Point / ligne

Structure, réseau, ossature, direction, trajectoire.

#### Polygone

Module, cellule, pavage, architecture, facette.

#### Cercle / arc

Rosace, cycle, radialité, rythme, propagation.

#### Grille

Répétition, tissage, mosaïque, ordonnancement.

#### Transformation

Translation, rotation, échelle, miroir.

#### Couche

Superposition, mémoire, profondeur, hiérarchie.

### Symétries et opérations

 rotation miroir translation échelle 

### La fiche de grammaire

| Champ       | Exemple                                                            |
| ----------- | ------------------------------------------------------------------ |
| Primitives  | segment, cercle, module rectangulaire.                             |
| Relations   | les modules s'alignent sur un axe ; chaque deuxième module pivote. |
| Invariants  | proportion 1:2, nombre de strates, centre commun.                  |
| Variables   | angle, densité, taille, espacement, opacité.                       |
| Temps       | variation lente de l'angle sur 20 s.                               |
| Déclencheur | vent, souris, heure, donnée urbaine, aucun.                        |
| Limites     | plage minimale / maximale, reset, fallback.                        |

**Test de qualité de la grammaire**Une personne qui n'a pas vu votre source doit pouvoir lire votre fiche et reconstruire un comportement proche, sans avoir besoin de votre moodboard.

04 / CREATIVE CODING

## p5.js : le code comme matériau de design

p5.js permet de travailler directement avec dessin, temps, hasard, interaction et données dans le navigateur. Vous n'avez pas besoin de maîtriser tout JavaScript : vous devez surtout comprendre la logique du système que vous construisez.

### Le squelette minimal

```
function setup() {
  createCanvas(1280, 720);
  pixelDensity(1);
}

function draw() {
  background(244, 241, 233);
  // Votre système est recalculé ici à chaque image.
}
```

### Variables : rendre une forme paramétrique

```
let moduleSize = 40;
let spacing = 12;
let rotationStep = 0.12;

function drawModule(x, y, index) {
  push();
  translate(x, y);
  rotate(index * rotationStep);
  rectMode(CENTER);
  noFill();
  stroke(20);
  rect(0, 0, moduleSize, moduleSize);
  pop();
}
```

### Boucle : transformer un motif en système

```
for (let y = 0; y < height; y += moduleSize + spacing) {
  for (let x = 0; x < width; x += moduleSize + spacing) {
    const index = floor(x / (moduleSize + spacing)) +
                  floor(y / (moduleSize + spacing));
    drawModule(x, y, index);
  }
}
```

### Fonctions : isoler votre grammaire

Une bonne fonction correspond souvent à une idée clairement formulable : `drawRosette()`, `drawBalustrade()`, `applyWeather()`, `updateInteraction()`.

MICRO-LAB

#### Une règle forte, une variation

Construisez un sketch avec une seule fonction visuelle. Faites ensuite varier un paramètre à la fois. Prenez deux captures. La question n'est pas « laquelle est la plus belle ? », mais « quelle variable change réellement la perception de la règle ? ».

### Random vs noise

| Outil          | Comportement                               | Usage                                             |
| -------------- | ------------------------------------------ | ------------------------------------------------- |
| `random()`     | Variation indépendante et imprévisible.    | Accidents, distributions, choix discrets.         |
| `noise()`      | Variation continue et corrélée.            | Matière, dérive, croissance, mouvement organique. |
| `randomSeed()` | Rend une séquence aléatoire reproductible. | Archive, comparaison de versions, impression.     |

### Exemple : radialité

```
let branches = 12;
let radius = 180;

function draw() {
  background(244, 241, 233);
  translate(width/2, height/2);
  noFill();
  stroke(15);

  for (let i = 0; i < branches; i++) {
    push();
    rotate(TWO_PI * i / branches);
    line(40, 0, radius, 0);
    circle(radius, 0, 18);
    pop();
  }
}
```

**Performance**Testez en 1920×1080. Évitez de recréer de gros tableaux dans `draw()`, limitez les particules, utilisez `pixelDensity(1)` si nécessaire et pré-calculez les géométries stables.

05 / SYSTÈMES GÉNÉRATIFS

## Une œuvre générative n'est pas une animation aléatoire

Un système génératif possède un espace de possibilités. Votre travail consiste à définir les règles, les limites et les relations qui garantissent que les variations restent conceptuellement cohérentes.

### Invariants + variables + contraintes

#### Invariant

Ce qui protège l'identité de la grammaire : nombre d'axes, proportion, organisation, ordre.

#### Variable

Ce qui peut évoluer : angle, taille, densité, couleur, nombre, vitesse, transparence.

#### Contrainte

Ce qui empêche le système de devenir incohérent : min/max, seuils, règles de voisinage.

### Quatre régimes temporels

| Régime               | Description                              | Question design                                    |
| -------------------- | ---------------------------------------- | -------------------------------------------------- |
| Statique généré      | Une composition est calculée puis figée. | Pourquoi générer plusieurs variantes ?             |
| Évolution lente      | Le système dérive sans rupture.          | Quelle durée révèle la logique ?                   |
| Événement            | Une condition provoque une mutation.     | Qu'est-ce qui déclenche réellement un changement ? |
| Interaction continue | Le visiteur module en temps réel.        | L'utilisateur comprend-il le lien action-effet ?   |

### Seeds et archive

```
let seed = 12092026;

function setup() {
  createCanvas(1280, 720);
  randomSeed(seed);
  noiseSeed(seed);
}

function keyPressed() {
  if (key === 'R') {
    seed = floor(random(999999));
    randomSeed(seed);
    noiseSeed(seed);
  }
}
```

**À documenter :** si votre œuvre est générative, indiquez ce qui reste invariant, ce qui varie, les plages de variation et ce qui garantit la cohérence du résultat.

06 / DATA, API & DATASETS

## Une donnée ne devient intéressante qu'après un choix de mapping

Ajouter une API ne constitue pas un concept. Vous devez expliquer pourquoi une donnée donnée modifie une propriété précise de l'œuvre et ce que cette relation fait comprendre ou ressentir.

### Le principe de mapping

 INPUTvent = 38 km/h normaliser RÈGLE0–80 → 0.02–0.30 rad OUTPUTrotation du module 

### Exemple Open-Meteo : météo de Nantes

Open-Meteo permet de récupérer des données météo JSON sans clé pour des usages simples. Le code ci-dessous doit toujours disposer d'un fallback local.

```
let weather = {
  temperature: 15,
  windSpeed: 10,
  windDirection: 0,
  rain: 0
};

async function loadWeather() {
  const url = "https://api.open-meteo.com/v1/forecast" +
    "?latitude=47.2184&longitude=-1.5536" +
    "¤t=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation" +
    "&timezone=Europe%2FParis";

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("HTTP " + response.status);
    const json = await response.json();
    weather.temperature = json.current.temperature_2m;
    weather.windSpeed = json.current.wind_speed_10m;
    weather.windDirection = json.current.wind_direction_10m;
    weather.rain = json.current.precipitation;
  } catch (err) {
    console.warn("API indisponible : fallback local", err);
  }
}
```

#### Mapping possible

```
let rotationAmount = map(
  constrain(weather.windSpeed, 0, 80),
  0, 80,
  0.02, 0.30
);

let density = map(
  constrain(weather.temperature, 0, 35),
  0, 35,
  8, 30
);
```

### Exemple Nantes Open Data : patrimoine arboré

Le portail Open Data de Nantes Métropole expose des datasets via une API. Le patrimoine arboré peut servir de matière pour travailler espèce, localisation, distribution ou densité.

```
const treesURL =
  "https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/" +
  "244400404_patrimoine-arbore-nantes-metropole/records?limit=50";

async function loadTrees() {
  try {
    const r = await fetch(treesURL);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const json = await r.json();
    const records = json.results;
    console.log(records.length, "arbres chargés");
  } catch (e) {
    console.warn("Fallback dataset local", e);
  }
}
```

**Ne dépendre jamais du réseau pour l'évaluation finale.**Conservez un échantillon JSON local ou des valeurs de secours. Une API peut changer, ralentir ou devenir indisponible.

### Normaliser avant de mapper

```
function normalize(value, minValue, maxValue) {
  return constrain((value - minValue) / (maxValue - minValue), 0, 1);
}

let n = normalize(weather.windSpeed, 0, 80);
let angle = lerp(0.02, 0.30, n);
```

### Choisir une donnée pertinente

| Question                                     | Bon signal                                                     | Mauvais signal                                    |
| -------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------- |
| La donnée a-t-elle un lien avec le concept ? | Elle transforme une propriété déjà présente dans la grammaire. | Elle est ajoutée parce qu'une API est disponible. |
| Le mapping est-il perceptible ?              | Le changement peut être vu ou entendu sans lire le code.       | La donnée change une valeur imperceptible.        |
| Le mapping est-il justifiable ?              | Une phrase explique le choix.                                  | « C'était joli » est la seule justification.      |
| Le système est-il robuste ?                  | Snapshot/fallback prévu.                                       | Écran vide sans réseau.                           |

07 / INTERACTION, MAPPING & FEEDBACK

## Une interaction est une relation perceptible

Le visiteur agit ; le système interprète ; l'œuvre répond. L'interaction est réussie lorsque cette boucle est compréhensible, suffisamment rapide et cohérente avec le concept.

### Trois niveaux

#### Input

Souris, touch, clavier, webcam, micro, capteur, présence.

#### Mapping

La règle qui convertit l'entrée en paramètres du système.

#### Feedback

La réponse perceptible : forme, son, vitesse, lumière, texte, état.

### Interaction minimale avec la souris

```
function draw() {
  background(244, 241, 233);

  let nx = constrain(mouseX / width, 0, 1);
  let ny = constrain(mouseY / height, 0, 1);

  let scaleFactor = lerp(0.5, 2.0, nx);
  let rotationSpeed = lerp(-0.02, 0.02, ny);

  // utilisez scaleFactor et rotationSpeed dans votre grammaire
}
```

### Touch / mobile

```
function touchMoved() {
  // Sur mobile, p5.js expose les touches actives via touches[].
  // Toujours prévoir un comportement clavier/souris alternatif.
  return false; // évite le scroll de page pendant l'interaction
}
```

### Webcam : présence et responsabilité

```
let cam;

function setup() {
  createCanvas(1280, 720);
  cam = createCapture(VIDEO);
  cam.size(320, 180);
  cam.hide();
}

function draw() {
  // Vous pouvez analyser l'image ou l'utiliser comme entrée visuelle.
  // N'enregistrez pas de personnes sans cadre clair de consentement.
}
```

**Test silencieux**Un autre groupe utilise votre œuvre pendant 30 à 60 secondes sans explication. Observez : comprend-il qu'il peut agir ? Quelle action tente-t-il ? Le feedback confirme-t-il son action ? Que devez-vous corriger ?

### Accessibilité de l'interaction

*   Prévoir une alternative clavier/touch lorsqu'une interaction corporelle est essentielle.
*   Ne pas exiger une posture debout ou des gestes de grande amplitude.
*   Éviter les flashs rapides et les effets stroboscopiques.
*   Ne pas rendre le son indispensable sans alternative visuelle.
*   Le projet doit rester compréhensible sans longue explication orale.

08 / CITY LAYER

## Nantes comme corpus de recherche

Le territoire n'est pas un décor. Il fournit des sources, des histoires, des formes, des usages et des données. Vous pouvez choisir un élément proposé ici ou défendre une autre source documentée.

#### Passage Pommeraye

Verticalité, escaliers, balustrades, séquences, répétitions, axes, circulation.

#### Île Feydeau / mascarons

Sérialité, variations dans une famille, façade, rythme, visage/ornement, répétition imparfaite.

#### Château des ducs de Bretagne

Strates, fortification, murs, tours, crénelage, plan, seuils, temporalités historiques.

#### Tour LU / héritage industriel

Ornement, signal urbain, géométrie verticale, couleur, mémoire d'une production.

#### Grues et chantiers navals

Treillis, structure, levage, mouvement, industrie, répétition mécanique.

#### Patrimoine arboré

Donnée géolocalisée, distribution, espèces, densité, âge si disponible, paysage vivant.

### Méthode d'observation

1.  Ne photographiez pas « tout ». Sélectionnez **5 à 10 détails maximum**.
2.  Pour chaque détail, notez ce qui est structuré : axe, module, rythme, relation, matière.
3.  Repérez une source institutionnelle ou documentaire qui contextualise votre observation.
4.  Indiquez ce que vous ne savez pas. N'inventez pas d'histoire pour justifier une forme.
5.  Choisissez une seule source principale pour le projet final.

**Fiche-source V1 :** titre / lieu / type / contexte / URL ou référence / date d'accès / droits ou licence si disponibles / vos relevés / 3 propriétés observables / 1 propriété volontairement écartée.

### Ressources locales recommandées

*   Nantes Patrimonia — site patrimonial de la Ville de Nantes.
*   Open Data Nantes Métropole — données publiques de la Ville et de la Métropole.
*   Sources fournies en cours, archives et références validées par l'équipe pédagogique.

09 / TERRITOIRES CRÉATIFS

## Choisissez une direction ou proposez la vôtre

Ces pistes ne sont pas des sujets imposés. Elles servent de déclencheurs conceptuels. Vous pouvez les hybrider ou en proposer une autre, à condition de maintenir la chaîne source → grammaire → système → œuvre.

01

**PATRIMOINE.EXE** — réinterprétation numérique libre d'une source patrimoniale.

02

**MOTIFS VIVANTS** — motifs qui évoluent, se reproduisent, se dissolvent ou mutent.

03

**DIGITAL ZELLIGE** — géométrie, tessellation, symétrie, répétition et variation algorithmique.

04

**INFINITE HERITAGE** — une grammaire patrimoniale produit une œuvre infinie.

05

**ARCHITECTURE → CODE** — transformer façade, plan, escalier, fenêtre ou structure en règles.

06

**THE SECRET GEOMETRY** — révéler les axes, réseaux et symétries cachés.

07

**BROKEN SYMMETRY** — introduire accidents, anomalies et ruptures dans un ordre régulier.

08

**ALGORITHMIC ORNAMENT** — inventer une famille de motifs à partir de règles précises.

09

**CODED TEXTILE** — tissage, broderie et textile interprétés comme systèmes computationnels.

10

**PIXEL BEFORE PIXEL** — rapprocher mosaïque, tissage et image numérique.

11

**ANCIENT FUTURES** — imaginer l'évolution numérique d'une logique patrimoniale.

12

**CULTURAL GLITCH** — collision contrôlée entre règles historiques et logique de perturbation.

13

**CITY DNA** — traduire une ville en système graphique à partir de détails choisis.

14

**NANTES PATTERN LAB** — créer une bibliothèque de formes à partir de relevés nantais.

15

**DATA HERITAGE** — un dataset devient un moteur de transformation du patrimoine.

16

**WEATHER PATTERNS** — météo en temps réel → géométrie, rythme, densité, temporalité.

17

**TIME AS ORNAMENT** — heure, date ou cycle comme structure du motif.

18

**BODY / PATTERN** — présence ou mouvement du visiteur transforme la grammaire.

19

**COLLECTIVE PATTERN** — plusieurs personnes contribuent à une composition commune.

20

**PATTERN ECOSYSTEM** — les modules se comportent comme des organismes.

21

**GENERATIVE ARCHIVE** — une collection ne se consulte plus seulement : elle produit.

22

**GENERATIVE FRESCO** — composition grand format, pensée pour l'exposition.

23

**FROM HAND TO ALGORITHM** — passer d'un relevé dessiné à une règle générative.

24

**CRAFT / MACHINE** — confronter irrégularité du geste et répétabilité de la machine.

25

**IMPOSSIBLE HERITAGE** — générer des structures impossibles à fabriquer physiquement.

10 / PROTOCOLE 3 JOURS

## Observer → construire → exposer

### Jour 1 — lundi 9 novembre — OBSERVER / DÉCODER

| Temps       | Séquence                          | Objectif                                                         | Sortie                        |
| ----------- | --------------------------------- | ---------------------------------------------------------------- | ----------------------------- |
| 09:00–09:30 | Ouverture + diagnostic            | Comprendre le cadre et repérer les niveaux de code/design.       | Groupes / besoins identifiés. |
| 09:30–10:30 | Cours : patrimoine computationnel | Source, provenance, copie vs traduction, grammaire.              | Vocabulaire commun.           |
| 10:45–12:00 | Secret Geometry                   | Décomposer des sources en axes, modules, symétries, répétitions. | 3 micro-grammaires.           |
| 13:00–14:15 | Observation / corpus              | Collecter des détails et informations.                           | Fiche-source V0.              |
| 14:15–15:00 | Tri / critique                    | Sélectionner une source exploitable et vérifier la provenance.   | Source validée.               |
| 15:10–16:10 | From Hand to Algorithm            | Coder une règle forte + une variation.                           | Micro-prototype.              |
| 16:10–17:00 | Critique + sauvegarde             | Décider d'une direction et stabiliser J1.                        | Livrables J1 complets.        |

**Fin J1 :** fiche-source / grammaire visuelle / sketch minimal / phrase-problématique / piste créative / capture.

### Jour 2 — mardi 10 novembre — CODER / CONNECTER

| Temps       | Séquence                 | Objectif                                            | Sortie                    |
| ----------- | ------------------------ | --------------------------------------------------- | ------------------------- |
| 09:00–09:30 | Relecture critique       | Vérifier source → règle → comportement.             | Direction confirmée.      |
| 09:30–10:30 | Creative coding          | Variables, fonctions, boucles, random/noise, seeds. | Architecture de code.     |
| 10:45–12:00 | Prototype système        | Rendre au moins 3 paramètres opérants.              | Version fonctionnelle V1. |
| 13:00–14:00 | Data / API / interaction | Décider si une couche externe est pertinente.       | Mapping justifié.         |
| 14:00–15:15 | Intégration              | Ajouter data ou interaction + fallback.             | Version V2.               |
| 15:30–16:15 | Test croisé silencieux   | Observer un utilisateur réel.                       | 3 observations.           |
| 16:15–17:00 | Itération                | Corriger une faiblesse perceptuelle ou technique.   | Version V3 documentée.    |

**Fin J2 :** prototype V3 / mapping / fallback / test croisé / décision d'itération / README en cours.

### Mercredi 11 novembre — aucune activité obligatoire

Le 11 novembre est férié. Aucun travail obligatoire n'est demandé. Vous pouvez uniquement sauvegarder ou relire vos notes si vous le souhaitez.

### Jour 3 — jeudi 12 novembre — PRODUIRE / EXPOSER

| Temps       | Séquence                       | Objectif                                              | Sortie                          |
| ----------- | ------------------------------ | ----------------------------------------------------- | ------------------------------- |
| 09:00–09:30 | Préflight                      | Relancer tous les projets et identifier les risques.  | Plan de stabilisation.          |
| 09:30–12:00 | Finalisation                   | Stabilité, composition, temporalité, reset, fallback. | Freeze fonctionnel à midi.      |
| 13:00–14:00 | Documentation                  | Cartel, README, sources, contributions, IA, manifest. | Archive complète.               |
| 14:00–15:00 | Installation + captation       | Préparer l'œuvre à être montrée.                      | Hero / détail / process / demo. |
| 15:00–16:15 | Micro-exposition + soutenances | Démontrer et défendre le projet.                      | Évaluation.                     |
| 16:15–17:00 | Collecte + debrief             | Vérifier l'archive et tirer les apprentissages.       | Dépôt final.                    |

**FREEZE FONCTIONNEL À MIDI**Après midi, on ne réécrit plus l'architecture du projet. On documente, installe, teste, capture et présente.

11 / LIVRABLES

## Ce que chaque groupe remet

| Livrable        | Contenu minimum                                                                  |
| --------------- | -------------------------------------------------------------------------------- |
| Projet lançable | `index.html` + scripts/assets ; fonctionnement local ou instructions claires.    |
| Fiche-source    | Contexte, provenance, droits, relevés, propriétés observables.                   |
| Grammaire       | Diagramme / règles / invariants / variables.                                     |
| README          | Concept, stack, lancement, mapping, fallback, contributions, IA, sources/droits. |
| Manifest        | Métadonnées structurées de l'édition.                                            |
| Cartel          | 80–120 mots + source + système.                                                  |
| Captation       | hero.jpg, detail-01.jpg, process.jpg, demo.mp4 20–30 s, thumb.jpg.               |
| Présentation    | Démonstration + défense courte.                                                  |

### Structure de dossier recommandée

```
PXE_NTE001_G01_NOM-PROJET/
├── index.html
├── sketch.js
├── style.css
├── data/
│   └── fallback.json
├── assets/
├── source-sheet.pdf
├── grammar.pdf
├── README.md
├── manifest.json
├── hero.jpg
├── detail-01.jpg
├── process.jpg
├── demo.mp4
└── thumb.jpg
```

### README minimal

```
# Titre du projet
## Auteurs
## Source patrimoniale
## Concept
## Grammaire / règles
## Stack
## Data / interaction
## Lancer le projet
## Fallback / limites connues
## Contributions
## AI usage (si applicable)
## Sources / droits
```

### Cartel

**PATRIMOINE.EXE / NANTES 001**  
  
**TITRE DE L'ŒUVRE**  
Auteurs — ESD Nantes, B3 Design — 2026  
  
Source patrimoniale : \[…\]  
  
Concept : 80–120 mots.  
  
Système : p5.js / API / dataset / interaction \[…\]  
Données : \[…\]  
  
SOURCE → GRAMMAIRE → ALGORITHME → DATA/INTERACTION → ŒUVRE

12 / NOTATION INDIVIDUELLE

## Chaque étudiant reçoit sa propre note

Le projet peut être collectif, mais l'évaluation finale est individualisée. Une partie mesure la qualité commune de l'œuvre ; une partie mesure votre contribution, votre autonomie et votre capacité à expliquer les décisions auxquelles vous avez participé.

70 points

**Qualité du projet commun**

Même base pour les membres du groupe, car l'œuvre finale est une production collective.

30 points

**Évaluation individuelle**

Différenciée pour chaque étudiant à partir des traces, de l'observation et de l'oral.

### A. Projet commun — 70 points

| Critère                             | Points | Indicateurs                                                                                                                                                                                     |
| ----------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recherche patrimoniale & provenance | **10** | Source réelle, contextualisée, référencée, droits vérifiés, qualité des relevés.                                                                                                                |
| Grammaire & concept                 | **15** | Règles explicites, cohérence source → système, singularité de la proposition.                                                                                                                   |
| Prototype & fonctionnement          | **15** | Exécution, stabilité, paramètres opérants, code organisé, reset.                                                                                                                                |
| Data / interaction / mapping        | **10** | Pertinence, lisibilité du mapping, feedback, fallback si nécessaire. Si aucun data/interaction n'est utilisé, les points évaluent la pertinence du comportement génératif et de sa temporalité. |
| Design visuel & expérience          | **10** | Composition, hiérarchie, temporalité, cohérence, mise en situation.                                                                                                                             |
| Processus, test & documentation     | **10** | Test croisé, itération, README, archive, cartel, assets.                                                                                                                                        |
| **Total projet**                    | **70** |                                                                                                                                                                                                 |

### B. Évaluation individuelle — 30 points

| Critère                               | Points | Ce qui est observé                                                                                                                                     |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Contribution réelle et traçable       | **10** | Tâches effectuées, commits/versions, éléments produits, décisions prises. La spécialisation est autorisée, mais la contribution doit être démontrable. |
| Maîtrise et compréhension             | **8**  | Capacité à expliquer une fonction, une règle, un mapping ou un choix de design ; compréhension des dépendances du projet.                              |
| Oral individuel                       | **5**  | Réponse précise à une question individuelle ; vocabulaire, argumentation, recul critique.                                                              |
| Autonomie, engagement, itération      | **4**  | Implication pendant les 3 jours, résolution de problèmes, prise en compte des critiques, capacité à avancer sans dépendance constante.                 |
| Documentation personnelle & intégrité | **3**  | Section « Contributions », déclaration IA si utilisée, sources, capacité à distinguer ce qui a été produit, adapté ou assisté.                         |
| **Total individuel**                  | **30** |                                                                                                                                                        |

### Calcul de la note

**NOTE FINALE / 20**(points projet /70 + points individuels /30) = total /100 ; note /20 = total ÷ 5

**Exemple :** projet commun = 58/70 ; étudiant A = 25/30 → 83/100 → **16,6/20**. Étudiant B du même groupe = 17/30 → 75/100 → **15/20**.

### Comment prouver votre contribution

*   Section **Contributions** du README, nominative et précise.
*   Versions, captures de travail, commits ou fichiers intermédiaires.
*   Capacité à ouvrir une partie du code ou du design et à l'expliquer.
*   Question individuelle pendant la soutenance.
*   Observation du travail pendant le workshop.

**Pas de « passager invisible ».**Le fait qu'un groupe produise une excellente œuvre ne suffit pas à garantir la même note à tous. Une contribution non démontrée ou une incapacité à expliquer son propre rôle fait baisser la partie individuelle.

### Fiche individuelle à remplir avant la soutenance

**Nom / Prénom**

**Groupe / Projet**

**Mes 3 contributions principales**

**Une décision de design que je peux défendre**

**Une décision technique / algorithmique que je peux expliquer**

**Une difficulté rencontrée et comment je l'ai résolue**

**IA utilisée ? Si oui, pour quoi ?**

### Échelle qualitative

| Total  | Lecture                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------ |
| 90–100 | Projet exemplaire : traduction précise, système robuste, choix argumentés, exposition maîtrisée. |
| 80–89  | Très bon : cohérent et abouti, quelques limites secondaires.                                     |
| 70–79  | Bon : concept lisible, prototype fonctionnel, documentation correcte.                            |
| 60–69  | Fragile mais valide : relation source → système présente, exécution ou argumentation limitée.    |
| <60    | Insuffisant : source non établie, grammaire faible, prototype non fonctionnel ou non explicable. |

13 / ÉTHIQUE, DROITS, IA & ACCESSIBILITÉ

## Créer à partir du patrimoine implique des responsabilités

### Provenance

*   Nommer précisément la source utilisée.
*   Conserver l'URL, la référence, la date d'accès et, si disponible, l'auteur / institution.
*   Ne pas confondre disponibilité en ligne et liberté de réutilisation.
*   Pour une photographie ou archive, vérifier les conditions de réutilisation.

### Contextualisation

Un patrimoine n'est pas un simple stock de motifs. Certains objets, images ou mémoires nécessitent une contextualisation particulière. Votre projet doit éviter de transformer une source sensible en décor sans justification.

### IA générative : usage autorisé sous déclaration

**Règle du module**Un assistant IA peut être utilisé comme tuteur de code, aide au débogage, brainstorming ou reformulation. Il ne remplace ni la recherche patrimoniale ni la compréhension du code. Toute information historique doit être vérifiée. Toute portion substantielle de code générée par IA doit pouvoir être expliquée par l'équipe. Une note « AI usage » de 3 à 5 lignes est ajoutée au README si l'IA est utilisée.

#### Exemple de déclaration

```
## AI usage
Nous avons utilisé un assistant IA pour :
- identifier une erreur de boucle dans sketch.js ;
- proposer trois manières de normaliser la vitesse du vent.
Nous avons réécrit et testé le code final. Les informations historiques
sur la source ont été vérifiées sur Nantes Patrimonia.
```

### Droit à l'image et webcam

Si votre œuvre utilise une webcam, privilégiez l'analyse en temps réel sans enregistrement. Toute captation identifiable de personnes suppose un cadre de consentement adapté.

### Accessibilité

*   Contraste suffisant pour les informations de médiation.
*   Pas de flashs rapides.
*   Alternative clavier/touch si l'interaction principale exclut certains gestes.
*   Version fonctionnelle sans audio si le son n'est pas nécessaire.
*   Temps de compréhension raisonnable : le visiteur doit pouvoir essayer avant votre explication.

14 / ROBUSTESSE & DEBUG

## Un prototype exposable doit survivre au réel

### La méthode de réduction

1.  Reproduire le bug.
2.  Lire la console.
3.  Isoler le sous-système : dessin / data / interaction / asset.
4.  Revenir à la dernière version stable.
5.  Désactiver la couche la plus récente.
6.  Tester une hypothèse à la fois.

### Checklist de robustesse

| Test                                                        | Oui / non |
| ----------------------------------------------------------- | --------- |
| Le projet se relance après un refresh.                      | □         |
| Le projet affiche quelque chose sans API.                   | □         |
| Les assets utilisent des chemins relatifs.                  | □         |
| Aucune clé privée n'est dans le code.                       | □         |
| Un reset est disponible.                                    | □         |
| Le plein écran 1920×1080 est testé.                         | □         |
| La console ne produit pas d'erreur continue.                | □         |
| La version finale est sauvegardée dans un dossier distinct. | □         |

### Pattern de fallback

```
let state = {
  source: "fallback",
  value: 0.5
};

async function loadExternalData() {
  try {
    const r = await fetch("...");
    if (!r.ok) throw new Error("API error");
    const json = await r.json();
    state.source = "live";
    state.value = /* parse json */;
  } catch (e) {
    state.source = "fallback";
    state.value = 0.5;
  }
}
```

**Règle d'exposition**La version finale doit pouvoir être montrée même si le réseau tombe. L'évaluation ne dépend jamais d'une API distante.

15 / ANNEXES & STARTERS

## Templates de travail

### A. Starter HTML p5.js

```
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>PXE_NTE001</title>
  <style>
    html,body{margin:0;background:#000;overflow:hidden}
    canvas{display:block}
  </style>
</head>
<body>
  <script src="https://cdn.jsdelivr.net/npm/p5@1.11.11/lib/p5.min.js"></script>
  <script src="sketch.js"></script>
</body>
</html>
```

Pour une version totalement hors ligne, téléchargez une copie locale de p5.js et remplacez le CDN par un fichier local.

### B. Starter sketch.js

```
let params = {
  moduleSize: 36,
  spacing: 10,
  angle: 0.12,
  density: 16
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
}

function draw() {
  background(244, 241, 233);
  drawSystem();
}

function drawSystem() {
  // 1. appliquer la grammaire
  // 2. lire data / interaction si nécessaire
  // 3. rendre l'œuvre
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
```

### C. Manifest minimal

```
{
  "framework": "PATRIMOINE.EXE",
  "edition": "NTE001",
  "city": "Nantes",
  "host": "ESD Nantes",
  "dates": ["2026-11-09", "2026-11-10", "2026-11-12"],
  "project_title": "",
  "authors": [],
  "heritage_source": {
    "title": "",
    "url": "",
    "rights": ""
  },
  "mode": ["generative"],
  "stack": ["p5.js"],
  "data_sources": [],
  "ai_usage": "",
  "version": "1.0"
}
```

### D. Questions de soutenance

1.  Quelle propriété de la source avez-vous volontairement laissée de côté ?
2.  Quelle règle est la plus importante dans votre système ?
3.  Quel paramètre a le plus d'effet perceptuel ?
4.  Pourquoi votre mapping est-il pertinent ?
5.  Que se passe-t-il si le réseau disparaît ?
6.  Quelle itération a réellement amélioré le projet ?
7.  Que changeriez-vous avec une semaine supplémentaire ?
8.  Quelle partie du projet serait publiable telle quelle et laquelle demanderait une vérification de droits ?

### E. Glossaire

Algorithme

Suite de règles ou d'opérations permettant de produire un résultat.

API

Interface permettant à un programme de demander des données ou services à un autre système.

Dataset

Ensemble structuré de données.

Fallback

Comportement de secours lorsque la ressource principale est indisponible.

Feedback

Réponse perceptible du système après une action ou un changement d'état.

Grammaire

Ensemble de primitives, relations, invariants et variables décrivant la logique d'une source.

Invariant

Propriété qui ne change pas dans le système.

Mapping

Relation entre une entrée et un ou plusieurs paramètres de sortie.

Noise

Fonction de bruit continu utile pour produire des variations corrélées.

Paramètre

Valeur modifiable contrôlant le comportement d'un système.

Provenance

Informations permettant de retracer l'origine et le contexte d'une source.

Seed

Valeur initiale permettant de reproduire une séquence pseudo-aléatoire.

16 / RÉFÉRENCES

## Pour aller plus loin

### Design, interaction et creative coding

*   Norman, D. — *The Design of Everyday Things*.
*   Reas, C. & Fry, B. — *Processing: A Programming Handbook for Visual Designers and Artists*.
*   Buxton, B. — *Sketching User Experiences*.
*   Munzner, T. — *Visualization Analysis and Design*.
*   Shneiderman, B. — « Direct manipulation: A step beyond programming languages ».
*   Weiser, M. — « The Computer for the 21st Century ».

### Documentation technique officielle

*   p5.js Reference — référence officielle des fonctions p5.js.
*   Open-Meteo API Documentation — variables météo, paramètres et réponses JSON.
*   Open Data Nantes Métropole — portail officiel des données publiques.
*   Nantes Métropole — API Explore v2.1.
*   Nantes Patrimonia — site de la Ville de Nantes, Direction du patrimoine et de l'archéologie, en lien avec les Archives de Nantes.

**À retenir**Votre projet sera évalué sur la qualité du passage entre **source, grammaire, système et œuvre**. Le code, les données et l'interaction servent cette relation. Ils ne la remplacent pas.

PATRIMOINE.EXE / NANTES 001 — Livret étudiant — ESD Nantes — B3 Design — 9, 10 & 12 novembre 2026 — Intervenant : Kamel Ghabte.