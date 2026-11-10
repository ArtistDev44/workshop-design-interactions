# Prompt 22 — Jeu « Nantes en régulation », étape 9 : le bureau du PC devient un poste de travail

Objectif : transformer le bureau affiché sur l'écran du PC (niveau « vue bureau » du
prompt 20) en un **véritable bureau d'ordinateur avec plusieurs applications**, et faire
évoluer les jauges vers le trio **Fluidité / Réputation / Budget**. Sans toucher aux décisions
verrouillées Q1–Q61 ni à la boucle de jeu de la salle de contrôle (plein écran).

## 0. Point de départ : lire le code existant avant toute modification

Fichiers concernés : `site/public/oeuvres/pxe-nte001-g01-w01/` (`bureau.js`, `sketch.js`,
`game.js`, `style.css`, `index.html`), plus une mise à jour de `jeu/` et `journal.md`.

Repérer dans le code actuel :

- `bureau.js` : `dessinerPC(g)` (ligne ~382) dessine le PC et son écran (576×324 à l'écran,
  miniature du jeu en direct) ; `dessinerVueBureau()` (ligne ~460) gère les clics au bureau
  (`boutons.push({... action: sAsseoir })`, ligne ~508) ; `vue`, `sAsseoir()`, `seLever()`.
- `sketch.js` : `keyPressed` lignes ~1046–1052 ; panneau des jauges ligne ~543
  (`Jeu.jauges || { fluidite: 50, satisfaction: 50, reputation: 50 }`, affiché lignes
  545–547) ; écran de fin lignes ~806–880 (jauges 844–846) ; aide ligne ~1182.
- `game.js` : `NOMS_JAUGES = ['fluidite', 'satisfaction', 'reputation']` (ligne ~166) et
  `LIBELLES_JAUGES` (ligne ~167) ; `Jeu.nouvellePartie()` initialise
  `Jeu.jauges = { fluidite: 50, satisfaction: 50, reputation: 50 }` (ligne ~229) ;
  `Jeu.score()` (ligne ~239) = somme des 3 jauges (Q44) ; `Jeu.decider(action)` (ligne ~283)
  applique les deltas avec `borner()` (ligne ~273, clamp 0–100).

Règle absolue : aucun problème nantais, commentaire ou message n'est inventé. Tout provient
des incidents réellement générés par la partie (ligne, lieu, type, heure simulée) et des
valeurs réelles des jauges.

## 1. Architecture des applications du bureau

### 1.1 État et navigation

- Ajouter dans `bureau.js` : `let appOuverte = null; // null | 'patron' | 'carte' | 'community' | 'journal'`.
- Dans `dessinerPC(g)`, dessiner sur l'écran du PC (en plus du jeu en direct miniature) une
  **barre d'icônes en bas de l'écran** avec 4 icônes pixel art (16×16 logiques chacune) :
  enveloppe (Messages du patron), carte de Nantes (Gestion des problèmes), bulle de
  commentaire (Community manager), livre ouvert (Journal).
- Au clic sur une icône (étendre la logique de `boutons.push` de `dessinerVueBureau`) :
  `appOuverte = 'carte'` etc. Un clic sur l'icône active referme l'app (`null`).
- Chaque app s'ouvre dans une **fenêtre pixel art** dessinée par-dessus l'écran du PC :
  cadre avec barre de titre (nom de l'app + croix de fermeture), contenu spécifique (sections
  2 et 3), bouton « Fermer » + Échap pour revenir au bureau du PC.
- **Le temps ne s'arrête pas** : ouvrir/lire une app ne met pas la partie en pause (même
  règle que les livres du prompt 20) ; le mail de fin de journée pourra le signaler.
- Navigation clavier : Tabulation parcourt les 4 icônes, Entrée ouvre/ferme, Échap ferme
  l'app puis se lève du poste (deux niveaux, comme le prompt 20).
- L'app ouverte reste visible quand on se lève ? Non : `seLever()` remet `appOuverte = null`.

### 1.2 Les quatre apps

1. **Messages du patron** (`'patron'`) : fil de bulles façon SMS (même direction artistique
   que l'intro du prompt 20). Le patron envoie des messages selon l'état réel : consigne en
   début de journée, alerte quand une jauge passe sous 20 (clignotement Q46), réaction après
   un incident mal géré (d'après `Jeu.evenementsJournee`, prompt 21). Textes courts, français.
2. **Carte de gestion des problèmes nantais** (`'carte'`) : voir section 2.
3. **Community manager** (`'community'`) : fil de **commentaires nantais** publiés en réaction
   aux événements réels de la partie (un commentaire après chaque dossier traité, positif si
   bien géré, négatif sinon — d'après les deltas réels). Chaque commentaire fait évoluer
   la jauge **Réputation** (section 3). Les commentaires sont des templates courts remplis
   avec les données réelles (ligne, retard) — jamais de fait inventé.
4. **Journal** (`'journal'`) : journal de bord de la journée en cours, alimenté par
   `Jeu.evenementsJournee` (prompt 21) : heure, ligne, incident, action, résultat. Lecture
   seule, bouton fermer.

## 2. Carte de gestion des problèmes nantais (façon « 911 operator »)

### 2.1 Données

- La carte affiche une **vue simplifiée de Nantes** (fond pixel art : Loire en bande
  horizontale, quelques rues, quartier centre) — dessinée par le code, aucun fichier image.
- Les **points d'incident actifs** de la partie en cours sont placés sur cette carte à des
  positions dérivées du lieu réel de l'incident (ligne → zone de Nantes, ex. ligne 4 →
  centre-ville, ligne 1 → nord, etc. — mapping simple documenté dans `jeu/15-bureau-apps.md`).

### 2.2 Envoi d'équipes

- Table des équipes (dans `game.js`, documentée) :

  | Équipe | Coût (Budget) | Effet |
  |---|---|---|
  | Ambulance | 15 | réputation +8 (usagers rassurés) |
  | Police | 10 | réputation +5, fluidité +3 (déblocage) |
  | Techniciens | 12 | fluidité +10 |
  | Pompiers | 15 | réputation +6, fluidité +6 |

  Les effets sont appliqués via la même fonction `borner()`/mécanique de deltas que
  `Jeu.decider` (pas de contournement des règles de clamp 0–100).
- Interaction : cliquer sur un point d'incident → panneau latéral avec la liste des équipes
  (coût affiché) → choisir → **valider l'envoi** → déduction immédiate du Budget
  (bloqué avec message explicite si Budget < coût, voir prompt 23) → l'équipe est marquée
  « en route » avec un **temps d'arrivée en secondes simulées** (ex. 20 s) affiché sur la
  carte → à l'arrivée, les effets s'appliquent et un commentaire peut apparaître dans
  l'app Community manager.
- Une équipe par incident : un incident déjà doté d'une équipe ne peut pas en recevoir une
  seconde (bouton grisé avec « équipe déjà envoyée »).
- Les équipes envoyées sont aussi listées dans le Journal.

## 3. Jauges : passer à Fluidité / Réputation / Budget

La note de départ disait « remplacer satisfaction par budget / réputation » : la réputation
existe déjà comme jauge ; on remplace donc **« satisfaction » par « budget »** et on branche la
**réputation aux réseaux sociaux** (app Community manager). Le trio final : **Fluidité,
Réputation, Budget**.

Modifications précises :

1. `game.js` ligne ~166 : `NOMS_JAUGES = ['fluidite', 'reputation', 'budget']` et
   `LIBELLES_JAUGES = { fluidite: 'fluidité', reputation: 'réputation', budget: 'budget' }`.
2. `Jeu.nouvellePartie()` (ligne ~229) : `Jeu.jauges = { fluidite: 50, reputation: 50, budget: 50 }`.
   Le score reste la somme des 3 (Q44 inchangé, `Jeu.score()` ligne ~239 fonctionne tel quel).
3. `game.js` table des effets (ligne ~142, ordre fluidité/satisfaction/réputation) : réordonner
   en fluidité/réputation/budget et réaffecter les effets des 3 actions + « ne rien faire »
   (Q57–Q60) : par ex. « Bus de renfort » → fluidité +, budget − (coût), etc. Documenter la
   nouvelle table dans `jeu/15-bureau-apps.md`. **Ne pas toucher aux décisions Q1–Q61
   elles-mêmes** : seules les valeurs d'effets sont réajustées pour le nouveau trio.
4. `sketch.js` : panneau des jauges lignes ~543–547 et écran de fin lignes ~844–846 → afficher
   Fluidité / Réputation / Budget ; aide ligne ~1182 → « fluidité, réputation, budget ».
5. Branchements : chaque commentaire de l'app Community manager applique un delta à
   `reputation` ; chaque envoi d'équipe applique son coût à `budget` ; le mail de fin de
   journée (prompts 20/21) cite les trois nouvelles jauges.
6. `Jeu.ton()` (ligne ~336) et `Jeu.narrer()` : remplacer les occurrences de « satisfaction »
   par « réputation » ou « budget » selon le contexte, sans changer la logique de ton.

## 4. Vérifications détaillées

- `npm run build` dans `site/`.
- Pour chaque app : ouvrir depuis le bureau (clic + clavier), lire, fermer (croix, bouton,
  Échap) ; vérifier que le temps de jeu continue de couler pendant la lecture.
- Carte : un incident actif apparaît sur la carte ; envoi de chaque type d'équipe avec coût
  déduit et effets appliqués à l'arrivée ; envoi refusé si Budget insuffisant ; pas de doublon
  sur un même incident.
- Community manager : un commentaire après un dossier bien géré fait monter la Réputation,
  un dossier raté la fait baisser (valeurs réelles).
- Jauges : panneau et écran de fin affichent Fluidité / Réputation / Budget ; score /300
  inchangé ; Budget sous 20 → clignotement Q46.
- Mail de fin de journée cite les trois nouvelles jauges.
- `prefers-reduced-motion`, clavier seul, hors ligne (fallback), 1920×1080, contraste ≥ 4,5:1,
  aucun flash > 3/s, aucun fichier image ajouté.
- Documenter dans `jeu/15-bureau-apps.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-22-bureau-apps`. À chaque push : entrée en tête de `journal.md`.
  Ne pas fusionner dans `main` sans demande.
