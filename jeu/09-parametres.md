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
