# Prompt 223 — Jeu : des répliques adaptées à la question du plaignant

Origine : demande du 15/11/2026 (« pour l'application, certaines questions n'ont pas de réponses spécifiques adaptées
dans certains cas »). Statut : **exécuté le 15/11/2026**.

## Constat (sondage des dossiers des semaines jouables, Chromium)

Les trois répliques d'un dossier (`panneau.js`, `repliqueDe`) ne dépendent que de la **catégorie** du dossier (retard,
travaux, affluence, météo, accident, sécurité) et de l'action. La **question** du plaignant (`data/messages.json`) n'est
pas lue. Exemples relevés :

- « Je me déplace en fauteuil : comment rentrer après « Exposition … » ? » → « On vous envoie une équipe pour canaliser
  la foule aux arrêts. »
- « Après « … », les rames risquent d'être pleines de déchets » → « Plus de véhicules vont passer. »
- « Je lis « événement » sur l'écran mais je ne comprends pas ce que ça change pour moi » → « Navette de remplacement
  en route » ; et toute perturbation reçoit des répliques sur « les travaux », même quand sa nature est « événement »,
  « manifestation » ou « mouvement social ».
- « Il pleut et mon arrêt n'a toujours pas d'abri » (plainte « * » des jours de pluie) → répliques de la catégorie du
  dossier, sans rapport.
- « Je n'ose plus prendre le tram le soir. Qu'est-ce que vous faites ? » (après un incident) → « Éloignez-vous… on arrive. »

## À faire

1. **Thème** de la plainte, dans les données (`messages.json`, champ `theme`, documenté dans `_lisezMoi`) : `accessibilite`,
   `vehicule` (propreté, sol glissant, clim, annonces), `info` (comprendre, horaires, appli), `itineraire` (par où
   passer, arrêt déplacé, comment rentrer, correspondance), `abri` (attente dehors), `tarif`, `rassurer` (peur après un
   incident), `justificatif` (retard à justifier). Les autres plaintes restent sans thème.
2. **Répliques par thème** (`repl.theme.<thème>.<famille>.<n>`, FR + EN) pour les 4 familles d'action (renfort, retenir,
   dévier / informer, attendre) : la réplique répond à la question **et** décrit l'action réellement jouée (effets
   inchangés). Un thème ne s'applique qu'aux catégories où ses répliques restent vraies (`rassurer` : sécurité seulement ;
   jamais accident).
3. **Perturbation qui n'est pas un chantier** (catégorie « travaux », nature sans « travaux » ni « chantier ») : répliques
   `repl.perturbation.<id>.<n>` qui nomment la nature réelle au lieu des « travaux ».
4. Ordre : thème → perturbation → réplique de la catégorie (inchangée) ; le clash reste celui de la catégorie.
5. Aucun fait inventé (pas de nom de titre de transport, de service ou d'horaire qui n'existe pas dans les données).

## Vérification

`npm run build`, `npm test` : chaque plainte à thème a, pour chaque catégorie où elle peut tomber, une réplique de thème
pour chacune des 4 familles (FR + EN, mêmes variables) ; sondage Chromium avant / après (dossiers des semaines jouables) ;
audit des textes à 0 en 1920 × 1080, 1366 × 768, 412 × 915.

## Fait

- `data/messages.json` : champ `theme` sur 39 plaintes (accessibilite 5, vehicule 5, info 9, itineraire 7, abri 6,
  tarif 1, rassurer 2, justificatif 4) ; documenté dans `_lisezMoi` ; `messages.js` régénéré.
- `game.js` : `Jeu.plaignantPour` rend le thème ; une plainte générale (« * » : pluie, abri…) n'est plus tirée sur un
  dossier de sécurité ou d'accident.
- `panneau.js` : `THEMES_REPLIQUES` (catégories où chaque thème reste vrai) et `prefixesReplique` — ordre : réplique du
  thème (`repl.theme.<thème>.<réponse>.1`), puis perturbation sans chantier (`repl.perturbation.<réponse>.<n>`, et
  `clash.perturbation.<n>` pour le clash), puis la réplique de la catégorie, inchangée.
- `i18n.js` : 63 répliques de thème + 8 de perturbation + 2 clashs, FR + EN, sans variable inventée (aucun nom de titre,
  de service ou d'horaire qui n'est pas dans les données).
- Hors champ : un dossier classé « accident » (mots du texte réel) garde les répliques d'accident, quel que soit le thème.

## Vérifié

- `npm run build`, `npm test` (+5 contrôles : chaque plainte à thème a, pour chaque catégorie où elle peut tomber —
  jour de forte pluie compris —, une réplique de thème pour chacune des réponses, FR + EN, mêmes variables).
- Sondage Chromium des dossiers des semaines jouables, avant / après. Exemples après :
  « Je me déplace en fauteuil… » → « Des agents seront sur le quai pour organiser la montée et vous aider à monter. » ;
  « …les rames risquent d'être pleines de déchets » → « On ajoute des passages, et les rames seront nettoyées et
  vérifiées entre deux services. » ; perturbation « manifestation » → « Concrètement : votre ligne contourne la zone… »,
  clash « « manifestation », et alors ? … » (plus de « travaux »).
