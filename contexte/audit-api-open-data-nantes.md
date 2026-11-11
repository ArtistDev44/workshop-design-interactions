# Audit — API Open Data Nantes Métropole pour PATRIMOINE.EXE / NTE001

Audit réalisé le 9 novembre 2026 sur le portail [data.nantesmetropole.fr](https://data.nantesmetropole.fr/explore/), filtre « Analyse / API » (`refine.features=analyze`), territoire Nantes Métropole. Les chiffres viennent de l'API catalogue elle-même (`/api/explore/v2.1/catalog/datasets`), pas d'une lecture manuelle de la page. Chaque endpoint recommandé a été appelé pour vérifier qu'il répond.

Rappel de la chaîne du livret : **source → grammaire → système → œuvre**. Une API n'a sa place que si son mapping se justifie en une phrase. Ce document sert à choisir, pas à tout brancher.

## 1. Combien d'API ?

| Mesure | Nombre |
|---|---|
| Jeux de données publiés sur le portail | 592 |
| Jeux interrogeables par API (filtre « analyze » de la page auditée) | **570** |
| Jeux annoncés « continuelle » ou « quotidienne » | 28 |
| Flux réellement temps réel **et à jour** le 9 nov. 2026 | **≈ 13** |
| Recommandés pour le projet (voir § 3) | **5 temps réel + 4 patrimoniaux** |

Une seule API technique sert les 570 jeux : l'API **Opendatasoft Explore v2.1**. On n'apprend donc qu'une URL :

```
https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/{dataset_id}/records?select=…&where=…&limit=…
```

Répartition par thème : Citoyenneté / Institution 352 (surtout élections et délibérations, peu utile ici) · Mobilité 88 · Urbanisme / Logement 54 · Environnement 34 · Territoires 22 · Culture / Tourisme 7.

## 2. Ce que les tests ont montré

- **Aucune clé requise**, réponse en JSON.
- **CORS ouvert** (`Access-Control-Allow-Origin: *`) : un sketch p5.js ou une page Astro peut appeler l'API directement depuis le navigateur, sans serveur intermédiaire.
- **Quota : 10 000 requêtes par jour** (en-têtes `X-RateLimit-*`, remise à zéro à minuit UTC). C'est large, à condition de ne pas interroger l'API à chaque frame de `draw()`.
- Certains jeux sont annoncés « continuelle » alors qu'ils sont **morts** ou vides. À éviter (§ 4).

## 3. API recommandées

### 3.1 Temps réel : la ville qui respire

| # | Jeu (`dataset_id`) | Données utiles | Fréquence observée | Pourquoi pour PATRIMOINE.EXE |
|---|---|---|---|---|
| T1 | `244400404_parkings-publics-nantes-disponibilites` | `grp_nom`, `grp_disponible`, `grp_exploitation`, `location` (27 parkings) | quelques minutes | Contient le parking **FEYDEAU**, ainsi que Commerce, Graslin, etc. : le taux de remplissage autour des sites du corpus (Île Feydeau, Pommeraye) peut moduler la densité d'une grammaire. |
| T2 | `244400404_disponibilite-temps-reel-velos-libre-service-naolib-nantes-metropole` | `available_bikes`, `bike_stands`, `position` (120 stations) | quelques minutes | 120 points géolocalisés qui se vident et se remplissent : un rythme urbain lisible, idéal pour une grammaire de modules ou de pulsation. |
| T3 | `244400404_fluidite-axes-routiers-nantes-metropole` | `etat_trafic`, `mf1_vit`, `mf1_debit`, `geo_shape` (889 tronçons) | environ 5 min | Donne des **lignes** (géométries) et non des points : on peut redessiner le tracé des axes, et faire varier le trait selon la vitesse. |
| T4 | `323266205_indice-atmo-nantes-metropole` | `lib_qual`, `code_qual`, **`coul_qual`** (couleur officielle), `lib_zone` | quotidienne | Fournit déjà une palette officielle : un paramètre de couleur justifié par la source, sans rien inventer. |
| T5 | `323266205_alerte-pollens-nantes` | `name`, `group` (Arbre / Herbacée), `lib_etat` | quotidienne | Se croise avec le **patrimoine arboré** (§ 3.2) : quelles espèces émettent aujourd'hui. |

Autres options, à garder en réserve : `244400404_comptages-velo-nantes-metropole` (les colonnes `00`…`23` donnent un profil horaire par compteur, une vraie matière rythmique ; mise à jour quotidienne), `244400404_itineraires-nantes-metropole-temps-parcours`, `244400404_parcs-relais-nantes-metropole-disponibilites`, `244400404_alertes-notifications-nantes-metropole`, `244400404_agenda-evenements-nantes-metropole_v2`. Hors portail, la météo reste plus simple via Open-Meteo (déjà référencé dans `notes.md`).

### 3.2 Patrimoine : la source réelle

Ces jeux ne bougent pas en temps réel, et c'est justement leur rôle : ils sont la **source** de la chaîne.

| # | Jeu | Volume | Lien au corpus Nantes 001 |
|---|---|---|---|
| P1 | `244400404_patrimoine-arbore-nantes-metropole` | 124 583 arbres (genre, espèce, hauteur, année de plantation, position) | **Patrimoine arboré**, cité explicitement dans le corpus du livret |
| P2 | `244400404_inventaire-collections-musee-arts-nantes` | 7 234 œuvres (titre, auteur, date, domaine, technique, dimensions) | Inventaire local, source institutionnelle |
| P3 | `244400404_occupation-sol-{1952…2022}-niveau-3-nantes-metropole` | 13 photographies du territoire en polygones, de 1952 à 2022 | Transformation des **chantiers navals / Île de Nantes**, avant et après |
| P4 | `244400404_parcs-jardins-nantes` | 135 parcs | Complète P1, échelle lisible |

Pour P1 (124 000 lignes), **ne jamais tout télécharger dans le navigateur**. Il vaut mieux demander un agrégat à l'API, par exemple :
`…/records?select=lib_genre,count(*) as n&group_by=lib_genre&order_by=n desc&limit=20`

### 3.3 Combinaisons qui tiennent la chaîne

- **Arbres × pollens** : la grammaire vient de l'arbre (branches, axes, symétries). P1 donne les espèces réelles, T5 décide lesquelles « s'activent » aujourd'hui.
- **Feydeau × parkings** : la grammaire vient des mascarons ou de la trame de l'île. T1 module la densité ou l'ouverture des modules selon l'occupation du parking FEYDEAU.
- **Sol 1952 → 2022** : la grammaire vient des parcelles. Le temps de l'œuvre parcourt 70 ans d'occupation du sol, et le temps réel n'est pas nécessaire.

## 4. À éviter

| Jeu | Raison |
|---|---|
| `…stations-velos-libre-service…-disponibilites` (« [Ancien] », JCDecaux) | Remplacé par T2, dernière mise à jour en juillet 2025 |
| `…velos-libre-service-naolib-gbfs` | Figé depuis juin 2024 |
| `…capteurs-ondes-electomagnetiques…` | Annoncé « continuelle », mais dernières valeurs en 2022 et 1,27 M de lignes |
| `…alertes-info-trafic…` | 0 enregistrement |
| `…base-sirene-entreprises…` | 438 000 lignes, aucun lien patrimonial |
| Élections, marchés publics, délibérations (≈ 350 jeux) | Hors sujet pour une œuvre patrimoniale |

## 5. Architecture du site proposée

Elle reste dans le cadre des prompts (Astro statique, GitHub Pages, aucune dépendance au réseau pour l'évaluation) et y ajoute une couche « données » propre.

```
src/
  lib/
    nantes-api.js        ← UNE seule fonction d'accès aux données
    datasets.js          ← liste des jeux retenus (id, select, TTL, mapping en une phrase)
  pages/
    index.astro          ← accueil de l'édition (prompt 05)
    [slug].astro         ← cartel + œuvre (prompt 08)
    donnees.astro        ← « Nantes en direct » : une fiche par API (source, licence, fréquence, mapping)
public/
  data/fallback/{dataset_id}.json  ← instantanés locaux, régénérés par script
  oeuvres/{slug}/                  ← sketchs p5.js des groupes (index.html, sketch.js, data/fallback.json)
scripts/
  snapshot.mjs           ← télécharge un échantillon de chaque jeu → public/data/fallback/
```

**Flux d'une donnée :**

1. La page appelle `getDataset(id)`.
2. Si un résultat récent est en cache (`localStorage`, durée de vie définie par jeu), il est utilisé directement.
3. Sinon, l'API est appelée avec `select` et `limit` (pour ne prendre que les champs utiles) et un délai maximal de 5 s.
4. En cas d'échec (réseau, quota, panne), le site charge `public/data/fallback/{id}.json`. Il affiche toujours quelque chose et indique « données locales du JJ/MM ».

**Fréquences de rafraîchissement conseillées** (budget pour un écran d'exposition allumé 24 h) :

| Jeu | Rafraîchir toutes les | Requêtes / jour |
|---|---|---|
| T1 parkings, T2 vélos | 5 min | 2 × 288 = 576 |
| T3 fluidité | 6 min | 240 |
| T4 ATMO, T5 pollens | 1 fois par chargement + 6 h | < 10 |
| P1–P4 patrimoine | jamais en direct : instantané au build | 0 |

Total : environ 830 requêtes par jour, moins de 10 % du quota. Même avec 10 visiteurs en parallèle, la marge reste confortable.

**Présentation sur le site :**

- Chaque œuvre affiche sur son cartel un **badge de source** : « Données en direct · parkings Nantes Métropole · mis à jour il y a 3 min », ou « Données locales du 12/11 ».
- La page `/donnees/` reprend la logique de la fiche-source du livret : pour chaque API, le titre, le producteur, la licence (Licence Ouverte ou ODbL), la fréquence, les champs utilisés et **la phrase de mapping**. C'est la partie « Data / interaction / mapping » du barème (10 points), rendue visible.
- Les sketchs p5.js lisent les données **une fois** dans `setup()`, puis sur un minuteur (`setInterval`), **jamais dans `draw()`**.

## 6. Économiser les tokens de l'abonnement Claude

Point important : **les API ne consomment aucun token**. Une fois le site en ligne, c'est le navigateur du visiteur qui interroge Nantes Métropole, et Claude n'intervient plus. Les tokens partent uniquement pendant le développement avec l'assistant. Voici ce qui coûte cher et comment l'éviter.

| Ce qui coûte | Ordre de grandeur | À faire à la place |
|---|---|---|
| Faire lire à Claude une réponse d'API complète | 1 000 lignes JSON ≈ 30 000 à 100 000 tokens | Toujours demander `limit=1` ou un `select` sur quelques champs pour voir la structure. C'est ce qui a été fait pour cet audit. |
| Faire relire le livret complet à chaque prompt | ≈ 11 000 tokens par lecture (44 Ko) | Créer un `CLAUDE.md` court à la racine (règles + chaîne + stack, 1 page), qui ne renvoie au livret qu'en cas de besoin |
| Lire `design-system/index.html` (page scrapée) | ≈ 4 000 tokens | Utiliser `design-system/index.md`, déjà résumé en tokens |
| Enchaîner les 12 prompts dans une même conversation | Le contexte grossit à chaque étape | Une conversation par prompt, ou `/clear` entre deux prompts, puisque le dépôt garde la mémoire |
| Générer les instantanés JSON avec Claude | Tout le JSON passe dans le contexte | `node scripts/snapshot.mjs`, que vous lancez vous-mêmes |
| Faire vérifier visuellement chaque modification (captures d'écran) | Une image ≈ 1 500 tokens, souvent répétée | `npm run build` pour vérifier, une seule capture à la fin |
| Utiliser le plus gros modèle pour du travail mécanique | — | Modèle plus léger (Sonnet / Haiku) pour la structure de dossiers ou les configs ; modèle principal pour la grammaire et le mapping |

Autres règles simples :

- Désigner les fichiers **par leur chemin** (« lis `todo.md` § Phase 2 ») plutôt que de les coller dans le chat.
- Interdire à l'assistant de lire `public/data/fallback/` : ces fichiers sont générés et sans intérêt pour lui. C'est possible via une règle `deny` dans `.claude/settings.json`.
- Une demande = un objectif vérifiable : les demandes vagues provoquent des allers-retours coûteux.

## 7. Décisions à prendre par le groupe

1. Quelle **source patrimoniale** (P1 à P4, ou une autre du corpus) ? Elle commande tout le reste.
2. **Zéro ou une** API temps réel (T1 à T5) ? Le livret accepte un projet purement génératif si le mapping n'est pas justifiable.
3. ~~Intégrer `src/lib/nantes-api.js`, `scripts/snapshot.mjs` et la page `/donnees/` aux prompts~~ : fait, voir `prompts/11-donnees-vivantes-nantes.md`.

## 8. Prompt 90 — sources « en direct » du téléphone (vérifiées le 11/11/2026, `limit=1` + `select`)

| Source | Jeu de données | Requête utilisée | Champs vérifiés | Fréquence d'appel dans le jeu |
|---|---|---|---|---|
| Parkings | `244400404_parkings-publics-nantes-disponibilites` (27) | `limit=1&select=grp_nom,grp_disponible,grp_horodatage&order_by=grp_disponible desc` | `grp_nom`, `grp_disponible`, `grp_horodatage` (ISO) | au clic sur le téléphone, 1 fois / 10 min au plus |
| Vélos | `244400404_disponibilite-temps-reel-velos-libre-service-naolib-nantes-metropole` (120) | `limit=1&select=name,available_bikes,last_update` | `name`, `available_bikes` (texte), `last_update` (ISO) | idem |
| Trafic routier | `244400404_fluidite-axes-routiers-nantes-metropole` (889) | `select=etat_trafic,count(*) as n&group_by=etat_trafic&limit=10` | `etat_trafic` (Fluide, Dense, Bloqué, Indéterminé) ; pas d'heure dans l'agrégat → heure de consultation | idem |
| Pollens | `323266205_alerte-pollens-nantes` (15) | `limit=1&select=name,lib_etat,state&order_by=state desc` | `name`, `lib_etat`, `state` ; **pas de champ de date** (`date_maj` n'existe pas) → heure de consultation | idem |

Règles : délai 6 s, cache en mémoire, échec ou champ absent → la source n'est pas proposée ; jamais d'appel dans
`draw()` ; ces données ne s'affichent qu'en mode « Aujourd'hui » ou dans l'onglet « En direct aujourd'hui » du
téléphone, avec « Données d'aujourd'hui, pas de la semaine jouée » pendant une semaine archivée. Volume : au plus
4 requêtes par tranche de 10 minutes et par joueur, aucun quota ni clé.
