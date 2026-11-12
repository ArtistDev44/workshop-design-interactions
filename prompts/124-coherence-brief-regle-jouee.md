# Prompt 124 — Cohérence avec le brief : décrire la règle que le jeu joue vraiment

Demande d'origine (12/11/2026) : prompts tirés de `audit-2026-11-12.md`, section 5.1.

## Constat

- Le cartel, `site/public/grammar.md` et le diaporama présentent le **seuil de 10 minutes de retard** comme le cœur
  de l'œuvre. Or les trois semaines d'archives et le fallback ont `retard: null` sur tous leurs dossiers : le seuil
  ne joue qu'en mode « aujourd'hui » (GTFS-RT), verrouillé tant que le mode histoire n'est pas fini.
- Une semaine d'archives compte 2 à 4 perturbations réelles ; le paquet est complété à 15 par des événements de
  l'agenda que le jeu **suppose** générer de l'affluence.
- La source est déclarée de trois façons : flux GTFS-RT « retards, alertes » (cartel, registre), jeu GTFS
  (manifest), alertes GTFS-RT « propriété écartée » (fiche-source).

## À faire

1. **Règle structurante** reformulée telle qu'elle est jouée, partout où elle apparaît (`grammar.md`, cartel de
   `site/src/content/oeuvres/pxe-nte001-g01-w01.json`, `rendu/…/cartel.md`, `slides/slides.md`) :
   « Un fait daté de la source — perturbation du réseau, météo extrême de la semaine, événement de l'agenda —
   devient un dossier à trancher. En temps réel, un retard mesuré d'au moins 10 minutes en devient un aussi. »
   Le cartel doit rester entre 80 et 120 mots (validé au build).
2. **Assumer l'inférence** : dans `grammar.md` (relations, limites), écrire que l'affluence d'un événement est une
   hypothèse du jeu, pas un fait de la source.
3. **Source unifiée** : un seul libellé pour la source principale (registre, manifest, fiche-source, cartel), sans
   « alertes » si les alertes GTFS-RT sont la propriété écartée.
4. **Test d'équilibrage** : `site/scripts/test-difficulte.mjs` joue encore l'ancienne table
   `devier/retenir/renfort/rien` ; le faire jouer `Jeu.actionsPossibles(d)` ou le marquer obsolète dans
   `jeu/36-tests-difficulte.md`.
5. Mettre à jour `audit-2026-11-12.md` : chaque constat traité par les prompts 120 à 124 est marqué comme tel, avec
   le commit.

## Vérifications

- `grep` : plus aucune mention du seuil de 10 minutes présentée comme règle des archives.
- `npm run build` (le cartel est validé au build), `npm test`.
- `rendu/` resynchronisé.
- `prompts/README.md`, `journal.md`.
