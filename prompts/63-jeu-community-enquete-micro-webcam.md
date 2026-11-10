# Prompt 63 — Jeu « Nantes en régulation », étape 47 : réponses en chaîne, enquête après coup, micro et webcam utiles

Demande d'origine (10/11/2026) :

> Aussi, pour les messages de community management, suite à nos réponses, nous pouvons avoir des réponses
> (jusqu'à 3) - le tout aléatoire, certains ne répondent pas rapidement, d'autres si, etc. Pour les
> incidents : également rajouter des options pour investiguer ce qu'il s'est passé dans l'application
> dédiée. et intègre 1 3 5

« 1 3 5 » : pistes proposées le 10/11/2026 pour donner un rôle au micro et à la webcam — **1 radio des
chauffeurs** (parler au micro pendant un dossier révèle l'info trafic), **3 souffle anti-stress** (souffler
pendant le boost du café ralentit le cœur et le compteur), **5 geste de réveil** (lever la main devant la
webcam pendant le réveil vaut « Se réveiller »).

## Attendu
1. **Community** : après chaque réponse du joueur, de 0 à 3 réactions (l'auteur ou d'autres comptes
   fictifs), tirées au hasard mais reproductibles (hachage de la graine, sans toucher aux dés), avec des
   délais variés (quelques minutes à plusieurs heures de jeu, parfois le lendemain) ; ton selon la réponse
   (bonne → remerciements / précisions, mauvaise → relances / agacement) ; ±1 de réputation chacune ;
   textes-modèles remplis avec les vraies données du dossier (ligne, nature) ; sauvegardées avec la partie.
2. **Enquête après coup** dans l'appli **Journal** : un bouton « Enquêter » par incident traité, et des
   volets : ce qui s'est passé (source réelle, texte, lignes, retard), le contexte (météo du jour, agenda,
   heure de pointe), votre décision (action, effets réels, dés, meilleure action attendue), les suites
   (plainte liée et réponses, équipes envoyées). Navigation entre les journées. Données réelles uniquement.
3. **Micro — radio des chauffeurs** : M maintenue pendant un dossier, une voix (hauteur détectée) pendant
   1,5 s transmet une consigne : l'info trafic est révélée sans coût de temps (équivalent clavier : 6).
4. **Micro — souffle** : pendant le boost du café, un souffle continu (bruit sans hauteur) fait redescendre
   le cœur deux fois plus vite et ralentit le compteur de moitié (équivalent : aucun, bonus facultatif).
5. **Webcam — geste de réveil** : webcam active, un grand mouvement devant la caméra pendant le réveil vaut
   « Se réveiller » (équivalent : espace).
6. `test-jeu.mjs` couvre les réactions (≤ 3, reproductibles, livrées à l'heure, effet appliqué une fois) ;
   règles Q1–Q61 inchangées ; FR + EN.

## Vérifications
- `npm run build`, `npm test` ; partie réelle : réponse à une plainte → réactions échelonnées ; enquête sur
  un incident (4 volets, jours) ; micro simulé (voix → info trafic ; souffle pendant le boost) ; webcam
  simulée (mouvement pendant le réveil). Documenter dans `jeu/57-…`. Fusion `main`.
