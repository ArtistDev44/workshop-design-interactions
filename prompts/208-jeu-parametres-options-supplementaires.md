# Prompt 208 — Jeu : compléter les Paramètres (son par canal, pause auto, sous-titres sonores, rythme du texte, réinitialiser)

Origine : demande du groupe (13/11/2026). Statut : **à exécuter**.
Fichiers : `site/public/parametres.js`, `confort.js`, `accessibilite.js`, `i18n.js` (FR + EN), `jeu/09-parametres.md`.

## Constat

Les 4 onglets (Écran · Son · Accessibilité · Avancé) couvrent déjà : plein écran, langue, palette, volume
maître, musique, animations réduites, contraste, violence masquée, daltonisme, taille du texte, lecture
facile, intensité des effets, micro, webcam, hors ligne, défi chrono, options de jeu, progression, version.
Il manque des réglages courants des jeux, utiles sur un poste d'exposition et pour l'accessibilité.

## Options à ajouter (chacune dans `DEFAUTS` de `confort.js`, persistée dans `localStorage`)

| Onglet | Id | Type | Défaut | Effet |
|---|---|---|---|---|
| Son | `volumeMusique` | curseur 0–100 (pas de 10) | 100 | gain de l'élément audio de la musique, multiplié par le volume maître |
| Son | `volumeEffets` | curseur 0–100 | 100 | gain des bruitages et des bips d'interface |
| Son | `volumeAmbiance` | curseur 0–100 | 100 | gain de l'ambiance de salle, de la pluie et de la radio |
| Accessibilité | `sousTitresSons` | interrupteur | désactivé | légende courte en bas (« ♪ téléphone qui sonne », « bip d'alerte ») pour chaque son porteur d'information ; annoncée aussi au lecteur d'écran |
| Accessibilité | `rythmeTexte` | choix : instantané / normal / lent | normal | vitesse d'apparition des textes progressifs (dialogues, mails, Community) ; « instantané » si `reduireAnimations` est actif |
| Avancé | `pauseAuto` | interrupteur | activé | met la partie en pause quand l'onglet perd le focus (`visibilitychange` / `blur`) ; reprise à la demande, jamais automatique |
| Avancé | `reinitialiserReglages` | action avec confirmation sur 5 s (même modèle que `carriere`) | — | remet `DEFAUTS` sans toucher aux sauvegardes, aux meilleurs bilans ni à la carrière |

Ne rien ajouter d'autre sans demander. Si une option recoupe un réglage existant (ex. `intensiteFeedback`),
le signaler dans le rapport au lieu de la dupliquer.

## Étapes

1. Lire `parametres.js` (fonction `reglagesParam`) et réutiliser les constructeurs existants
   (`bascule`, `choix`, `action`, type `curseur`) : pas de nouveau composant d'interface.
2. Volumes par canal : reprendre `borneVolume` pour la migration (les anciens réglages sans ces clés passent à 100).
   Un volume maître à 0 coupe tout, comme aujourd'hui.
3. Sous-titres sonores : inventaire des sons porteurs d'information. Pas de sous-titre pour la musique ni pour
   l'ambiance pure. Libellés dans `i18n.js` (FR + EN), aucun texte inventé hors du ton du jeu (`jeu/114-textes.md`).
4. Pause auto : vérifier qu'elle ne bloque ni l'écran de démo d'exposition (`DEMO`) ni la sauvegarde de `sauvegarde.js`.
5. Pagination : si un onglet déborde, la pagination existante (`PARAM.page`) doit suffire. Vérifier à 1920, 1366 et 412.
6. Documenter dans `jeu/09-parametres.md` (section « Prompt 208 »).

## Vérification

- Clavier : ↑ ↓ / Tab parcourent les nouvelles cartes, ← → règlent les curseurs et les choix, Entrée active.
- Chaque changement est annoncé (`annoncer`) avec le nouvel état.
- Rechargement de la page : les valeurs sont conservées ; « Réinitialiser » rend les valeurs de `DEFAUTS`.
- `?audit=textes&parcours=1` : 0 défaut sur l'écran Paramètres aux 3 tailles.
- Contraste ≥ 4,5:1, cibles ≥ 44 px, `prefers-reduced-motion` respecté, aucun flash.
- `npm run build` puis `npm test` ; journal.md, prompts/README.md, jeu/README.md à jour.

## Hors périmètre

Remapping des touches, réglage de la difficulté en cours de partie (verrouillé Q55), compte en ligne ou synchronisation.
