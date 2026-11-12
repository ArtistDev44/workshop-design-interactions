# Prompts 117 à 119 — clash, plaignants désagréables, incidents inventés rares

Date : 12/11/2026. Branche `jeu/117-119-clash-plaignants-incidents`.

## 117 — Trois répliques mélangées, dont un clash

- **Les trois répliques** (`reponsesDialogue`) : la meilleure réponse (`Jeu.meilleureReponse`, même calcul
  que le Journal), une autre réponse de la catégorie, et le **clash**.
  - Ordre mélangé de façon déterministe par dossier (6 permutations), même style pour les trois.
  - Touches 1 à 3. Le raccourci caché « 0 = attendre » est retiré.
- **Le clash :**
  - 3 variantes par catégorie, en FR et en EN (`clash.<catégorie>.1..3`) ;
  - insolent, sans rien de haineux, mots grossiers masqués (`&#@!`) ;
  - effet en jeu : « attendre » + **réputation −8** (`REGLAGES.malusClash`) ;
  - il compte toujours comme raté (`Jeu.evaluer`), la narration le dit, et le Journal l'affiche
    « Clasher le plaignant ».
- **Textes mis à jour** : aide, guide, tutoriel, bandeau d'état (« 1 à 3 »).

## 118 — Plaignants désagréables

- **8 plaintes au ton agressif** dans `data/messages.json` (`"ton": "agressif"`), en FR et en EN.
  - Mêmes conditions réelles que les autres : retard ≥ 10 ou ≥ 20 min, perturbation, travaux,
    événement, pluie, vent, général.
  - Mots grossiers masqués par des symboles ; rien de haineux ni de menaçant.
- **Fréquence :** environ 1 dossier sur 3 (`choisirSelonTon`, déterministe), si une plainte agressive
  correspond.
- **Affichage :** liseré d'alerte sur la bulle ; l'annonce vocale lit « mot masqué ».
- **Test :** plaintes en FR et EN, aucun gros mot en clair, des symboles dans chacune, ni aucune ni
  toutes agressives.

## 119 — Incidents inventés rares

> Exception explicite à la règle « aucune donnée inventée », décidée par le groupe.

- **Un incident inventé par semaine au plus** (`incidentFictif`), inséré dans le paquet de façon
  déterministe (graine de la semaine) :
  - agression en cours, ou vol à main armée ;
  - heure entre 9 h et 19 h ;
  - ligne réelle (tram ou bus du GTFS) ;
  - gravité élevée.
- **Toujours marqué comme fictif :**
  - `fictif: true` et source « Scénario du jeu (fictif) » ;
  - libellé « Incident signalé (fictif) » ;
  - ligne « Fictif · scénario du jeu, pas une donnée réelle » dans la fenêtre du plaignant.
- **Catégorie `securite`** : intervenir, calmer la situation, arrêter le véhicule, attendre. Elle a ses
  répliques (prompt 116) et son clash. Équipes pertinentes : la police, et les ambulanciers pour une
  agression.
- **4 plaintes de témoins** (fictives, `"fictif": true`).
- **Activation :** par défaut dans le navigateur, `?fictifs=0` pour les retirer. Les tests de règles n'en
  ont pas, donc les résultats sont comparables.
- **Au passage :** « Horloge en pause pendant la lecture » est retiré de la fenêtre. Il répétait le
  bandeau et chevauchait l'en-tête « INCIDENT (FICTIF) ».

## Vérifications

- `npm run build` vert ; `npm test` : 510 + 565 contrôles réussis.
  - Nouveaux tests : trio de répliques et clash, plaintes agressives, incidents fictifs.
  - Deux tests anciens adaptés : touches « 1 à 3 », relances privées du prompt 85 comptées.
- **Navigateur :** incident fictif « agression en cours » sur la ligne 1, avec :
  - le témoin @passagere_affolee ;
  - la mention « Fictif » ;
  - 3 répliques dont le clash ;
  - aucune erreur.
- Audit des textes en 1920 × 1080, FR et EN, avec l'incident fictif : **0 défaut**.
- Ressenti en vraie partie (tentation du clash, fréquence des plaignants agressifs) : [À COMPLÉTER].
