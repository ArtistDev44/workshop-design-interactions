# 22 — Dialogues des Nantais : plaintes en JSON brut (prompt 28)

Décisions verrouillées. L'app Community manager (prompt 22) reçoit des plaintes de Nantais auxquelles le joueur répond. Tout le contenu se trouve dans un fichier JSON brut, modifiable à la main ; aucun texte de dialogue n'est écrit dans le code. Les décisions Q1–Q61 et la boucle de jeu ne changent pas.

Note de numérotation : le prompt demandait `jeu/15-dialogues-nantais.md`, mais le n° 15 est déjà pris (bureau moderne). Ce fichier suit donc la numérotation courante : n° 22.

## Fichiers
- `site/public/data/messages.json` : la source, à modifier à la main. Une clé `_lisezMoi` en tête du fichier explique chaque champ.
- `site/public/data/messages.js` : copie générée (`window.MESSAGES = …`) qui permet de jouer par double clic, hors ligne.
  - Pour la régénérer : `npm run messages`. Elle est aussi régénérée avant chaque `npm run build` (`prebuild`).
  - Script : `site/scripts/generer-messages.mjs`. Il échoue clairement si le JSON est invalide.
- Quand le jeu est servi par un serveur, `game.js` relit directement `data/messages.json` (`fetch`, `no-store`). Une modification à la main est donc prise en compte au rechargement, sans rien régénérer. Test : une plainte ajoutée au JSON → 15 plaintes chargées contre 14 dans `messages.js`.

## Format d'une plainte
- `id` et `auteur` (pseudonyme générique, aucune donnée personnelle).
- `condition` :
  - `type` (`ligne en difficulté`, `perturbation`, `événement`, `alerte météo` ou `*`) ;
  - `retard_min` ;
  - `ligne` ;
  - `nature_contient` ;
  - `pointe` (heure de pointe, même règle que les effets contextuels) ;
  - `meteo: "pluie"` (au moins 1 mm de pluie ce jour-là, d'après la météo réelle).
- `texte` : `{ fr, en }`, avec les variables `{ligne}`, `{retard}` et `{nature}`. Elles sont remplies avec les données du dossier réel joué, jamais inventées.
- `reponses` : 2 ou 3 réponses, chacune `{ texte: { fr, en }, effets: { fluidite, reputation, budget }, bonne }`.
- Validation au chargement : `id`, `texte.fr`, au moins 2 réponses avec `texte.fr`, dont une `bonne: true`. Une entrée invalide est ignorée, avec un avertissement en console.

## Contenu
- 14 plaintes :
  - retards (≥ 10 min, ≥ 20 min, en heure de pointe, correspondance ratée) ;
  - manifestation, mouvement social, perturbation générique ;
  - affluence, propreté après un événement, affluence sous la pluie, affluence en heure de pointe ;
  - vent, température ;
  - arrêt sans abri sous la pluie.
- La bonne réponse est toujours celle du bon sens de régulation (informer, renforcer, s'excuser). La mauvaise renvoie la faute à l'usager ou nie le problème.
- Effets : réputation de +3 à +5 pour une bonne réponse, parfois au prix d'un peu de budget (renfort, nettoyage), et de −3 à −6 pour une mauvaise.
- Les dossiers d'archive et d'agenda n'ont souvent pas de ligne. Les plaintes liées aux événements et aux perturbations utilisent donc `{nature}` plutôt que `{ligne}`.

## Déclenchement (`game.js`)
- `Jeu.declencherPlainte(index)` est appelé à la présentation de chaque dossier (`nouveauDossier()`).
- Au plus une plainte par dossier, choisie parmi celles dont la condition correspond et dont toutes les variables existent pour ce dossier.
- Priorité à la plus spécifique (nombre de critères), puis à une plainte pas encore vue dans la partie.
- Le choix est déterministe (`index % n`) : il ne consomme pas le tirage des dés de la partie.
- File courte : au plus 3 plaintes en attente (`Jeu.MAX_PLAINTES_EN_ATTENTE`), pour garder une difficulté raisonnable.

## Réponse (`os.js`, app Community)
- Le bloc « Plaintes à traiter : n » affiche la plus ancienne plainte en attente et ses réponses, sous forme de lignes cliquables.
- Clavier, quand une plainte est en attente : Tab / Maj+Tab parcourent les réponses (chacune est annoncée en `aria-live`) ; Entrée, Espace ou 1 / 2 / 3 répond.
- `Jeu.repondrePlainte()` :
  - chaque effet est borné à ±15 (`borner()`), puis appliqué par `Jeu.appliquerDeltas()`, qui borne les jauges à 0–100 ;
  - la réponse est ajoutée au fil des commentaires (« Réponse de la salle », badge de réputation) ;
  - la plainte disparaît de la file.
- Retour affiché 5 s et annoncé en `aria-live` : « Bonne réponse (réputation +4) » ou « Réponse mal reçue (…) ».
- Le temps ne s'arrête pas pendant la lecture.
- Langue : les champs `fr` / `en` du JSON suivent `Langue.actuelle`, avec repli sur `fr`. Les libellés d'interface passent par `t()` (`plainte.*`, `fin.plaintes`).
- Bilan de fin : « Plaintes des Nantais traitées : x/y (dont b bonnes réponses) ».

## Vérifications
- `npm run build` OK (14 plaintes générées).
- Test automatisé (semaine du 2 novembre 2026), sans erreur console :
  - 15 dossiers, plainte « affluence » ou « propreté » sur les événements, « manifestation » puis « perturbation » sur les manifestations ;
  - Tab puis Entrée → réputation −4 (valeur du JSON) ; touche 1 → bonne réponse ;
  - borne : réputation 99 + 3 → 100 ;
  - passage en EN : plainte et réponses en anglais.
