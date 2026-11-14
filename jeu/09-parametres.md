# 09 — Paramètres

## Paramètres réglés (décisions verrouillées Q11–Q16, Q19)
- **Semaine à rejouer** : **liste de 3 semaines réelles proposées** à l'accueil
  (dans les limites de l'API), plus l'option « semaine de référence hors ligne ».
  **Chaque semaine correspond à un niveau de difficulté** (Q55).
- **Mode en ligne / hors ligne** : forcer le fallback local.
- **Durée du compteur** : liée à la semaine choisie (Q16, Q55) — semaine facile
  60 s / normale 30 s / difficile 15 s par décision.
  **Prompt 87 — exception à Q16 / Q55 :** ces durées ne valent plus qu'en mode **« Défi chrono »**
  (Paramètres, touche `0`, désactivé par défaut, enregistré dans `localStorage`, appliqué à la partie
  suivante). Sans défi, la difficulté règle les signalements pris en même temps (3 / 2 / 1), l'aggravation
  (×0,5 / ×1 / ×1,5) et le budget de départ (60 / 50 / 40, exception à Q40 pour le budget).
- **Son** : **ambiance de salle de contrôle + bips d'interface**, activé / coupé (`M`).
- **Accessibilité** : réduction des animations (`prefers-reduced-motion`),
  contraste renforcé, taille du texte.
- **Reset** : touche `R` pour recommencer la semaine.
- **Pause** : touche `P`, uniquement entre deux dossiers.

## Persistance
- Réglages et **meilleur bilan par semaine** conservés en `localStorage`
  (jamais de secret) pour comparer les parties (Q19).
- **Progression d'une partie** (prompt 33) : sauvegarde automatique par semaine dans
  `localStorage`, clé `pxe-nte001-partie-<semaine>` (`<semaine>` = lundi, `fallback`
  ou `direct`). Reprise avec « Continuer la partie » (C) à l'accueil. Section
  **Progression** des Paramètres : Exporter (5, fichier JSON), Copier (6, presse-papiers),
  Importer (7, fichier ou texte collé, validation stricte). Les autres clés (réglages,
  meilleurs bilans, langue, lampe) ne sont jamais touchées. Détails :
  `27-sauvegarde-progression.md`.

## Prompt 208 — réglages ajoutés (14/11/2026)

Tous dans `DEFAUTS` de `site/public/confort.js`, mémorisés dans `localStorage` (clé `pxe-nte001:jeu:reglages`).
Un réglage enregistré avant 208 reçoit les valeurs par défaut ; une valeur abîmée est ramenée dans ses bornes.

| Onglet | Réglage | Défaut | Effet |
|---|---|---|---|
| Son | Volume musique (`volumeMusique`) | 100 % | gain du bus « musique » (morceau composé) et volume de l'élément audio (morceau en fichier), × volume général |
| Son | Volume effets (`volumeEffets`) | 100 % | bus « effets » : bips, signaux, alertes de signalement, tic-tac, jauges, signature de fin, clics, cœur du café |
| Son | Volume ambiance (`volumeAmbiance`) | 100 % | bus « ambiance » : souffle et ventilation de la salle, pluie, ville, vent, cigales, tram, radio |
| Accessibilité | Sous-titres des sons (`sousTitresSons`) | désactivé | légende en bas de l'écran (3 s, 3 au plus) et annonce au lecteur d'écran |
| Accessibilité | Rythme du texte (`rythmeTexte`) | normal | instantané / normal / lent (×0 / ×1 / ×2) : « … » avant un SMS (650 ms), « Direction écrit… » avant un mail (800 ms) ; toujours instantané si les animations sont réduites |
| Avancé | Pause automatique (`pauseAuto`) | activée | onglet masqué ou fenêtre du jeu qui perd le focus en partie → le menu du jeu s'ouvre (le temps y est suspendu, prompt 174) ; reprise à la demande |
| Avancé | Réinitialiser les réglages | — | confirmation sur 5 s (comme « Remettre à zéro » la carrière), puis `DEFAUTS` |

**Volumes** : trois gains (`Son.bus`) entre les sons et le gain maître ; le volume général à 0 coupe toujours tout. Chaque
curseur se règle aussi au clavier (← →, pas de 10) et annonce sa nouvelle valeur.

**Sous-titres** : la légende décrit le son entendu, pas l'événement (« ♪ bip d'alerte », « ♪ double bip ») : un même bip
sert à plusieurs événements, l'écran dit lequel. Seules les alertes de signalement disent leur source
(« ♪ sirène : alerte météo »). Sons légendés : bips `alerte`, `consequence`, `mail`, `dossier`, `action` (validation),
`fin` ; signaux d'arrivée de signalement (4 sortes) ; radio liée à une ligne ; tic-tac du défi chrono (au plus toutes
les 4 s) ; chute ou hausse des jauges ; signature de fin ; battements de cœur du café (au plus toutes les 10 s). Pas de
légende pour la musique, l'ambiance (radio d'ambiance comprise) ni les clics d'interface (bip `choix`, `Son.clic`).
Les légendes s'affichent même son coupé. Une même légende ne revient pas avant 1,2 s (trois bips d'alarme = une légende).

**Pause automatique** : rien ne se passe au menu principal (donc ni sur la démo d'exposition), en cinématique, sur la
lettre de licenciement, ni si une fenêtre, les SMS ou le tutoriel sont déjà affichés. La sauvegarde à la sortie de
l'onglet (`sauvegarde.js`) est inchangée.

**Réinitialiser** : ne touche ni aux sauvegardes de partie, ni aux meilleurs bilans, ni à la carrière (clés à part),
ni à la langue ni à la couleur principale (réglages rangés hors de `DEFAUTS`). En exposition, les commentaires violents
restent masqués (prompt 210). Effets appliqués tout de suite : son, morceau, volumes, animations, palette, taille du
texte ; la webcam est coupée (désactivée par défaut).

**Recoupements signalés, non dupliqués** :
- « Secousses des décisions » (`intensiteFeedback`) règle déjà l'intensité des effets visuels : le volume des effets
  ne la remplace pas, l'un est visuel, l'autre sonore.
- « Lecture facile » allonge déjà le compte à rebours (×1,5) : le rythme du texte ne touche pas aux comptes à rebours.
- La « pause » du jeu (touche P, Q13) ne s'ouvre qu'entre deux dossiers ; la pause automatique passe par le menu du
  jeu, qui suspend le temps à tout moment (prompt 174).

**Limites** :
- En « Défi chrono », le compte à rebours d'un dossier suit le temps réel (`millis()`) : ni le menu du jeu ni la pause
  automatique ne l'arrêtent (comportement d'avant 208, non modifié ici).
- Le « X écrit… » de Community suit l'heure du jeu (15 min avant l'arrivée du commentaire) : ce n'est pas un texte
  progressif, le rythme du texte ne le change pas.
- La pause automatique réagit aussi à la perte de focus provoquée par une fenêtre du navigateur (demande d'accès au
  micro, sélecteur de fichier) ; elle est sans effet si la fenêtre des Paramètres est ouverte (import d'une sauvegarde).
- Vérification à l'oreille et avec un lecteur d'écran réel : à faire (`jeu/210-protocole-tests-humains.md`).

**Vérifié** : `npm test` (dont 68 contrôles du prompt 208 dans `test-jeu.mjs` : défauts, migration, bornes, légendes et
leur absence, annonces, textes FR + EN, réinitialisation sans toucher aux bilans, câblage des bus) ; audit des textes
`?audit=textes&parcours=1` étendu à toutes les pages des Paramètres : 0 défaut en 1920 × 1080, 1366 × 768, 412 × 915
et 915 × 412 ; dans Chromium, perte de focus en partie → menu du jeu ouvert et temps suspendu, rien au menu principal
ni réglage désactivé, aucune erreur JavaScript. Pages : Son 1 (2 en portrait), Accessibilité 2 (3), Avancé 3 (6).
