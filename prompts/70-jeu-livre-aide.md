# Prompt 70 — Jeu « Nantes en régulation », étape 52 : le livre « Commande » devient « Aide »

Demande d'origine (10/11/2026) :

> Le nom du livre « Commande » doit être remplacé par « Aide ».

Renommage complet du livre du tutoriel (prompt 34), sans toucher aux autres « commande » du code
(`commandesCarte()` dans `sketch.js`, `mp.mode.recommande` : inchangés). Règles Q1–Q61 inchangées.

## Attendu
1. **Nom interne** : l'objet `commande` devient `aide` (`immersion.js` : `OBJETS_BUREAU`, `COEF_OBJETS`
   dans `bureau.js`, `cibleGuide('livreCommande')` → `cibleGuide('livreAide')`, branche
   `if (nom === 'aide') return lancerTutoriel()`).
2. **Rendu** : couverture toujours marine avec liseré doré, titre pixel **« AIDE »** (ajouter le glyphe
   pixel `A` dans `bureau.js` à côté du glyphe `M`, même style), marque-page inchangé.
3. **Textes FR + EN** (`i18n.js`) : clé `objet.commande` → `objet.aide`, libellé FR « Livre « Aide »
   (tutoriel) », EN « “Help” book (tutorial) » — au même endroit dans les deux blocs. Rechercher toutes les
   occurrences de `objet.commande` / `livreCommande` / « Commande » liées au livre et les basculer.
4. **Doc** : `jeu/28-fenetre-loire-tutoriel.md` (et `jeu/README.md` si le livre y est nommé) mis à jour ;
   nouvelle doc `jeu/54-…` pour ce changement.
5. **Vérifications** : `npm run build`, `npm test` ; essai réel FR + EN : le livre s'appelle « Aide »
   (infobulle, couverture, `aria-live`), clic / Tab + Entrée ouvre toujours le tutoriel, guide
   « Prendre en main » pointe toujours le livre ; `commandesCarte()` et « ★ RECOMMANDÉ » intacts ;
   aucune erreur console. `journal.md` à jour. Branche dédiée ; fusion `main` sur demande.
