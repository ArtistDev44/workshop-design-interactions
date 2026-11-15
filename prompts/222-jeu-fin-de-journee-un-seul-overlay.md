# Prompt 222 — Jeu : « Rapport du soir » et « Fin de journée » dans la même fenêtre

Origine : demande du 15/11/2026 (« les écrans "fin de journée" et "rapport du soir" doivent être affichés dans le même
overlay » ; « pour le choix fin de journée, auto-compléter quand il n'y a qu'un évènement marquant »). Statut : **à exécuter**.

## Constat

`taches-ui.js` : la fin de journée ouvre deux fenêtres à la suite — « Rapport du soir » (fait marquant + demande au
patron, Valider) puis « Fin de journée » (XP, grade, priorités, fait retenu, demande accordée / refusée, badges,
Continuer). Deux écrans pour un seul moment.

## À faire

1. Une seule fenêtre **« Fin de journée »** :
   - en haut, le **rapport du soir** : fait marquant, demande au patron (choix 1 à 4, Tab, comme avant) ;
   - dessous, dans la même fenêtre, le **bilan** : priorités du matin, puis — une fois le rapport envoyé — XP, grade,
     demande accordée / refusée, badges (animation de l'XP inchangée, sans animation si réduites).
   - Pied : « Envoyer le rapport » (Entrée) et « Envoyer sans demande » (Échap) ; après l'envoi, la même fenêtre affiche
     le bilan et un seul bouton « Continuer ».
2. **Auto-complétion** : s'il n'y a qu'**un** fait marquant, il est choisi d'office (coché, annoncé) et le focus passe
   à la demande.
3. Annonces lecteur d'écran, carte d'introduction (première fois) et textes FR + EN conservés ; plus de passage par une
   deuxième fenêtre `recap`.
4. Portrait et paysage mobile : la fenêtre défile si elle dépasse (comme aujourd'hui).

## Vérification

`npm run build`, `npm test` (contrôles : rapport et bilan dans la même fenêtre, fait unique pré-choisi) ; audit des
textes et des cibles à 0 en 1920 × 1080, 1366 × 768, 412 × 915 (écrans « fin de journée »).
