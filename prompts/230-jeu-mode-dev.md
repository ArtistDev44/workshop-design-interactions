# Prompt 230 — Jeu : un mode développeur complet, ouvert par le logo du menu

Origine : demande du 15/11/2026 (« un mode dev qui me servira notamment à voir les différentes animations ; complet
dès le début ; accessible en cliquant sur le logo du jeu vidéo dans le menu »). Statut : **à exécuter**.

## Accès

- Clic (ou Entrée sur le logo au clavier) sur le **logo PXE du menu principal** → fenêtre « Mode développeur ».
  Aussi `?dev=1` dans l'adresse. Rien d'autre ne l'annonce au joueur ; aucune donnée envoyée ; tout reste local.
- Fermer : Échap ou « Fermer ». Un bandeau discret « DEV » reste visible tant qu'une action du mode a modifié la partie.

## Contenu (complet dès la première version)

Fenêtre à onglets (← → / Tab / clic), une liste d'actions par onglet, chacune avec un bouton ≥ 44 px CSS :

1. **Animations** — rejouer chaque animation du jeu : ouverture de fenêtre, survol / appui de bouton, changement d'appli,
   secousses du juice (petit, moyen, grand), pop de jauge, transition de jour, démarrage du PC, se lever / s'asseoir,
   lettre (ouverture et rangement), téléphone en main, café, sieste, bilan de fin de journée (XP), vidéo de fin.
   Réglage « vitesse » (×0,25, ×0,5, ×1) et bascule « animations réduites » pour comparer.
2. **Fins** — les 12 vidéos de fin, chacune lisible séquence par séquence (1, 2, 3), avec les données de la partie en
   cours ou sans données ; les cinématiques et l'écran de licenciement.
3. **Partie** — lancer une semaine (archive, histoire 1 à 3, temps réel), aller au jour n, régler l'heure, régler les
   trois jauges (− / + par 10), vider ou remplir le budget, déclencher le prochain signalement, finir la journée,
   finir la semaine, licenciement, démission, promesse d'équipe, demande au patron en attente.
4. **Écrans** — ouvrir chaque fenêtre et tâche : aide, paramètres, palmarès, galerie des fins, rapport, lettre (mission,
   bilan, sanction), fin de journée, mail du soir, SMS, téléphone, partir, démission, inspection.
5. **Options** — basculer sans passer par les Paramètres : somnolence, défi chrono, ne pas déranger, animations
   réduites, contraste renforcé, langue, tout débloquer.
6. **Outils** — superposer les zones de clic (agrandies comprises, prompt 220) et leur taille en px CSS, compteur
   d'images par seconde, version du build, état des données (API ou instantané), relancer avec l'audit des textes,
   effacer les données locales du jeu (confirmation).

## Règles

- Le mode ne casse pas la partie : chaque action passe par les fonctions du jeu existantes ; une partie modifiée en mode
  dev n'entre pas au palmarès (marquée « dev »).
- FR + EN, clavier complet, contraste ≥ 4,5:1, mobile (liste défilable).

## Vérification

`npm run build`, `npm test` (ouverture par le logo, chaque action d'un onglet appelle une fonction existante, partie
« dev » hors palmarès) ; audit des textes et des cibles à 0 sur les six onglets en 1920 × 1080, 1366 × 768, 412 × 915 ;
essai Chromium : logo → Animations → chaque bouton.
