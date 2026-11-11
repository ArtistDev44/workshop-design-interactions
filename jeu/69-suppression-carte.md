# Prompt 73 — suppression de la carte : l'écran de jeu devient une liste de signalements

Les sources réelles (GTFS-RT, changelog, agenda, Open-Meteo) ne donnent **aucune géométrie de ligne** :
la carte affichée depuis le prompt 68 positionnait les repères de façon arbitraire. Elle est supprimée.

## Ce qui change

- **Plus de carte** dans l'écran de jeu : plus de fond de carte, de projection, de tracés de lignes, de
  repères positionnés, de zoom (molette, +/−, glisser) — `sketch.js` (`dessinerLignesEtat`, `CARTE_VUE`,
  `commandesCarte`… supprimés ; `mobile.js` : le swipe ne zoome plus).
- **Le panneau de gauche devient la file des signalements** (`dessinerFileSignalements`, `carte.js`) :
  type, lignes concernées (numéro + nom réel), gravité calculée, heure d'arrivée, expiration restante
  pour ceux en file. Clic ou Entrée sélectionne un signalement (la tête de file démarre le compteur).
- **Équipes en état textuel** : plus de pictogrammes qui se déplacent ; l'onglet Équipes affiche
  « en route · 12 s », « sur place · 30 s », « retour · 8 s » avec le temps restant (clés `equipe.etat.*`).
- **Renommage de l'appli** : « Carte » → **« Signalements »** (EN « Reports ») — libellés i18n
  (`app.carte`, `os.barreTitre`, `jeu.reseau`, guide, tutoriel, aide), glyphe pixel « liste de
  signalements », barre des tâches. L'icône reste en première place et s'ouvre par défaut après le
  démarrage du PC.
- **Lignes concernées** : la liste repliable reste en texte ; un clic sur une ligne met en surbrillance
  ses signalements **dans la file** (plus sur une carte).

## Conservé

File d'attente avec expiration (2 × le compteur de la semaine), compteur au seul choix du joueur,
conflit A/B, équipes limitées avec effectifs et pertinence (prompt 68), raccourcis (Tab, Entrée, 1/2/3/0,
A/B, Maj+1/2/3/4…), `aria-live`, `prefers-reduced-motion`, contraste ≥ 4,5:1, cibles ≥ 44 px en mobile
portrait. `game.js` et Q1–Q61 inchangés. Rien d'inventé : tout ce qui reste affiché vient des sources
réelles déjà chargées ou d'un calcul sur ces données.
