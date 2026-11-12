# Prompt 107 — Jeu « Nantes en régulation » : plus de cartes de réponse, une fenêtre flottante où l'on répond au plaignant

Demande d'origine (12/11/2026) :

> Je souhaite retirer le système des réponses : renforcer la fréquence, agents sur les quais, prévenir les
> voyageurs à l'avance, ne rien changer. À la place, lorsque l'on clique sur un signalement, une fenêtre
> flottante s'ouvre avec le plaignant expliquant ce qui ne va pas. On aura par la suite la possibilité de lui
> répondre avec une suite de réponses adaptées à sa situation (si retard de train : attendre, on vous envoie
> une équipe…, si agression en cours : intervenir, essayer de les calmer, on vous envoie une équipe…).

Troisième des prompts 105 → 109.

## 1. La fenêtre flottante

- **Ouverture :** un clic (ou Entrée) sur un marqueur ouvre une **fenêtre flottante** posée sur la carte,
  du côté opposé au marqueur. Le marqueur reste visible.
  - Elle remplace le grand panneau de droite (`PANNEAU`). La place libérée à droite reçoit les équipes
    (prompt 108).
- **En-tête, une ligne :** type · gravité · heure. Une croix (Échap) referme la fenêtre ; le signalement
  reste actif sur la carte.
- **Corps :** le plaignant (avatar, pseudo) **explique ce qui ne va pas** (`Jeu.plaignantPour`, plaintes
  de `data/messages.json`). À défaut, la source réelle parle (prompt 102).
- **« Vos réponses » :** 3 à 4 répliques **à la première personne**, adressées au plaignant.
  - Choix au clic ou avec 1–4.
  - Elles remplacent les cartes « Renforcer la fréquence », « Agents sur les quais », « Prévenir les
    voyageurs à l'avance », « Ne rien changer » et toutes les autres cartes de réponse.
- **« En savoir plus (E) » :** les sources de l'enquête (prompt 50), dans la fenêtre.
- **Après la réponse :** la conséquence (narration existante) s'affiche dans la même fenêtre, puis elle se
  ferme.

## 2. Les répliques, adaptées à chaque situation

- Chaque réponse de `data/reponses.json` reçoit une **réplique** (`replique`, FR et EN), c'est-à-dire ce
  que l'opérateur dit au plaignant.
- L'effet en jeu reste celui de la réponse : base + 1 dé, situations ×1,25 (prompt 87). Le score reste donc
  cohérent avec les règles verrouillées.
- **Retard d'une ligne :**
  - « Patientez, le service se régularise » ;
  - « On ajoute un véhicule » ;
  - « On vous envoie une équipe » ;
  - « On affiche l'information aux arrêts ».
- **Travaux, affluence, météo :** même principe, avec leurs réponses.
- **Accident ou malaise :**
  - « On vous envoie les secours » ;
  - « On coupe la ligne et on dévie » ;
  - etc.
- **Agression en cours :** les sources ouvertes du jeu ne contiennent **aucun** fait de ce type. Le groupe
  ne l'invente pas. La catégorie et ses répliques sont prévues (« On intervient », « Essayez de rester à
  distance, on arrive », « On vous envoie la police »), mais elles ne se déclenchent qu'avec une source
  réelle. Laquelle ? [À COMPLÉTER].

## Vérifications

- Plus aucune carte de réponse à l'écran. Toutes les catégories ont leurs répliques en FR et en EN.
- Une partie complète se joue :
  - à la souris ;
  - au clavier (1–4, E, Échap) ;
  - en mode portrait.
- `npm run build`, `npm test` (scores inchangés pour une même suite de décisions), audit des textes à
  0 défaut.
