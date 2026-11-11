# Prompt 90 — Jeu « Nantes en régulation » : des notifications variées sur le téléphone

Demande d'origine (11/11/2026) :

> Je souhaite un prompt diversifiant les notifications reçues sur le téléphone.

Objectif : le téléphone de la pièce devient un **vrai fil de notifications vivant**. Aujourd'hui, il
n'affiche que les événements de l'Agenda (prompt 38) au clic, plus les conversations scénarisées
(Camille à l'intro, le patron en début de semaine, prompts 41 et 42).

Ce prompt :
- ajoute **plusieurs sources de notifications**, réelles ou issues de la partie ;
- les fait **arriver d'elles-mêmes** au cours de la journée, avec mesure ;
- les **range par appli** ;
- rend certaines **utiles au jeu**.

Le tout sans rien inventer et sans surcharger le joueur.

Règles absolues :
- **Rien n'est inventé côté données.**
  - Chaque notification vient d'une **source réelle** (Open Data Nantes Métropole, Open-Meteo, Hub'Eau,
    données déjà chargées) **ou de la partie** (décisions, jauges, équipes, plaintes), et l'indique.
  - Pas de faux fait sur Nantes.
- **Pas de mélange de dates.**
  - Une donnée **temps réel du jour** (parkings, vélos, trafic routier, pollens) ne s'affiche **jamais**
    comme si elle datait de la semaine archivée jouée.
  - Ces sources ne servent qu'en mode « Aujourd'hui, en temps réel », ou dans une rubrique explicitement
    titrée « En direct aujourd'hui » avec l'heure du relevé.
- **Appels réseau sobres** :
  - `limit` et `select` minimaux ;
  - au clic sur le téléphone, ou au plus une fois par source toutes les 10 min réelles ;
  - délai maximal de 6 s ;
  - cache ;
  - repli local, ou source absente : elle n'est alors pas proposée.

  Jamais d'appel dans `draw()`. Aucun secret ni clé.
- **Personnes** : seulement les personnages du jeu (Camille, le patron, des usagers à pseudonyme fictif,
  des chauffeurs sans nom). Pas de personne réelle, pas de vie privée inventée.
- Design system (pixel, prompt 39), FR + EN, contraste ≥ 4,5:1, clavier seul, `prefers-reduced-motion`,
  aucun flash, mobile.

## 0. Point de départ : lire le code existant avant toute modification

Fichiers concernés :
- `site/public/` : `telephone.js` (agenda, `TEL`, `chargerNotifications()`, `contenuNotifications()`,
  `ouvrirTelephone()`), `telephone-main.js` (téléphone en main, `lancerConversation()`), `multitache.js`
  (notifications de bureau, prompt 77), `bureau.js` (objet téléphone sur le bureau), `confort.js` / son,
  `i18n.js`, `sauvegarde.js`, `data/loire.json` (Hub'Eau, prompt 34), `data/semaines.js` (agenda,
  changelog et météo des semaines) ;
- `site/scripts/test-jeu.mjs` ;
- une mise à jour de `jeu/`, `prompts/README.md`, `journal.md` et, si une source est ajoutée,
  `contexte/audit-api-open-data-nantes.md`.

Repérer, sans rien supposer :
- **Le chargement de l'Agenda** : URL Explore v2.1, cache par date, repli `notifsRepli()`.
- **L'animation du téléphone en main** et son contenu sous forme de fonction.
- **Les notifications de bureau** du prompt 77 : ne pas les doubler, voir § 3.
- **Les données déjà chargées par la partie** : météo du jour, changelog, agenda, Loire.

Si les prompts suivants sont exécutés, s'aligner sur eux :
- 68 : équipes ;
- 84 : avertissements ;
- 85 : compte Community ;
- 86 : patron ;
- 87 : sans chrono, panneau ouvert ;
- 88 : thèmes du jour, tâches, badges.

## 1. Sources de notifications (une « appli » du téléphone par source)

| Appli du téléphone | Source | Exemples (construits sur la donnée réelle) | Disponibilité |
|---|---|---|---|
| **Agenda** (existant) | Agenda des événements Nantes Métropole | « Ce soir : concert — Zénith, Saint-Herblain » | toujours (API ou repli de la semaine) |
| **Météo** | Open-Meteo (déjà chargé, jour joué) | « Rafales jusqu'à 54 km/h aujourd'hui », « 12 mm de pluie attendus » | toujours ; seulement si un seuil est franchi (pluie ≥ 1 mm, rafales ≥ 40 km/h, gel) |
| **Info travaux** | changelog GTFS (déjà chargé) | « Travaux annoncés sur la ligne 3 à partir du 16/09 » | semaines archivées et fallback |
| **Loire** | Hub'Eau, `data/loire.json` (prompt 34) | « La Loire à 2,1 m au pont Anne-de-Bretagne (relevé 14 h) » | seulement si la date jouée est dans la période des relevés ; sinon pas de notification |
| **Parkings** | Open Data `244400404_parkings-publics-nantes-disponibilites` | « Parking Feydeau : 12 places libres » | **en direct aujourd'hui** uniquement (§ 0) |
| **Vélos** | Open Data `244400404_disponibilite-temps-reel-velos-libre-service-naolib-nantes-metropole` | « Station Commerce : 2 vélos disponibles » | **en direct aujourd'hui** uniquement ; pas de marque ni de logo |
| **Trafic routier** | Open Data `244400404_fluidite-axes-routiers-nantes-metropole` | « Trafic dense sur 18 tronçons du centre » | **en direct aujourd'hui** uniquement |
| **Pollens** | Open Data `323266205_alerte-pollens-nantes` | « Pollens de bouleau : alerte élevée » | **en direct aujourd'hui** uniquement |
| **Messages** | partie : Camille (collègue), chauffeurs (sans nom) | « Camille : le patron passe vers 15 h », « Chauffeur ligne 2 : on est bloqués à Commerce » si un dossier réel le justifie | toujours, rattaché à un fait de la partie |
| **Régul'** (alertes de jeu) | partie | jauge sous 30, objectif du jour atteint, équipe arrivée sur place, plainte en attente, badge obtenu (88) | toujours |
| **Quai** (compte social, si le prompt 85 est exécuté) | partie | « 3 nouvelles mentions sur @regul.nte » | si le prompt 85 est exécuté |
| **Rappels** | partie | « Fin de service à 18 h », « Réunion : rapport du soir (88) » | toujours |

Règles de contenu :
- Les **noms et identifiants des jeux de données** sont à vérifier dans l'audit
  (`contexte/audit-api-open-data-nantes.md`), en échantillonnant avec `limit=1` et `select`. Un champ
  absent → la notification n'est pas créée.
- Chaque notification porte sa **source** et l'**heure** : heure de jeu pour la partie, heure réelle du
  relevé pour le direct.
- **3 variantes de texte au moins** par type de notification, tirées par hachage de la graine (comme au
  prompt 74), pour éviter les phrases répétées.
- **Messages de Camille et des chauffeurs** : modèles courts dans `data/messages.json` (même validation
  que le prompt 28, FR + EN), déclenchés uniquement par un fait réel de la partie, par exemple un dossier
  sur cette ligne ou une inspection prévue. Ils restent **professionnels** : pas de vie privée inventée.

## 2. Arrivée des notifications au fil de la journée

- **Spontanées** : en plus du clic, les notifications arrivent d'elles-mêmes pendant la journée.
  - Le téléphone **vibre** sur le bureau : petit tremblement pixel de 2 px, fixe si les animations sont
    réduites.
  - Son écran s'allume avec la notification résumée.
  - Une **pastille** donne le nombre de notifications non lues.
- **Rythme maîtrisé** :
  - au plus **1 notification spontanée toutes les 20 minutes de jeu** ;
  - **6 à 10 par journée** ;
  - réparties sur le matin, le midi, l'après-midi et le soir ;
  - **jamais pendant un panneau de décision ouvert** (prompt 87) : elles attendent la fermeture.
- **Priorités** : alerte (jauge critique, avertissement) > partie (équipe, plainte) > info réelle (météo,
  travaux, Loire, agenda) > ambiance (pollens, vélos).
  - Quand plusieurs notifications arrivent ensemble, n'afficher que la plus prioritaire.
  - Les autres sont **regroupées** : « +2 autres ».
- **Mode Ne pas déranger** : interrupteur sur le téléphone, et réglage dans les Paramètres. Seules les
  alertes passent.
- **Pas de doublon avec le bureau** (prompt 77) :
  - une information affichée en notification de bureau ne revient pas en spontané sur le téléphone ;
  - elle reste en revanche dans le **centre de notifications** du téléphone.

## 3. Le téléphone en main : écran de verrouillage et centre de notifications

Au clic sur le téléphone, ou avec la touche dédiée (sans collision), l'animation du prompt 42 s'ouvre sur
un **écran de verrouillage** :
- heure de jeu et date (longue, langue active) ;
- fond pixel selon la météo et l'heure du jour joué : pluie, nuit ;
- notifications **groupées par appli**, avec l'icône pixel de chaque appli (dessins originaux 16×16,
  ×2), la plus récente en haut ;
- **pile dépliable** par appli : clic ou Entrée.

Actions sur une notification :
- **Ouvrir** : mène à l'appli du PC concernée (Signalements, Patron, Community, Journal) ou à la fiche
  du signalement lié.
- **Ignorer** : glisser au doigt, ou Suppr au clavier.
- **Tout effacer** pour un groupe.

Autres éléments :
- **Onglet « En direct »**, visible seulement si des sources temps réel ont répondu : parkings, vélos,
  trafic, pollens, chacun avec « relevé à HH:MM » et la mention « données d'aujourd'hui, pas de la
  semaine jouée » quand la partie est archivée.
- **Agenda du jour** : la liste existante (prompt 38), remise en forme en cartes.

Navigation clavier :
- ↑ ↓ entre les notifications ;
- Entrée pour ouvrir ;
- Suppr pour ignorer ;
- Échap pour reposer le téléphone.

`aria-live` annonce chaque notification spontanée, selon le réglage.

## 4. Des notifications utiles au jeu (sans donner la réponse)

Certaines notifications donnent un **avantage d'information** au joueur attentif :
- **Agenda** du soir → permet d'anticiper l'affluence (tâche « Préparer un événement » du prompt 88, si
  exécuté) ;
- **Météo** (rafales, pluie) annoncée le matin → les signalements météo de la journée sont moins
  surprenants ;
- **Travaux** → la catégorie « travaux » (prompt 87) est attendue ;
- **Message d'un chauffeur** → donne un détail réel du dossier en cours (ligne, lieu), comme la radio
  du prompt 63.

Limites :
- **Jamais de conseil d'action ni de réponse « juste »**, conformément aux prompts 50 et 66.
- Une notification lue au bon moment peut donner un **petit bonus** déjà prévu par les règles (par
  exemple l'info trafic révélée sans coût) ; sinon, aucun effet sur les jauges.
- Les notifications **ambiance** (pollens, vélos, parkings) n'ont **aucun effet de jeu**. Elles rendent
  la ville vivante.

## 5. Son, accessibilité, mobile, sauvegarde

- Son :
  - une vibration discrète et une sonnerie courte par catégorie (alerte, message, info) ;
  - le tout suit l'interrupteur Son (M) ;
  - Ne pas déranger coupe le son et la vibration visuelle.
- Accessibilité :
  - contraste ≥ 4,5:1 ;
  - aucune information par la couleur seule (icône + libellé) ;
  - `prefers-reduced-motion` : pas de vibration animée, l'écran s'allume sans transition ;
  - aucun flash.
- Mobile (prompt 60) : le téléphone s'ouvre en plein écran, cibles ≥ 44 px, glisser pour ignorer.
- Sauvegarde (prompt 33) :
  - notifications de la journée (lues, ignorées) ;
  - réglage Ne pas déranger ;
  - prochaines heures d'arrivée.

  Les données en direct ne sont **pas** sauvegardées : elles sont rechargées.

## 6. Textes (FR + EN, exemples de clés)

| Clé | Français | English |
|---|---|---|
| `tel.app.agenda` | Agenda | Calendar |
| `tel.app.meteo` | Météo | Weather |
| `tel.app.travaux` | Info travaux | Works |
| `tel.app.loire` | Loire | Loire |
| `tel.app.parkings` | Parkings | Car parks |
| `tel.app.velos` | Vélos | Bikes |
| `tel.app.trafic` | Trafic routier | Road traffic |
| `tel.app.pollens` | Pollens | Pollen |
| `tel.app.messages` | Messages | Messages |
| `tel.app.regul` | Régul' | Régul' |
| `tel.app.rappels` | Rappels | Reminders |
| `tel.direct` | En direct aujourd'hui · relevé à {heure} | Live today · read at {heure} |
| `tel.pasSemaine` | Données d'aujourd'hui, pas de la semaine jouée | Today's data, not from the week being played |
| `tel.autres` | +{n} autres | +{n} more |
| `tel.npd` | Ne pas déranger | Do not disturb |
| `tel.toutEffacer` | Tout effacer | Clear all |

## 7. Vérifications détaillées

- `npm run build` et `npm test` dans `site/`.
- `site/scripts/test-jeu.mjs` couvre :
  - chaque type de notification créé uniquement si sa donnée existe ;
  - **aucune donnée temps réel datée de la semaine archivée** ;
  - rythme (≤ 1 / 20 min de jeu, 6–10 par jour, aucune pendant un panneau ouvert) ;
  - priorités et regroupement ;
  - Ne pas déranger ;
  - pas de doublon avec les notifications de bureau ;
  - variantes reproductibles par la graine ;
  - sauvegarde et chargement.
- Appels réseau :
  - vérifier dans l'onglet réseau qu'aucune requête n'est lancée par image ;
  - `limit` / `select` minimaux, cache respecté ;
  - hors ligne : les sources temps réel disparaissent proprement, les autres restent.
- Partie réelle, en français puis en anglais, au clavier puis à la souris :
  - une journée complète : vibrations, écran de verrouillage, groupes par appli ;
  - ouvrir une notification vers la bonne appli ;
  - ignorer, tout effacer, Ne pas déranger ;
  - mode « Aujourd'hui » avec l'onglet En direct.
- Accessibilité :
  - clavier seul ;
  - `aria-live` ;
  - `prefers-reduced-motion` ;
  - aucun flash ;
  - 1920×1080 et mobile.
- Aucune régression des prompts 38, 41, 42 et 77, ni des prompts 84 à 89 s'ils sont exécutés.
- Documenter dans `jeu/NN-notifications-telephone.md` (numéro libre suivant dans `jeu/`) et ajouter la
  ligne au sommaire de `jeu/README.md`. Mettre à jour l'audit API si des jeux de données sont ajoutés
  (identifiant, champs, fréquence, quota).
- Branche `jeu/prompt-90-notifications-telephone`. À chaque push : entrée en tête de `journal.md`. Ne pas
  fusionner dans `main` sans demande.
