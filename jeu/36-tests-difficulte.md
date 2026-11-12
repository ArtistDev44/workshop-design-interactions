# 36 — Trois tests de difficulté et rééquilibrage (10/11/2026)

> **Historique (prompt 134, 12/11/2026).** Ces résultats décrivent la table `devier / retenir / renfort / rien` et le
> compteur par décision, remplacés au prompt 87. Ils ne décrivent plus le jeu. L'équilibrage actuel est vérifié dans
> `site/scripts/test-jeu.mjs` (prompt 130) ; voir `jeu/130-134-audit-experience-rendu.md`.

## Méthode
Simulation dans Chromium, sur la vraie logique du jeu (`game.js`), sans interface ni temps réel. Script : `site/scripts/test-difficulte.mjs`.
- Les trois semaines réelles : facile (14/09, compteur 60 s), normale (02/11, 30 s), difficile (12/10, 15 s).
- 15 dossiers par semaine, avec changements de journée, objectifs du jour (bonus et malus) et plaintes des Nantais.
- Les modificateurs de journée, les équipes et la sieste ne sont pas simulés.
- Profils de joueur :
  - **expert** : à chaque dossier, essaie les 4 actions sur une copie de l'état et garde la meilleure ; bonne source en cas de contradiction ; bonne réponse aux plaintes ;
  - **moyen** : action, source et réponses au hasard (5 parties) ;
  - **passif** : laisse toujours le compteur arriver à 0 (conséquences naturelles, Q25) ;
  - **sous pression** : joue comme l'expert, mais rate une part des dossiers faute de temps — 5 % à 60 s, 15 % à 30 s, 30 % à 15 s (**hypothèse**, 5 parties).
- Fins (inchangées) : bonne ≥ 240, moyenne ≥ 150, sinon mauvaise.

## Test 1 — réglages d'origine
| Semaine / profil | Score moyen | Fins |
|---|---|---|
| Toutes / expert | 192 (budget à 0) | moyenne |
| facile / moyen | 136 | mauvaise ×3, moyenne ×2 |
| normale / moyen | 118 | mauvaise |
| difficile / moyen | 115 | mauvaise |
| passif | 92–115 | mauvaise |

**Constats :**
- La **bonne fin est inatteignable**, même pour l'expert : le budget s'épuise, parce que seule « Retenir » en rapporte (+2).
- Jouer au hasard vaut à peine mieux que ne rien faire.

## Test 2 — exploration de réglages (semaine facile)
Seules les **valeurs** de base des actions sont modifiées. Les règles Q57–Q61 ne changent pas : le dé amplifie l'effet, la réputation de « Retenir » vaut +4 / +8 (Q58), « Ne rien faire » coûte −2 à −8.

| Réglage (dévier / retenir / renfort) | Expert | Moyen | Passif |
|---|---|---|---|
| d'origine `[-6,6,-3] / [-7,·,2] / [12,4,-12]` | 192 moyenne | 136 | 92 |
| `[-4,7,-2] / [-5,·,4] / [12,4,-9]` | 235 moyenne | 172 | 92 |
| **`[-3,8,-1] / [-4,·,5] / [13,5,-8]`** (retenu) | **258 bonne** | **200 moyenne** | **92 mauvaise** |
| `[-2,9,-1] / [-4,·,6] / [14,5,-7]` | 273 bonne | 212 (une bonne) | 92 |

Le réglage retenu sépare nettement les trois niveaux de jeu. Le dernier rend la bonne fin trop facile.

## Test 3 — réglage retenu, trois semaines
| Semaine | Expert | Moyen | Passif | Sous pression |
|---|---|---|---|---|
| facile (60 s) | 258 bonne | 200 moyenne | 92 mauvaise | 254 bonne ×5 |
| normale (30 s) | 238 moyenne (à 2 points de la bonne) | 192 moyenne | 115 mauvaise | 250 bonne ×4, moyenne ×1 |
| difficile (15 s) | 258 bonne | 173 (mauvaise ×2) | 110 mauvaise | 253 bonne ×5 |

**Constats :**
- La hiérarchie est saine : bien jouer → bonne fin, jouer au hasard → fin moyenne, ne rien faire → mauvaise fin.
- La semaine difficile pénalise bien le jeu au hasard.
- Le compteur court pèse peu dans le score, même avec 30 % de dossiers ratés. La règle verrouillée Q25 n'ajoute aucun malus au compteur à 0, et la réputation de l'expert plafonne à 100. La difficulté réelle d'une semaine rapide reste la pression du temps sur un joueur humain, que la simulation ne mesure pas.
- Piste, non appliquée car elle modifierait une décision verrouillée (Q25) : un petit malus de réputation sur les dossiers expirés renforcerait l'écart entre semaines. Il faudrait la décider en groupe.

## Ajustement appliqué
- `game.js`, `REGLAGES.effets` :
  - Dévier : `[-3, 8, -1]` ;
  - Retenir : `[-4, null, 5]` ;
  - Renfort : `[13, 5, -8]`.
- La table de `16-bureau-apps.md` est mise à jour.
- Une sauvegarde existante se reprend avec les nouveaux effets pour les dossiers à venir.
