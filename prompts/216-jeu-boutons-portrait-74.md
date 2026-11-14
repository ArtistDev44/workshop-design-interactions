# Prompt 216 — Jeu : boutons des fenêtres en portrait de 72 à 74 px

Origine : rapports `jeu/214-mobile-plein-ecran-accessibilite.md` § 4 et `jeu/215-mobile-paysage.md` ; demande du
14/11/2026 (« fais passer les boutons de 72 à 74 px »). Statut : **exécuté le 14/11/2026**.

## Constat

En portrait (et en paysage mobile, prompt 215), une fenêtre de 640 px est recomposée à ≈ 0,606 px CSS par px de
l'image : un bouton de 72 px y fait **43,6 px CSS**, juste sous la cible de 44 px du projet. 37 cibles mesurées.

## Fait

Les 16 boutons de fenêtre dessinés **seulement en portrait** passent de 72 à 74 px (≈ 44,8 px CSS) : aide (Fermer,
Lancer le tutoriel), mail de fin, rapport de la semaine (rangée d'actions, bloc de 88 → 90 px), installation, partir
(2), blâme, démission (2), palmarès (Fins découvertes, Fermer), galerie des fins (Retour), remise à zéro (2). Les boutons
de 72 px de l'ordinateur ne changent pas (≥ 51 px CSS dès 1366 × 768).

## Vérifié

`npm run build`, `npm test` (+15 contrôles, test 216). Mesure des cibles en px CSS (audit des textes, parcours FR + EN) :
412 × 915 et 915 × 412 — cibles < 44 px CSS 98 → **61**, plus aucune à 43,6 ; 0 défaut de texte.

Reste sous 44 px (rapport 214) : onglets du téléphone, onglets et « × » de la fiche du dossier, boutons de Mails, flèches
de pages de l'aide, « Fermer » du rapport de la veille (64 px), et les 9 objets de la pièce qui ont un grand équivalent.
