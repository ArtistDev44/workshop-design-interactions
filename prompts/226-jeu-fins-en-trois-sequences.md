# Prompt 226 — Jeu : chaque fin devient une petite vidéo de trois séquences

Origine : demande du 15/11/2026 (« avoir pour chaque fin 3 séquences de fin de jeu personnalisées : 1 seule fin, mais
avec une petite vidéo de fin, pas juste 1 séquence avec 1 écran »). Statut : **tableau écrit le 15/11/2026 (`jeu/226-fins-en-sequences.md`), en attente de validation** ; code à exécuter.

## Constat

- Douze fins existent : dix fins de semaine selon la posture (`posture.js`, `Jeu.FINS_SEMAINE`, prompt 207 :
  `virale`, `burnout`, `imposteur`, `fauteuil`, `diplomate`, `insoumis`, `usagers`, `boucEmissaire`, `correcte`,
  `reprimande`), le licenciement (`gameover.js`, prompt 84) et la démission (prompt 47).
- Une fin se montre sur **un seul écran** : le rapport papier (titre, texte, tampon, « Ce qui a pesé »), ou la lettre
  de licenciement.
- Seule la cinématique du mode histoire (`histoire.js`, `lancerCinematique`) a trois plans (ville, lettre, pièce),
  mais ils dépendent du **palier de score** (bonne / moyenne / mauvaise), pas de la fin obtenue, et seulement à la
  semaine 3.

## À faire

1. **Une vidéo par fin** : pour chacune des 12 fins, **trois séquences animées** de 4 à 6 s (≈ 15 s en tout),
   dessinées par le code en p5.js, dans le style pixel du design system (`design-system/DESIGN.md`) — aucun fichier
   vidéo, aucune ressource réseau (le jeu reste jouable hors ligne). Elles s'enchaînent seules, en fondus, puis
   mènent au rapport papier actuel (inchangé), qui reste l'écran de la fin.
2. **Trois temps** pour chaque fin : (a) **le moment** — ce qui a fait basculer la semaine ; (b) **la conséquence** —
   ce que ça provoque autour (réseau, usagers, patron, Camille) ; (c) **l'après** — le personnage, la pièce, le
   lendemain. Exemples à préciser dans `jeu/226-fins-en-sequences.md` avant de coder :
   - `virale` : le clash posté, le compteur de partages qui s'emballe ; l'écran de la salle qui affiche la capture ;
     le badge posé sur un bureau vide.
   - `burnout` : les gobelets de café qui s'empilent jour après jour ; la carte qui clignote seule la nuit ; le
     fauteuil vide, le téléphone qui vibre dans le noir.
   - `fauteuil` : la journée qui tourne bien (lignes vertes) ; le patron qui laisse sa place ; vous dans son bureau.
   - `licenciement` : la jauge qui tombe ; la lettre ; le carton d'affaires dans l'ascenseur.
   - `demission` : la lettre écrite ; le badge rendu ; la sortie sur les quais de Loire.
   Les dix autres sur le même modèle : un fichier de tableau (fin × séquence × décor, mouvement, sous-titre) validé
   avant d'écrire le code.
3. **Personnalisée** avec les données réelles de la partie : semaine et dates jouées, lignes et lieux des faits qui ont
   pesé (`bilan.pese`), météo réelle des jours joués, chiffres du bilan (score, jauges, clashs, cafés…). Aucun fait
   inventé : une donnée absente → la séquence s'en passe (jamais « [À COMPLÉTER] » à l'écran).
4. **Sous-titres** : une phrase par séquence, FR + EN, lue au lecteur d'écran à chaque séquence.
5. **Commandes** : Entrée / Espace / → séquence suivante, Échap passer la vidéo (droit au rapport), P pause ; clic ou
   toucher = suivante. Barre de progression discrète (3 segments).
6. **Accessibilité** : `prefers-reduced-motion` (et le réglage du jeu) → trois plans fixes sans mouvement, avancés à
   la main ou toutes les 6 s ; pas de flash, pas de clignotement plus de 3 fois par seconde ; contraste ≥ 4,5:1 des
   sous-titres ; son optionnel (une ambiance par fin, coupée si le son est coupé).
7. **Mobile** portrait et paysage : séquences recomposées à la forme de l'écran (comme la cinématique, prompt 209).
8. **Galerie des fins** (prompt 207) : pour une fin découverte, bouton « Revoir la fin » qui rejoue sa vidéo (avec les
   données de la partie où elle a été obtenue, gardées dans la galerie ; sinon une version sans données).
9. Le mode histoire : à la semaine 3, la vidéo de la fin finale remplace l'actuelle cinématique à trois plans par
   palier (le décor du palier peut rester en fond).

## Vérification

`npm run build`, `npm test` (contrôles : 12 fins × 3 séquences définies, sous-titres FR + EN, aucune variable
non remplie, données absentes gérées, Échap mène au rapport, mode réduit sans animation) ; captures des 36 séquences
dans `jeu/226-captures/` ; audit des textes à 0 en 1920 × 1080, 1366 × 768, 412 × 915 (une étape par séquence) ;
essai Chromium : une semaine jouée jusqu'à une fin, vidéo puis rapport ; « Revoir la fin » dans la galerie.
