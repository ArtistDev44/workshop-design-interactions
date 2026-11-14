# 210 — Protocole des tests humains (après les corrections du prompt 210)

Les audits 201, 203 et 206 ont été faits par des robots (Chromium sans interface, sans GPU). Ils ne disent ni si le
jeu est compris, ni s'il est fluide sur le PC d'exposition, ni s'il marche avec un vrai lecteur d'écran. Ce protocole
dit **quoi tester, avec qui, et quoi noter**. Les résultats vont dans `notes.md` (§ « Gabarit à remplir — Tests
humains ») : **aucun résultat n'est inventé ici**, tout ce qui dépend d'une séance reste `[À COMPLÉTER]`.

## 1. Séance de 5 joueurs (45 min au total, 1 animateur + 1 preneur de notes)

- **Qui** : 5 personnes qui n'ont jamais vu le jeu, dont au moins 1 qui joue rarement et 1 sur téléphone.
- **Consigne unique** : « Voici un jeu sur les transports nantais. Jouez comme vous voulez, en parlant à voix haute. »
  Aucune aide tant que le joueur n'est pas bloqué plus de 60 s.
- **Durée** : 8 min de jeu par personne, puis 2 questions (« Qu'est-ce qu'il fallait préserver ? », « Qu'est-ce qui
  vous a gêné ? »).
- **À noter** (une ligne par joueur dans `notes.md`) : décision n° et temps où le but est compris ; première erreur de
  compréhension ; entrées utilisées (souris, clavier, glisser, téléphone) ; ressenti du game feel ; un verbatim exact.
- **Après la séance** : les 3 frictions les plus citées → un prompt chacune (on mesure ici, on ne corrige pas).

## 2. Poste d'exposition (15 min)

| Contrôle | Comment | Attendu | Résultat |
|---|---|---|---|
| Fluidité au poste | Partie lancée, au poste, console du navigateur : `setInterval(() => console.log(Math.round(frameRate())), 1000)` pendant 30 s | ≥ 30 images/s (avant le prompt 210 : ≈ 15 sur une machine sans GPU, mesure robot) | [À COMPLÉTER] |
| Visiteur suivant | `?expo=1`, allumer la webcam, attendre le rechargement d'inactivité (90 s + 15 s) | voyant webcam éteint, aucune demande de caméra au geste suivant | [À COMPLÉTER] |
| Commentaires violents | `?expo=1`, jouer jusqu'aux messages Community | commentaires injurieux masqués, réglage absent des Paramètres | [À COMPLÉTER] |
| Hors ligne | câble réseau débranché, page rechargée | jeu jouable, appli « Données » avec 6 dossiers | [À COMPLÉTER] |
| Avertissement | écran titre | « Contient des propos injurieux… · conseillé dès 12 ans » lisible à 1 m | [À COMPLÉTER] |

## 3. Téléphone réel (10 min)

- Un Android et un iPhone, en portrait puis en paysage, une partie de 5 décisions au pouce seul.
- Noter : fluidité ressentie, textes trop petits (écran et mot), gestes ratés, pincement pour zoomer (désormais permis).
- Résultats : [À COMPLÉTER].

## 4. Lecteur d'écran (20 min, idéalement avec une personne qui l'utilise au quotidien)

Le prompt 210 ajoute une liste de commandes HTML (`#commandes-jeu`), le texte de l'écran (`#texte-ecran`) et une file
d'annonces (`role="log"`). C'est **non testé avec un vrai lecteur d'écran**.

| Lecteur | Scénario | Résultat |
|---|---|---|
| NVDA + Firefox (Windows) | Tab depuis le haut de la page → liste des commandes de l'écran titre → « Nouvelle partie » → poste → choisir une équipe | [À COMPLÉTER] |
| VoiceOver + Safari (macOS ou iPhone) | Rotor « Repères » → « Commandes de l'écran », puis « Texte de l'écran » | [À COMPLÉTER] |
| Annonces | deux actions rapprochées : les deux annonces sont-elles lues ? | [À COMPLÉTER] |

Limite connue : les textes dessinés dans des tampons hors écran (Community, une partie du bureau) ne sont pas relevés,
et certaines commandes à icône seule restent « Commande n (sans libellé) ».

## 5. Raccourcis et zoom (5 min)

- Paramètres → Accessibilité → « Raccourcis d'une lettre » désactivé : Z seul ne fait plus rien, Maj + Z lance la
  sieste. Résultat : [À COMPLÉTER].
- Taille du texte à 160 % puis 200 % : relever les écrans où un texte déborde ou se chevauche. Résultat : [À COMPLÉTER].
