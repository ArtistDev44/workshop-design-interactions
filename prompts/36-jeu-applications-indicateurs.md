# Prompt 36 — Jeu « Nantes en régulation », étape 23 : applications toutes fonctionnelles, icônes agrandies, app flottante « Indicateurs »

Objectif : que **toutes les applications du bureau RégulOS soient fonctionnelles**, que
leurs **icônes soient plus grandes** (bureau et barre des tâches), et ajouter une
**application flottante « Indicateurs »** qui affiche en permanence les trois variables
du jeu : **fluidité, réputation, budget**. Les décisions Q1–Q61 ne changent pas.

S'appuie sur les prompts 22 (apps), 23 (objectifs, paliers), 28 (plaintes), 33
(sauvegarde) et 35 (menu principal).

Fichiers concernés : `site/public/` (`os.js`, `sketch.js`, `game.js` si besoin d'un
accès en lecture, `i18n.js`), plus `jeu/` et `journal.md`.

Règles absolues : aucune donnée inventée (les valeurs affichées sont celles de
`Jeu.jauges`, des objectifs et des seuils réels du jeu) ; textes via `t(...)` FR + EN ;
contraste ≥ 4,5:1 ; clavier complet ; `prefers-reduced-motion`.

## 1. Applications fonctionnelles
- Passer en revue chaque icône : Régulation, Patron, Carte, Community, Journal, Corbeille.
- **Corbeille** (aujourd'hui inactive) : devient une vraie app — liste des plaintes déjà
  traitées (texte, réponse envoyée, bonne / mal reçue, effet sur la réputation) ; bouton
  « Vider la corbeille » qui les retire de la liste (sans toucher aux jauges ni au bilan).
- Sans partie en cours, chaque app affiche un message clair et un bouton « Menu
  principal » (prompt 35) au lieu d'un écran vide.

## 2. Icônes agrandies
- Icônes du bureau RégulOS nettement plus grandes (≈ +35 %), libellés plus lisibles ;
  icônes de la barre des tâches agrandies elles aussi. La fenêtre d'app est décalée pour
  ne pas recouvrir les icônes.

## 3. App flottante « Indicateurs »
- Nouvelle icône « Indicateurs » (bureau + barre des tâches, touche I) qui ouvre une
  **petite fenêtre flottante**, toujours au premier plan, **déplaçable** en tirant sa barre
  de titre (position mémorisée en `localStorage`), visible sur le bureau RégulOS **et**
  par-dessus l'appli de régulation.
- Contenu : les trois jauges (valeur / 100, barre, couleur verte / orange / rouge selon
  les seuils 40 / 20 du jeu), la variation due à la dernière décision, l'objectif du jour
  (jauge et seuil réels) et le palier de budget en cours.
- Bouton de fermeture ; annonce `aria-live` à l'ouverture ; aucune animation si les
  animations sont réduites.

## 4. Vérifications
- `npm run build` et `npm test` ; ouvrir chaque app avec et sans partie, au clavier et à
  la souris ; vider la corbeille ; déplacer les Indicateurs puis recharger (position
  conservée) ; FR + EN.
- Documenter dans `jeu/31-applications-indicateurs.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-36-applications-indicateurs`. À chaque push : entrée en tête de `journal.md`.
