# Prompt 204 — Corrections de l'audit UX (constats 2 à 7)

Date : 13/11/2026. Branche `204-jeu-corrections-audit-ux`. Audit de référence : `jeu/203-audit-ux.md`.
Le constat 1 (mobile portrait) fait l'objet du prompt 205, rédigé et non exécuté.
Captures après correction : `jeu/204-captures/`.

## Ce qui a changé

| Constat | Correction | Fichiers |
|---|---|---|
| 2 · Community : Entrée pouvait envoyer le clash | `focusReponse` vaut −1 (aucune réponse) à l'ouverture, après chaque réponse et au changement de conversation ; le premier Tab prend la 1ʳᵉ réponse (Maj + Tab la dernière) ; Entrée / Espace sans choix n'envoie rien et annonce « Choisissez d'abord une réponse : Tab pour les parcourir, ou 1, 2, 3. » ; la réponse focalisée a un contour blanc de 4 px au lieu d'un fond rouge | `os.js`, `sketch.js`, `community.js`, `i18n.js` |
| 3 · Prise en main surchargée | Une idée par étape : jauges (3 noms + seuils 40 / 20), somnolence (monte, Z pour se reposer, les signalements s'accumulent), prendre (le marqueur, clic ou ↑ ↓ Entrée), répondre (horloge en pause, 1 à 3), Aide ; seuils du patron 120 / 90 et « ×100 » retirés du guide (ils sont dans l'Aide, onglet Règles) ; la cible de l'étape des jauges couvre les trois jauges seules (avant : tout le bandeau, flèche sur « Priorités ») | `i18n.js`, `panneau.js` |
| 4 · Jargon | Sous les réponses : « Fluidité ▲ Réputation ≈ Budget ▼ » au lieu de « Flu. Rép. Bud. » ; Journal : « Fluidité +11 · Réputation 0 · Budget −4 » au lieu de « F +11 R 0 B -4 » ; équipes : « 3/3 libres · coût 10 » au lieu de « 3/3 disponible · −10 » ; consigne : « … (ou Maj + 1 à 4). Chaque envoi coûte du budget. » ; « Somnolence 9 % · Z : repos » | `i18n.js`, `carte-alertes.js`, `journal.js` |
| 5 · La fiche cachait la carte | La fiche du dossier est toujours à gauche de la carte ; à l'ouverture d'un signalement (clic sur son marqueur, ou Entrée), la carte zoome ×4 sur son lieu et le place au centre de la partie libre, à droite de la fiche, à côté du panneau des équipes (`cadrerSur`) ; le bouton « recentrer » fait de même ; la carte peut dépasser l'emprise d'une demi-largeur pour qu'un lieu au bord vienne lui aussi dans la partie libre. Les signalements sans lieu connu restent groupés dans la partie libre. | `carte-alertes.js`, `panneau.js` |
| 6 · Chevauchements | Tampon « SIGNALEMENT » : s'efface après 1,8 s (fondu 0,3 s ; retiré sans fondu si les animations sont réduites) ; Données : la source se place selon son nombre réel de lignes, juste au-dessus du bouton ; Journal : carte de signalement à 116 px, puce de réponse à 32 px ; Indicateurs : masqués pendant un dossier (les jauges restent dans le bandeau), détails empilés selon leur hauteur réelle, panneau qui grandit au besoin | `feedback.js`, `donnees.js`, `journal.js`, `os.js` |
| 7 · « (s) » | `t()` accorde les « mot(s) » au nombre de la variable `{x}` la plus proche avant (sinon après) : pluriel à partir de 2 en français, sauf 1 en anglais ; liste en texte → pluriel ; sinon « (s) » gardé. Les 133 chaînes en profitent sans être réécrites. Accords faux corrigés (« attendus », « prévus », « issus », « denses ou bloqués ») ; « avertissement(s) du patron » prend son nombre. Fin de semaine : la ligne « Objectifs du jour tenus : 0/0. On peut faire mieux. » n'apparaît plus quand aucun objectif n'était fixé. « Game over » → « Fin de mission » (FR) | `i18n.js`, `journal.js`, `game.js` |

## Vérifications

- `npm run build` : vert. `npm test` : 645 + 5 933 contrôles réussis (trois tests du prompt 95, 162 et 163 attendaient
  les anciens « (s) » ; leurs expressions acceptent maintenant singulier et pluriel).
- Audit des textes (`?audit=textes&parcours=1`, FR + EN, contraste normal et renforcé) : **0 défaut** en 1920 × 1080,
  1366 × 768 et 412 × 915. Avant : 3 défauts sur Données et 9 sur Indicateurs dans les états capturés par l'audit 203.
- Vérifié à l'écran (1366 × 768) : dossier « alerte météo » ouvert → zoom ×4, marqueur à droite de la fiche et à côté
  des équipes (capture 03) ; Community sans réponse surlignée ; Journal, Données et mail de fin de semaine sans
  chevauchement ; « 1 dossier traité sur 16 ».
- Non vérifié : lecteur d'écran réel ; ressenti joueur `[À COMPLÉTER]`.

## Limites

- Un signalement sans lieu connu (ex. événement de l'agenda hors du réseau) ne peut pas être zoomé : son marqueur reste
  dans le groupe « sans lieu », en bas de la partie libre.
- L'accord automatique ne traite que « (s) » ; les formes « (e) » ou « ·e » ne sont pas concernées.
- Mobile portrait : inchangé, voir prompt 205.
