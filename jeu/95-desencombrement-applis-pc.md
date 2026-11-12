# 95 — Désencombrer les applis du PC pour mettre en valeur le design system (prompt 101)

Soustraction, pas refonte : aucune couleur, police, composant ni fonctionnalité ajoutés ; game.js, Q1–Q61 et les
données inchangés. Chaque information retirée de la vue d'ouverture reste atteignable en **une action au plus**
(clic, survol/focus, touche V, onglet), au clavier comme à la souris.

## Mesure : `?audit=densite` (outil de développement)
- `site/public/audit-densite.js`, chargé **seulement** avec `?audit=densite` (chargeur d'`installation.js`) ;
  `&parcours=1` enchaîne les vues en partie **vide** (jour 1) et en **milieu de semaine** (jour 3, inspection répondue).
- Aides du parcours partagées avec `?audit=textes` (prompt 93) : `audit-parcours.js` (`attendreImages`, `H`).
- Compte, dans la zone de la vue (fenêtre d'appli, bureau, Indicateurs, Signalements) et **seulement ce qui est
  visible** (masques `clip()` des listes défilantes suivis) : éléments (textes, titres, boutons, badges, blocs
  colorés, images), boutons primaires, tailles de texte (libellés de boutons exclus : règle 4 = niveaux de *texte*),
  surface rouge `#D4031C` / `#D10B00`, profondeur de cadres imbriqués.
- Rapports : `jeu/101-densite-avant.json` (code de `main`, même outil) et `jeu/101-densite-apres.json`, 1920×1080, FR.

## Avant / après (vues d'ouverture)
| Vue | Éléments avant → après | Primaires | Tailles de texte | Rouge % | Cadres imbriqués | Badges |
|---|---|---|---|---|---|---|
| Bureau + barre des tâches — vide | 50 → 48 (-4 %) | 0 → 0 | 3 → 3 | 0.6 → 0.5 | 2 → 2 | 2 → 0 |
| Patron — vide | 38 → 30 (-21 %) | 1 → 0 | 3 → 3 | 0.7 → 0 | 2 → 2 | 0 → 0 |
| Community · fil — vide | 26 → 21 (-19 %) | 0 → 0 | 3 → 3 | 0.4 → 0.4 | 1 → 1 | 1 → 0 |
| Community · mentions — vide | 26 → 21 (-19 %) | 0 → 0 | 3 → 3 | 0.4 → 0.4 | 1 → 1 | 1 → 0 |
| Community · messagerie — vide | 25 → 20 (-20 %) | 0 → 0 | 3 → 3 | 0.4 → 0.4 | 1 → 1 | 1 → 0 |
| Community · stats — vide | 30 → 27 (-10 %) | 0 → 0 | 3 → 3 | 0.4 → 0.4 | 1 → 1 | 1 → 0 |
| Journal · jour — vide | 63 → 34 (-46 %) | 2 → 0 | 4 → 3 | 2 → 0.5 | 2 → 2 | 1 → 0 |
| Journal · semaine — vide | 66 → 53 (-20 %) | 1 → 0 | 2 → 2 | 0.8 → 0 | 2 → 2 | 0 → 0 |
| Corbeille — vide | 5 → 4 (-20 %) | 0 → 0 | 2 → 2 | 0 → 0 | 1 → 1 | 0 → 0 |
| Indicateurs — vide | 24 → 24 (0 %) | 0 → 0 | 3 → 3 | 0 → 0 | 1 → 1 | 0 → 0 |
| Signalements — vide | 32 → 32 (0 %) | 0 → 0 | 5 → 5 | 5 → 5 | 2 → 2 | 0 → 0 |
| Bureau + barre des tâches — milieu de semaine | 52 → 48 (-8 %) | 0 → 0 | 3 → 3 | 0.7 → 0.5 | 2 → 2 | 4 → 0 |
| Patron — milieu de semaine | 43 → 36 (-16 %) | 1 → 0 | 3 → 3 | 0.8 → 0.1 | 2 → 2 | 0 → 0 |
| Community · fil — milieu de semaine | 53 → 48 (-9 %) | 0 → 0 | 3 → 3 | 0.8 → 0.6 | 3 → 2 | 2 → 0 |
| Community · mentions — milieu de semaine | 62 → 57 (-8 %) | 0 → 0 | 3 → 3 | 1.8 → 0.4 | 1 → 1 | 8 → 0 |
| Community · messagerie — milieu de semaine | 32 → 27 (-16 %) | 0 → 0 | 3 → 3 | 0.4 → 0.4 | 1 → 1 | 1 → 0 |
| Community · stats — milieu de semaine | 37 → 34 (-8 %) | 0 → 0 | 3 → 3 | 0.4 → 0.4 | 1 → 1 | 1 → 0 |
| Journal · jour — milieu de semaine | 106 → 75 (-29 %) | 2 → 0 | 3 → 2 | 2.9 → 0.7 | 2 → 2 | 5 → 0 |
| Journal · semaine — milieu de semaine | 93 → 66 (-29 %) | 1 → 0 | 2 → 2 | 0.8 → 0 | 2 → 2 | 0 → 0 |
| Journal · fiche enquête — milieu de semaine | 22 → 26 (+18 %) | 0 → 0 | 4 → 4 | 0.3 → 0.3 | 2 → 2 | 1 → 1 |
| Corbeille — milieu de semaine | 5 → 4 (-20 %) | 0 → 0 | 2 → 2 | 0 → 0 | 1 → 1 | 0 → 0 |
| Indicateurs — milieu de semaine | 26 → 26 (0 %) | 0 → 0 | 3 → 3 | 0 → 0 | 1 → 1 | 0 → 0 |
| Signalements — milieu de semaine | 35 → 35 (0 %) | 0 → 0 | 5 → 5 | 0.8 → 0.8 | 2 → 2 | 0 → 0 |

## Ce qui a changé, et où se trouve maintenant l'information
| Vue | Changement | Où est l'information | Actions |
|---|---|---|---|
| Journal · jour | 6 tuiles (sparklines, détail équipes, thème, XP) → une ligne de chiffres | bouton « Détails (V) » (fantôme) ou touche V | 1 |
| Journal · jour | 5 boutons de filtres à compteurs → un sélecteur « Afficher : Tout (4) » | clic = filtre suivant ; Tab → zone filtres puis ← → (inchangé) | 1 |
| Journal · jour | « Enquêter » / « Voir Community » sur chaque carte | au survol ou au focus (↑ ↓) de la carte ; toujours visibles en tactile/mobile ; Entrée ouvre l'enquête | 1 |
| Journal · jour | badges pleins « ✗ raté / ✓ bon… » | même symbole + mot, en couleur claire ; le liseré de la carte garde la couleur pleine | 0 |
| Journal | Jour / Semaine actif en rouge plein | variante « secondaire » (blanc) ; seul le jour sélectionné reste rouge | 0 |
| Journal · semaine | barres verticales des jauges (doublaient les chiffres, règle 7) | chiffres « F · R · B » de chaque journée ; évolution sur la courbe de la semaine | 0 |
| Journal · semaine | tuiles « à venir » encadrées vides | une phrase en blanc 50 % | 0 |
| Journal · fiche enquête | numéros des volets dans le libellé | numéro en texte secondaire (blanc 50 %), touches 1–4 inchangées | 0 |
| Community | compteurs du compte (publications, abonnés, réponses) et bio dans l'en-tête | onglet Statistiques (← → au clavier) | 1 |
| Community | badge bleu « compte de service » | texte bleu clair après le nom | 0 |
| Community | bannière 70 px | 52 px | — |
| Community | tous les commentaires sous chaque post | le premier (et toute plainte qui attend une réponse), puis « Voir les N autres » ; tous les commentaires restent listés dans Mentions | 1 |
| Community | badges rouges/verts « −3 rép. » sur chaque commentaire | effet en texte coloré (clair) | 0 |
| Community | fond sur les 4 onglets ; cadre autour des photos | fond sur l'onglet actif seulement ; photo sans cadre (2 niveaux de cadres au plus) | 0 |
| Patron | filtres à compteurs, actif en rouge plein | compteur sur le filtre actif seulement, actif en « secondaire », autres en « fantôme » ; ← → inchangés | 1 |
| Patron | blocs enrichis (puces de consigne, rappel du reproche + « Voir le dossier », palier de budget, effectifs) | repliés en une ligne (« Dossier lié : … › » / « Détails › »), dépliés au clic ou par V (tous) ; le **dernier** message reste déplié | 1 |
| Patron | séparateurs de jour avec traits ; « Nouveaux messages » en rouge | texte blanc 50 % seul ; trait blanc 50 % d'1 px | 0 |
| Patron | textes 16 px (type, accusé, puces) | 18 px (niveau secondaire) : 3 niveaux 32 / 20 / 18 | — |
| Bureau, barre des tâches | badges « nouveaux messages » (Patron, Community) et « ● » Indicateurs | badge seulement pour ce qui est **à faire** : plaintes Community qui attendent une réponse ; nouveaux messages annoncés par les notifications et « Nouveaux messages » | 1 |
| Corbeille | phrase d'intro « 0 … » + « vide » | une phrase en blanc 50 % | 0 |
| Signalements | titre à 16 px du bord | marge 24 px (`DS.esp.xxl`) comme les autres applis ; barre de 34 px conservée (HUD verrouillé au prompt 98) | — |

Déjà conformes, vérifiés : réponses rapides du Patron sous le **dernier** message seulement ; mini-jauge seulement
pour un message qui parle d'une jauge précise ; brouillon Community visible seulement s'il existe ; volets de la
fiche d'enquête un à la fois.

## Décisions de groupe (§ 6) — non tranchées, choix conservateur appliqué
| # | Question | Appliqué |
|---|---|---|
| D1 | Rouge réservé à l'action primaire seule, ou aussi à l'élément le plus urgent ? | [À COMPLÉTER] — état actuel gardé : rouge pour la sélection (jour du Journal, onglet actif), le primaire et le liseré d'un dossier raté ; tout le reste en blanc ou en couleur claire |
| D2 | Panneau Indicateurs replié par défaut ? | [À COMPLÉTER] — non modifié |
| D3 | Colonne Nantes de Community : masquée sous quelle largeur, ou déplacée en onglet ? | [À COMPLÉTER] — non modifiée (déjà absente en portrait) |
| D4 | Actions secondaires du Journal : menu « … » ou raccourcis visibles ? | [À COMPLÉTER] — non modifié (« Copier le résumé (C) » reste en bas à gauche) |

## Écarts aux cibles du § 5, justifiés
- **−30 % d'éléments** atteint ou approché sur le Journal (jour −29 / −46 %, semaine −29 / −20 %), pas sur Community
  (−8 à −20 %) ni Patron (−16 / −21 %) : la colonne Nantes (D3) et les cartes de messages restent ; un contenu
  réel n'est pas retiré.
- **Fiche enquête +18 %** : les numéros de volet sont désormais des textes séparés (demandé au § 4).
- **Signalements** : 5 tailles de texte et 5 % de rouge en jour 1 — vue hors périmètre (prompts 87, 98), seul
  l'alignement est fait ici.
- **Indicateurs** : inchangé (D2).
