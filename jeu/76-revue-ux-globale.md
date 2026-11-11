# 76 — Revue UX globale (prompt 80)

Rapport complet : `notes.md`, section « Revue UX du 11/11/2026 (prompt 80) ». `game.js` **inchangé**.

## Corrections (un commit chacune, par ordre de gravité)
1. **Bloquant — bandeau d'état et somnolence** (`dd73c46`) : dans l'appli, les textes ne descendent pas sous 20 px
   (prompt 49), donc un message trop long déborde au lieu de rétrécir. Messages du bandeau raccourcis (FR + EN,
   ≤ 100 caractères), jauge « Somnolence 42 · Z » en un seul libellé (aide au survol : « Clic ou Z : se reposer… »),
   indicateur « Partie sauvegardée » déplacé entre les jauges et le dossier.
2. **Confus — notifications** (`ee6f913`) : quand l'appli de jeu ou une appli de RégulOS est ouverte, la dernière
   notification s'affiche en une ligne dans la barre des tâches (entre les icônes et les jauges, « +n » s'il y en a
   d'autres), cliquable ; la pile en haut à droite reste sur le bureau RégulOS vide et sur la vue bureau.
3. **Confus — aide (H)** (`e087a00`) : règles réécrites plus court et taille ajustée automatiquement pour tenir en
   entier ; raccourcis Z, Tab (objets, signalements actifs, logo RégulOS), ↑ ↓ (liste, réponses d'alerte, semaine).
4. **Mineur — couleurs** : l'aide explique rouge (urgent), orange (attention), vert (bon choix), bleu (Community,
   somnolence).

## Vérifications
- `npm run build`, `npm test` verts après chaque commit.
- Chromium : tour complet des écrans FR, semaines complètes FR (animations réduites) et EN, portrait mobile ;
  aucune erreur console.
- Reste à faire par le groupe : test d'un joueur qui découvre le jeu (tutoriel + première journée).
