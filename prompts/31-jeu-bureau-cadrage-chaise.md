# Prompt 31 — Jeu « Nantes en régulation », étape 18 : cadrage du bureau « sur la chaise »

Objectif : corriger le cadrage de la vue bureau selon les retours de rendu — être
**« sur la chaise »** : vue plus centrée et plus proche du poste, la **chaise n'est plus
visible** (bizarre), l'**horloge n'est plus sur le rideau** (elle va sur le mur ; les
arbres vus par la fenêtre restent OK, le **lampadaire est à revoir**) — sans toucher aux
décisions verrouillées Q1–Q61 ni à la boucle de jeu.

S'appuie sur les prompts 14–30 (pièce entière et dézoom du prompt 25, sortie du PC du
prompt 26).

Fichiers concernés : `site/public/` (`bureau.js`, `sketch.js`, `i18n.js` si nouveaux
textes), plus une mise à jour de `jeu/` et `journal.md`.

Règles absolues : aucun fichier image ajouté (le décor reste dessiné par le code) ;
la lisibilité du PC et des zones cliquables est maintenue (contraste ≥ 4,5:1, cibles de
clic inchangées ou plus grandes) ; tout nouveau texte passe par `t(...)` FR + EN.

## 1. Cadrage « sur la chaise »

- En vue `bureau`, rapprocher et **centrer la caméra sur le poste** : le joueur est
  positionné sur la chaise, face au PC — la chaise elle-même **n'apparaît plus** dans le
  champ (ou seulement un indice minimal en bas de cadre si nécessaire, mais jamais en
  plein milieu).
- Le moniteur encadré (prompt 25/26, pièce visible autour) reste lisible : le dézoom est
  ajusté pour garder un peu de mur autour du PC tout en étant plus centré.
- La caméra fausse 3D (prompt 25) fonctionne toujours : mouvement subtil hors cadre,
  recentrage au centre.

## 2. Horloge et lampadaire

- **Déplacer l'horloge du rideau vers le mur** (hors de la fenêtre) ; elle garde l'heure
  réelle (prompt 20).
- **Revoir le lampadaire** : nouvelle position/forme cohérente avec le cadrage « sur la
  chaise » (ex. lampadaire au sol à côté du poste, ou applique murale), toujours dessinée
  par le code ; l'interaction lampe du prompt 29 (si déjà fusionnée) reste fonctionnelle.
- Les **arbres par la fenêtre restent tels quels** (validés).

## 3. Vérifications

- `npm run build` dans `site/`.
- Tester visuellement à 1280/1600/1920 px : chaise non visible, vue centrée sur le poste,
  pièce encore visible autour du moniteur, horloge sur le mur lisible à l'heure réelle,
  arbres OK, lampadaire cohérent ; zones cliquables (PC, porte, livres, objets du
  prompt 29) toujours atteignables souris + clavier.
- Caméra fausse 3D (prompt 25) et sorties du PC (prompt 26) inchangées ; FR + EN ;
  `prefers-reduced-motion` ; hors ligne / double clic local.
- Aucune régression Q1–Q61 ni des prompts 14–30.
- Documenter dans `jeu/18-bureau-cadrage-chaise.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-31-bureau-cadrage`. À chaque push : entrée en tête de `journal.md`.
  Ne pas fusionner dans `main` sans demande.
