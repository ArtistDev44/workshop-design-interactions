# Prompt 43 — Jeu « Nantes en régulation », étape 30 : vue PC à 90 %, UX de l'écran de jeu, temps ×30, transitions entre journées

Demande d'origine (10/11/2026, reprise telle quelle) :

> en mode ordinateur, réduis l'éspacement en dessous du PC. Il ne doit y'avoir que 10% de
> non-écran. Aussi, supprime les indicateurs redondants dans l'application régulation.
> Améliore l'UX sur la vie ordinateur (de l'écran du jeu) pour une meilleure compréhension
> du jeu. Le temps accéléré doit être x30. Aussi, les animations entre journée doivent être
> crées avec un écran avec des variables "fond noir - jour 1 semaine 2" centré".

Les décisions Q1–Q61 ne changent pas.

## Attendu
1. **Vue au poste** : l'écran du PC occupe 90 % de l'écran (10 % de « non-écran »), en
   réduisant surtout l'espace sous le PC ; le bouton « Quitter le PC » reste accessible.
2. **Indicateurs redondants** retirés de l'appli Régulation (informations affichées deux
   fois sur le même écran), sans perdre d'information.
3. **UX de l'écran de jeu** : ce qu'il faut faire maintenant (bandeau d'état selon la
   phase), effets attendus des actions sur les trois jauges, repères de seuils sur les
   jauges — uniquement à partir des règles réelles du jeu.
4. **Temps accéléré ×30** (au lieu de ×10) et textes mis à jour.
5. **Transition entre journées** : écran noir centré « JOUR n — SEMAINE n » (ou « TEMPS
   RÉEL ») et la date, quelques secondes, temps suspendu ; Entrée / clic pour passer ;
   animations réduites : sans fondu.

## Vérifications
- `npm run build`, `npm test` ; captures du poste, de l'écran de jeu (attente, dossier),
  de la transition ; FR + EN ; aucune régression. Documenter dans `jeu/39-…`. Fusion `main`.
