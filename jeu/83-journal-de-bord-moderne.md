# 83 — L'appli « Journal » devient un tableau de bord de la journée (prompt 89)

Code : `journal-donnees.js` (nouveau, logique pure testée : tuiles, courbes, cartes, filtres, semaine, enquête,
résumé), `journal.js` (nouveau, rendu design system, clavier, molette, copie), `os.js` (ancien `appJournal` /
`enqueteJournal` retirés), `game.js` (`Jeu.jaugesDebutJour`, relevé du matin sauvegardé), `sauvegarde.js` (vue,
jour, filtre, défilement), `sketch.js`, `taches-ui.js` (le carnet de la semaine passe dans la vue Semaine), `i18n.js`.
Règles et effets inchangés ; tout est recalculé depuis l'état de la partie (rien n'est stocké en double).

## Vue Jour
- **Pastilles** J1…J7 avec date courte et état (✓ objectif tenu, ✗ raté, • en cours ; journées futures grisées,
  inaccessibles) ; ← → ; sélecteur Jour / Semaine (S).
- **Tuiles** : signalements (traités / reçus, non traités), bonnes décisions (barre de proportion), jauges du
  jour (3 mini-courbes : un point au relevé du matin puis un point par événement réel, valeurs `jaugesApres`,
  sans interpolation, échelle 0–100 affichée, valeur finale et écart du jour), objectif du jour (✓ / ✗ / en cours),
  équipes envoyées par type ; conditionnelles : thème du jour et expérience (prompt 88), avertissements du
  patron (prompt 84).
- **Filtres** avec compteurs : Tout, Ratés (raté ou trop tard), Équipes, Plaintes, Mes notes.
- **Frise** : axe horaire, cartes ancrées à l'heure — signalement (pictogramme pixel de la catégorie, badge
  ligne aux couleurs de `data/lignes.json`, titre en clair, réponse choisie, évaluation couleur + symbole + mot
  ✓ ✗ ≈ ⏱, effets réels F / R / B signés, « Enquêter »), équipe, plainte (lien Community), avertissement du
  patron, cellule de crise, note du carnet (« Écrire une note », J). Équipes et plaintes d'un même dossier sont
  regroupées sous leur signalement et reliées par un trait. État vide illustré. Défilement molette / ↑ ↓ avec
  barre DS, seules les cartes visibles sont dessinées.

## Vue Semaine
Une colonne par journée (date, thème, signalements, bonnes décisions, objectif, jauges de fin en barres 0–100),
journées à venir grisées ; clic → la journée. Courbe des 3 jauges et du score (0–300) en fin de journée, seuils
des fins 150 et 240 en pointillés, légende textuelle ; décisions clés (bilan existant) ; carnet de la semaine
(prompt 88, K).

## Enquête
Fiche avec en-tête (← Retour, pictogramme, date, badge ligne, évaluation) et 4 onglets DS (← → ou 1 à 4) :
faits + citation de la source en bloc italique ; contexte en puces (température, pluie, vent, pointe, effet météo,
modificateur, agenda réel) ; décision (effets réels en 3 grandes puces, dés en faces pixel, barres horizontales des
effets attendus `attendus` de chaque réponse de la catégorie, axe centré sur 0, échelle ±N affichée, « votre
choix » et « la meilleure » écrits en toutes lettres, explication du prompt 87) ; suites (bulles des plaintes et
réponses, suivis, équipes avec pertinence et durée).

## Accessibilité, animation, copie
Clavier : Tab zones (journées / filtres / frise), ← → jours ou filtres, ↑ ↓ cartes, Entrée enquêter, Échap
retour, S semaine, C copier. `aria-live` : jour affiché et son résumé, carte focalisée, volet ouvert. Animations
(glissé 8 px / 150 ms en cascade 30 ms, courbes 300 ms, fondu d'onglet 120 ms) coupées avec
`prefers-reduced-motion`. « Copier le résumé du jour » (C) : texte brut FR / EN (signalements, bonnes décisions,
jauges, objectif, une ligne par décision) ; si le presse-papiers refuse, le texte s'affiche dans une zone
sélectionnable. La couleur n'est jamais seule à porter le sens (symboles, lettres, libellés).

## Vérifications
`npm run build`, `npm test` (347 contrôles : tuiles = comptages réels, points des courbes = jauges après chaque
événement, filtres (comptes et contenu), frise triée, vue semaine, barres = `attendus` avec choix et meilleure,
résumé copié, sauvegarde de la vue). Chromium FR / EN : vue Jour, 4 volets d'enquête au clavier, vue Semaine,
semaine complète sans erreur console.

Limite : en portrait mobile, l'appli Journal est affichée réduite avec le reste du PC (pas encore de mise en page
dédiée en une colonne) ; [À COMPLÉTER] si le groupe la juge nécessaire.
