# 214 — Mobile : plein écran par défaut, bouton du menu retiré, accessibilité vérifiée

Prompt : `prompts/214-jeu-mobile-plein-ecran-accessibilite.md`. Branche `214-jeu-mobile-plein-ecran-accessibilite`.

## 1. Plein écran

- **Bouton retiré du menu principal** (pile en haut à droite), sur ordinateur comme sur mobile. Restent : la touche F
  et l'interrupteur de Paramètres → Écran. Textes `mp.pleinEcran` et `mp.pleinEcran.quitter` retirés (FR + EN), région
  portrait de la pile recalculée (FR / EN, télécharger).
- **Mobile : plein écran au premier toucher** (`mobile.js`, `pleinEcranMobileAuto`). Le navigateur refuse le plein
  écran sans geste de l'utilisateur ; la demande part donc de `touchend` (`touchstart` n'est pas un geste qui
  l'autorise). Une seule réussite par chargement : un joueur qui sort du plein écran n'y est pas remis de force. Une
  demande refusée est retentée au toucher suivant.
- **Vérifié dans Chromium** (émulation mobile, toucher réel) : plein écran après le premier toucher en 412 × 915 et en
  915 × 412 ; pas de nouvelle demande après la sortie ; rien sur ordinateur (1366 × 768).
- **Limite** : Safari sur iPhone ne donne pas l'API plein écran aux pages (seulement aux vidéos) ; rien ne se passe
  sur iPhone. Le jeu ajouté à l'écran d'accueil s'ouvre, lui, sans barres (`manifest.webmanifest` : `display:
  fullscreen`). Non testé sur un vrai téléphone.

## 2. Accessibilité mobile : mesure

L'audit des textes (`?audit=textes&parcours=1`) comptait les cibles « < 44 px » dans l'image 1920 × 1080, pas à
l'écran. Nouvelle mesure (`audit-textes.js`, `petitesCiblesCSS`) : taille **réelle** de chaque cible en px CSS —
échelle du canevas en paysage et sur ordinateur, échelle de la région recomposée qui la montre en portrait (la plus
grande si elle paraît deux fois), boutons propres au portrait à l'échelle du canevas portrait. Chromium sans
interface, parcours FR + EN (~50 écrans), 14/11/2026.

| Taille | Défauts de texte | Cibles < 44 px CSS (avant → après) | dont < 24 px CSS | Médiane des cibles < 44 |
|---|---|---|---|---|
| 412 × 915 portrait | 9 → **0** | 260 → **98** | 15 → **9** | 35,8 → 38,8 |
| 915 × 412 paysage | 0 → 0 | 423 → 436 | 293 → 310 | 18,5 → 18,3 |
| 1366 × 768 | 0 → 0 | 297 → 286 | 0 → 0 | 31,3 |
| 1920 × 1080 | 0 | 81 | 0 | 41,4 |

Le paysage n'a pas été modifié ; l'écart 293 / 310 vient de l'état du parcours (écrans atteints selon le hasard du
jeu), pas d'un changement de mise en page. Aucune erreur JavaScript pendant les parcours.

## 3. Corrections (portrait)

- **Aide, onglet « Bien démarrer »** (défaut présent sur `main`) : l'objectif s'est allongé avec le prompt 213 (zone
  d'excès) et la liste du tutoriel sortait de la fenêtre, sous « Lancer le tutoriel » et « Fermer » (9 défauts D).
  Quand elle déborde, elle passe dans la suite de la fenêtre (empilée dessous, défilable au doigt, mécanisme du
  prompt 209).
- **Paramètres** (102 cibles à 24–27 px CSS) : en portrait, interrupteurs, curseurs, boutons de choix, FR / EN et pied
  de la fenêtre passent à 74 px (≈ 45 px CSS) ; les six pastilles de couleur, 74 px, passent sous le nom du réglage ;
  barre des volumes par canal élargie. Il reste 0 cible sous 44 px CSS dans les Paramètres. Les cartes étant plus
  hautes, Accessibilité tient sur 4 pages et Avancé sur 6 en portrait (ordinateur inchangé : 2 et 3).
- **Bureau** : les grands boutons des objets (« S'installer au PC », Lampe, Téléphone, Fenêtre, Horloge, Webcam,
  livre « Aide ») passent de 96 à 124 px portrait, soit de 37 à 47 px CSS.

## 4. Ce qui reste (non corrigé ici)

**Portrait (98 cibles < 44 px CSS)** :
- 9 sous 24 px : les objets de la pièce dans l'image du bureau (webcam, horloge, lampe). Chacun a son grand bouton
  équivalent sous l'image (47 px CSS) : exception « contrôle équivalent » du critère WCAG 2.5.8.
- 37 à 43,6 px : les boutons de 72 px des fenêtres du prompt 209 (rapport, palmarès, démission, partir, remise à zéro,
  fins, installation) — 0,4 px sous la cible, à passer à 74 px.
- Poste : onglets du téléphone (35 px), onglets Enquête / Historique et « × » de la fiche (28–33 px), boutons de
  Mails (28–36 px), flèches de pages de l'aide (36 px), « Fermer » du rapport de la veille (39 px).

**Paysage mobile (915 × 412) : le vrai problème.** L'image 1920 × 1080 est réduite à 0,38 : un bouton de 44 px y
fait 17 px CSS ; médiane 18 px, **310 cibles sous le minimum WCAG AA (24 px)** — Paramètres 133, poste 64, enquête
38, Mails 25, téléphone 13. Aucune retouche locale n'y suffit : il faut une mise en page paysage dédiée (comme le
prompt 205 l'a fait pour le portrait), ou recommander le portrait sur téléphone. À décider : prompt à rédiger.

**Autres points vérifiés** : contraste et animations réduites inchangés ; lecteur d'écran : le miroir HTML des
commandes (prompt 210) est présent sur mobile, non testé avec TalkBack ni VoiceOver
(`jeu/210-protocole-tests-humains.md`).

## 5. Tests ajoutés

`test-jeu.mjs` (+72 contrôles) : plein écran automatique (une seule demande, jamais sur ordinateur, rien sans API ni
si déjà actif, nouvel essai après refus, déclenché par `touchend`) ; plus de bouton plein écran dans `menu.js` ;
tailles portrait des Paramètres et du bureau ; aide en portrait ; **chaque script du jeu se compile** (une erreur de
syntaxe dans `parametres.js`, fichier que le test n'exécute pas, est passée inaperçue pendant ce travail ; elle est
maintenant détectée). Tests 193 et 199 mis à jour (bouton retiré).
