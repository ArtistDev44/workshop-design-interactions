# Prompt 179 — Jeu : téléphone (marges des messages, heure, messages sous l'interface, gel du temps)

Demande d'origine (prise de notes du 12/11/2026) :

> Revérifier les marges des messages du téléphone. Rajouter l'heure. Supprimer le second texte envoyé sur le
> téléphone lors de la première partie sur l'absence de chrono. Aussi, vérifier que les messages ne passent pas
> devant l'UI de la messagerie. Remplacer réputation de la salle par réputation du réseau. Lors de la première
> utilisation du téléphone : freeze le temps.

Fichiers : `notifs-tel.js`, `immersion.js` (SMS d'accueil de Camille), `i18n.js` (`sms.0` à `sms.5`,
`jaugeLong.reputation`, `fin.jauge.reputation`).

## À faire

1. **Marges des bulles** : mêmes marges internes et même écart entre bulles partout (grille 8 px du DS), texte
   jamais collé au bord de la bulle ni la bulle au bord de l'écran du téléphone, en FR et en EN.
2. **Heure** : afficher l'**heure de jeu** de chaque message (sous ou à côté de la bulle, format `8 h 02` / `8:02`)
   et l'heure courante dans la barre d'état du téléphone.
3. **Les messages défilent sous l'interface de la messagerie** : zone de défilement **découpée** (clip) entre
   l'en-tête (nom du contact) et le pied (onglets, boutons) ; aucune bulle ne passe devant ces éléments, y compris
   pendant l'animation d'arrivée.
4. **Supprimer la mention de l'absence de chrono** dans le second message d'explication de la première partie
   (`sms.2` : « Pas de chrono, prends le temps de lire. »), FR/EN ; garder le reste de la consigne ou fusionner avec
   le message voisin si la bulle devient trop courte.
5. **« Réputation du réseau »** remplace « réputation de la salle » partout (`jaugeLong.reputation`,
   `fin.jauge.reputation`, `sms.3`, aide, tutoriel, EN : « network reputation ») — `grep -i "de la salle"`.
6. **Première utilisation du téléphone : temps gelé**. Tant que le joueur n'a pas lu et fermé le téléphone pour la
   première fois (clé mémorisée), l'horloge de jeu, les arrivées de signalements et la somnolence sont suspendues ;
   aux ouvertures suivantes, comportement actuel.

## Vérifications

- Captures du téléphone (FR/EN, 3 tailles) : marges régulières, heure visible, aucune bulle sur l'en-tête ou le
  pied pendant le défilement.
- Première ouverture : l'horloge n'avance pas ; deuxième ouverture : elle avance.
- `grep -i "réputation de la salle\|room reputation"` : aucun résultat.
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
