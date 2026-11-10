# Prompt 28 — Jeu « Nantes en régulation », étape 15 : dialogues des Nantais stockés dans un JSON brut

Objectif : ajouter des **listes de dialogues de Nantais qui se plaignent de problèmes** —
cohérents, pas trop difficiles, avec de **bonnes réponses possibles** — et stocker les
messages dans un **fichier JSON brut directement modifiable**, à partir duquel le contenu
est généré. Fichier d'information brute : **aucun texte de dialogue figé dans le code**.
Sans toucher aux décisions verrouillées Q1–Q61 ni à la boucle de jeu.

S'appuie sur les prompts 14–27, notamment le bureau applicatif (prompt 22 : app Community
manager) dans lequel ces dialogues prennent place.

Fichiers concernés : `site/public/data/messages.json` (nouveau, données brutes) +
`site/public/data/messages.js` (wrapper pour le double clic hors ligne, même pattern que
`lignes.json`/`lignes.js`), `site/public/` (`bureau.js`, `os.js`, `game.js`, `i18n.js`),
plus une mise à jour de `jeu/` et `journal.md`.

Règles absolues : aucun dialogue n'invente de fait — chaque plainte s'appuie sur un incident
réel de la partie en cours (ligne, lieu, type, retard) ou sur une donnée réelle (météo,
agenda) ; tout nouveau texte d'interface passe par `t(...)` (`i18n.js`, prompt 24) en FR
et EN ; le JSON reste du **texte brut lisible et modifiable à la main**, sans secret.

## 1. Fichier JSON brut des messages

- Créer `site/public/data/messages.json` : structure plate et documentée, ex. :

  ```json
  {
    "plaintes": [
      {
        "id": "retard_ligne_4_soir",
        "condition": { "type": "retard", "retard_min": 10, "ligne": "4" },
        "texte": { "fr": "...", "en": "..." },
        "reponses": [
          { "texte": { "fr": "...", "en": "..." }, "effets": { "fluidite": 3, "reputation": 5, "budget": 0 }, "bonne": true },
          { "texte": { "fr": "...", "en": "..." }, "effets": { "fluidite": -2, "reputation": -4, "budget": 0 }, "bonne": false }
        ]
      }
    ]
  }
  ```

- Le JSON contient les **informations brutes** (id, condition de déclenchement, textes
  fr/en, réponses possibles avec effets chiffrés sur les jauges et un indicateur
  bonne/mauvaise réponse). Il est **modifiable directement** : ajouter une plainte =
  ajouter une entrée, sans toucher au code.
- Générer `data/messages.js` (même contenu enveloppée en `window.MESSAGES = {...}`) pour
  que le jeu fonctionne ouvert par double clic et hors ligne, comme `lignes.js`,
  `semaines.js`, `fallback.js` ; référencer les deux dans `index.html`.

## 2. Contenu des dialogues

- Écrire une **douzaine de plaintes** de Nantais variées et cohérentes avec l'univers du
  jeu (retards de tram/bus, travaux, affluence, météo, propreté, correspondances) ;
  chaque plainte a **2 à 3 réponses possibles dont au moins une bonne** (effets positifs
  ou neutres) et une mauvaise (malus) — jamais de piège injustifié : la bonne réponse est
  celle qui correspond au bon sens de régulation.
- Pas trop difficiles : le joueur doit comprendre la bonne réponse sans connaissance
  experte du réseau.
- Les plaintes restent **anonymes et génériques** (pas de données personnelles).

## 3. Intégration dans le jeu (app Community manager du prompt 22)

- Dans l'app Community manager (vue poste, `os.js`/`bureau.js`), afficher les plaintes
  **déclenchées par les vrais événements de la partie** (filtrer `messages.json` avec la
  `condition` sur l'incident courant) : le joueur choisit une réponse, les `effets`
  s'appliquent aux jauges via `borner()` (clamp 0–100, comme toute conséquence).
- Une plainte résolue disparaît de la liste ; le bilan de fin de semaine (prompt 23)
  peut reprendre « plaintes traitées : x/y ».
- Le temps ne s'arrête pas pendant la lecture (même règle que les autres apps, prompt 22).
- Accessibilité : navigation clavier (Tab/Entrée) dans la liste des réponses, textes via
  `t(...)` ou champs fr/en du JSON selon `lang` (prompt 24), `aria-live` sur le résultat.

## 4. Vérifications

- `npm run build` dans `site/`.
- Modifier `messages.json` à la main (ajouter/retirer une plainte) et vérifier que le jeu
  reflète la modification **sans changement de code**.
- Jouer une partie : déclencher chaque type de condition, vérifier que seules les
  plaintes correspondantes apparaissent, que les effets des réponses sont les valeurs
  du JSON appliquées aux bonnes jauges, et que le clamp 0–100 s'applique.
- Hors ligne / double clic local (via `messages.js`), FR + EN, clavier seul,
  `prefers-reduced-motion`, 1920×1080, contraste ≥ 4,5:1.
- Aucune régression Q1–Q61 ni des prompts 14–27 (partie complète rejouée).
- Documenter dans `jeu/15-dialogues-nantais.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-28-dialogues-nantais`. À chaque push : entrée en tête de `journal.md`.
  Ne pas fusionner dans `main` sans demande.
