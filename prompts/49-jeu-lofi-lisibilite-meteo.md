# Prompt 49 — Jeu « Nantes en régulation », étape 35 : son lofi discret, lisibilité du PC, météo selon le mode

Demande d'origine (10/11/2026) :

> Les sons sont trop présents. Je pense plutôt à une musique lofi en fond. […] Sinon, l'écriture des
> interfaces du pc est trop petite. Le texte est souvent illisible. Au dessus de la carte dans
> l'application régulation : nous avons des informations de météo et de vent : supprimes les. Petite
> spécificité, les informations de climat doivent s'adapter au mode de jeu. Pour le mode direct : les
> apis sont chargées en direct, pour le mode semaine passées : la météo est récupérée à partir des
> données correspondantes.

## Attendu
1. **Musique lofi par défaut** : vrais morceaux lo-fi libres de droits **CC0** (Wikimedia Commons,
   licence et SHA-1 vérifiés, crédits dans `audio/CREDITS.md`), en boucle, volume bas.
2. **Sons discrets** : ambiance de salle, radio, bips, tic-tac, signaux des jauges, vent : volumes
   nettement baissés ; la musique reste au premier plan, mais en fond.
3. **Lisibilité du PC** : plus aucun texte minuscule dans les interfaces de l'écran du PC (RégulOS et
   appli Régulation) ; vérifier les débordements au rendu réel.
4. **Carte** : supprimer la ligne météo / vent au-dessus de la carte de l'appli Régulation.
5. **Climat selon le mode** : en **direct**, météo chargée en direct (Open-Meteo, au clic / au
   lancement, jamais dans `draw`) ; en **semaine passée**, la météo vient des données archivées de la
   semaine (`semaine.meteo`, jour joué). Vérifier tous les endroits qui affichent le climat (fenêtre,
   pluie, bandeau, Indicateurs, téléphone…).

## Vérifications
- `npm run build`, `npm test` ; essai réel des deux modes ; captures de l'écran du PC. Documenter dans
  `jeu/44-…`. Fusion `main` sur demande.
