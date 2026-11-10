# Prompt 46 — Finalisation des livrables J3 et documentation (making-of, cartel, guide contributeur)

Demande d'origine (10/11/2026) — parties « 1. Ce qui est déjà prévu mais pas encore fait » et
« 7. Site et documentation » de la liste d'ajouts proposée :

> Prompt 45 (météo progressive + SEO) · Livrables J3 manquants : manifest.json, captures
> (hero.jpg, demo.mp4…), QR codes à régénérer vers l'URL canonique Cloudflare, version finale
> archivée dans un dossier distinct · Champs [À COMPLÉTER] : auteurs, contributions
> nominatives, AI usage, licence du code (MIT recommandée), groupe G01 à confirmer · Cartel à
> relire : cite encore « satisfaction des usagers » au lieu de « budget » (remplacé au prompt 22)
> · Page /cartel/ enrichie : intégrer les captures réelles du jeu, le QR code fonctionnel, et le
> manifest · Historique des versions du jeu : une page listant les prompts comme « making-of »
> (la chaîne source → grammaire → système → œuvre rendue visible) · Guide contributeur :
> comment ajouter une semaine, un message, une traduction

## Attendu
1. **Statut** : le prompt 45 est fait (vérifier et corriger les statuts de `prompts/README.md`).
2. **`manifest.json`** au modèle « Manifest minimal » du livret (annexe C), rempli uniquement
   avec des informations présentes dans le dépôt ; `authors` = `[À COMPLÉTER]`.
3. **Captation** depuis le **vrai rendu** du jeu : `hero.jpg`, `detail-01.jpg`, `process.jpg`,
   `thumb.jpg` et `demo.mp4` (20–30 s, enregistrement d'une vraie partie).
4. **QR codes** : vérifier qu'ils visent l'URL canonique (déjà régénérés).
5. **Version finale archivée** dans `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/` (structure
   recommandée du livret : jeu lançable, README, manifest, cartel, fiche-source, grammaire,
   captures).
6. **Cartel** : remplacer « satisfaction des usagers » par « budget » (correction factuelle) ;
   la relecture finale reste au groupe.
7. **`[À COMPLÉTER]`** : ne rien inventer (noms, contributions, licence) ; les lister.
8. **Page `/cartel/`** enrichie : captures, QR code, lien vers le manifest.
9. **Page `/making-of/`** : la chaîne des prompts, générée depuis `prompts/README.md`.
10. **`CONTRIBUTING.md`** : ajouter une semaine, un message (`messages.json`), une traduction.

## Vérifications
- `npm run build`, `npm test` ; captures et vidéo issues du jeu ; liens des pages. Fusion `main`.
