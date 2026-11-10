# 31 — Applications fonctionnelles, icônes agrandies, app flottante « Indicateurs » (prompt 36)

Les décisions Q1–Q61 ne changent pas. Toutes les valeurs affichées viennent de l'état réel du jeu.

## Bureau RégulOS (`os.js`)
- **Icônes agrandies** (`GRILLE_OS`) : grille de 2 colonnes × 4 lignes, cases de 200 × 200, icônes à l'échelle 1,35 (108 px au lieu de 80) et libellés en 22 px au lieu de 18.
- **Barre des tâches** (`BARRE_OS`, 84 px au lieu de 64) : bouton REGUL plus large, icônes 76 × 68 à l'échelle 0,7, et horloge en 28 px.
- La fenêtre d'app (`FENETRE_APP`) passe à x = 470 pour ne pas recouvrir les icônes.
- Les 7 applis :
  - Régulation ;
  - Patron ;
  - Carte ;
  - Community ;
  - Journal ;
  - **Indicateurs** (nouvelle) ;
  - **Corbeille** (désormais fonctionnelle).
- Sans partie en cours, chaque app affiche un message et un bouton « Menu principal » (prompt 35).

## Corbeille
- Elle liste les plaintes déjà traitées (prompt 28) : auteur, heure, texte, réponse envoyée, puis le badge « bonne réponse » ou « mal reçue » avec l'effet réel sur la réputation.
- « Vider la corbeille » marque ces plaintes `masquee`. Elles disparaissent de la liste, mais les jauges, le bilan (« plaintes traitées x/y ») et la sauvegarde ne changent pas.

## App flottante « Indicateurs »
- Ouverture : son icône, sur le bureau ou dans la barre des tâches, ou la **touche I** au poste. Un badge vert signale que l'app est ouverte.
- Elle reste toujours au premier plan, sur le bureau RégulOS **et** par-dessus l'appli de régulation (`dessinerIndicateurs()`, appelée après le contenu de l'écran du PC).
- **Déplaçable** en tirant sa barre de titre (`sourisEcranPC()` convertit la souris en coordonnées de l'écran du PC). La position est bornée à l'écran et mémorisée dans `localStorage` (`pxe-nte001:jeu:indicateurs`).
- Contenu :
  - fluidité, réputation et budget : valeur sur 100 et barre colorée selon les seuils du jeu (rouge sous 20, orange sous 40, vert au-delà) ;
  - variation due à la dernière décision (deltas réels du journal) ;
  - objectif du jour (✓ / ✗) ;
  - palier de budget (< 20 : seuil critique ; 20–70 : pompiers indisponibles, palier 70 ; ≥ 70 : toutes les équipes).
- L'ouverture est annoncée en `aria-live`, avec les trois valeurs.

## Vérifications
- `npm run build` et `npm test` OK.
- Test automatisé, sans erreur console :
  - apps sans partie → bouton Menu principal ;
  - I ouvre les Indicateurs ; glisser-déposer → position mémorisée ;
  - Corbeille : 2 plaintes listées, puis 0 après « vider », jauges inchangées ;
  - toutes les apps ouvertes l'une après l'autre ;
  - Indicateurs par-dessus l'appli.
- Tests des prompts 26 et 33 relancés, sans régression.
