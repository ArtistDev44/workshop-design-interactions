# Prompt 189 — Personnages : le patron, Camille, les usagers

Couche de présentation : aucune règle verrouillée nouvelle, aucun effet de jauge ajouté. Code : `site/public/personnages.js`
(chargé après `game.js` et `histoire.js`), textes dans `i18n.js` (FR + EN), plaintes dans `site/public/data/messages.json`.

## Le patron

**Trait : il déteste qu'on esquive.** Après une réponse Community jugée mauvaise (`Jeu.repondrePlainte` → `bonne: false`),
il envoie dans l'appli Mails un reproche sévère (`patron.trait.esquive`, 3 formulations : « J'ai vu votre réponse à … sur
Quai. On assume, ici… »). Après une bonne réponse, un message de satisfaction court (`patron.trait.assume`, 3 formulations).
Une fois par jour et par sorte. Tirage déterministe par la graine (`Jeu.variante`).

> Écart avec le prompt : le prompt demandait de passer « le malus de réputation du prochain reproche de −3 à −5 » et
> d'ajouter « +1 » après une bonne réponse. Le jeu n'a pas de reproche Community chiffré (le −3 existant est celui d'un
> commentaire négatif, d'une plainte expirée ou d'une réponse tardive) et les messages du patron n'ont aucun effet de jeu.
> Pour ne pas créer de règle nouvelle, le trait est implémenté en messages seulement — **aucun delta**. À arbitrer.

**Arc sur les 3 semaines du mode histoire** (`Jeu.tonPatron()`, d'après `chapitreCourant()`) :

| Semaine | Ton (`ton`) | Écriture |
|---|---|---|
| 1 | `pedagogue` | phrases longues, explications, encouragements |
| 2 | `professionnel` | phrases courtes, droit au but |
| 3 | `pression` | sec, sans ponctuation finale ; après un reproche, une relance (« Et vite ») — deux messages à la suite, une fois par jour |
| hors histoire | `professionnel` | — |

Chaque message du patron porte un champ `ton` (et `meta.ton`). Consigne du jour, reproche et félicitation reçoivent une
formulation finale du ton : clés `patron.ton.<ton>.<consigne|reproche|felicitation>` (+ `.v1`, `.v2`). Les textes
existants ne sont pas réécrits. La conversation téléphonique d'ouverture de semaine (`histoire.c<n>.*`) était déjà
propre à chaque semaine.

## Camille

Cheffe de salle, légèrement inquiète pour le réseau (rassurante mais préoccupée), tutoie le joueur. Entre deux
journées (fin du soir, après le SMS de la veille d'inspection s'il y en a un, jamais le dernier soir, jamais pendant une
décision), elle commente la **météo réelle du jour joué** (`Jeu.meteoDuJour` : archives Open-Meteo de la semaine, ou
Open-Meteo du jour en direct). Seuils explicites (`Jeu.SEUILS_METEO_CAMILLE`) :

| Condition | Seuil | Clé |
|---|---|---|
| pluie | `pluie_mm ≥ 5` (même seuil que le contexte « météo » de `game.js`) | `camille.meteo.pluie` |
| vent | `rafales_max ≥ 50` km/h (idem) | `camille.meteo.vent` |
| chaleur | `temp_max ≥ 30` °C | `camille.meteo.chaleur` |

Valeurs réelles dans le texte ({pluie}, {vent}, {temp}). Pas de donnée pour la date jouée → pas de SMS. 3 variantes par
condition, FR + EN, tirage par la graine ; réponse du joueur `camille.meteo.reponse`.

## Les usagers (registres)

Champ `registre` sur 19 plaintes ordinaires de `messages.json` (les plaintes agressives et fictives gardent leur `ton`) :
`etudiant`, `senior`, `touriste`, `travailleur`, `parent` — 5 registres. Dix textes réécrits dans leur registre
(ex. étudiant : « Mon cours commence sans moi », senior : « À mon âge… », touriste : « nous ne sommes pas d'ici ») ;
les variables réelles ({ligne}, {retard}, {nature}, {nom}) sont inchangées. `generer-messages.mjs` refuse un registre
inconnu et exige au moins 4 registres.

## Vérifié

`npm test` (bloc « Prompt 189 » de `test-jeu.mjs`) : ton par chapitre 0–3 et champ `ton`, formulation présente sur la
consigne, deux messages après un reproche en semaine 3, trait une fois par jour, condition météo de Camille comparée
aux données de chaque semaine archivée, aucun SMS sans donnée ni le dernier soir, registres, clés FR / EN.
Non vérifié : partie jouée en navigateur, audit des textes.
