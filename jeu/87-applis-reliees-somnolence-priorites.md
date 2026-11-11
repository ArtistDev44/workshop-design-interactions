# 87 — Un jeu qui démarre minimal : applis reliées, déblocage, somnolence, priorités imposées (prompt 91)

Numéro : le prompt demandait `jeu/86-…`, déjà pris par la présentation Slidev (prompt 82).

Code : `applis.js` (nouveau : verrouillage par semaine, cartes de déblocage, pile de navigation, « Voir le dossier »),
`os.js`, `multitache.js`, `panneau.js` (« → Publier sur Community », B), `community.js` (brouillon), `patron.js`,
`game.js` (`Jeu.publierBrouillon`, ×1,5 en option), `taches.js` (priorités imposées, info trafic retirée),
`taches-ui.js` (Options de jeu en deux colonnes), `sieste.js`, `sketch.js`, `sauvegarde.js`, `confort.js`, `i18n.js`.
Aucune valeur Q57–Q61 ni le 1d6 modifiés.

## § 1 — Correctif bloquant (lot A, commit séparé)
La messagerie du patron ne répondait plus : `journal.js` (prompt 89) redéfinissait la fonction globale `hauteurCarte`
de `patron.js`, et le dessin de Messages levait une exception à chaque image (plus de touches, plus de curseur main).
Fonction renommée ; un doublon ancien (`ouvrirLien`) aussi ; **test : aucun nom global en double entre les scripts**.
Une fenêtre RégulOS ouverte par-dessus l'appli de jeu reçoit désormais les touches en premier (Échap la ferme).

## § 2 — Déblocage par semaine (option du groupe, désactivée par défaut)
Paramètres → Options de jeu (G) → « Applis débloquées par semaine » : semaine 1 Signalements seule ; Community (et
Corbeille) en 2, Messages en 3, Journal et Indicateurs en 4, Données en 5 (le mode histoire compte 3 semaines : le
temps réel compte comme la semaine 4). Icône verrouillée grisée + cadenas pixel, secousse, infobulle « Disponible à
partir de la semaine N », annonce ; la barre des tâches et ses notifications ne montrent que les applis débloquées ;
carte d'une phrase au déblocage (une fois, `localStorage`). Option « Tout débloqué (défi, temps réel) » : désactivée.

## § 3 — Applis reliées (actif)
- Dossier de catégorie retard, travaux, météo ou accident : **« → Publier sur Community » (B)** ouvre Community
  avec un brouillon des **faits** du dossier (ligne, cause, durée estimée ou « durée inconnue »), jamais d'effet
  attendu. Publier : aucun effet de jauge. Ne pas publier : pas de malus immédiat, mais si le retard s'aggrave,
  un usager se plaint (variante « libre » recommandée par le prompt ; l'option « obligatoire avec malus » n'est pas
  retenue en attendant le groupe). Remplace la tâche « rédiger l'info trafic » du prompt 88.
- Retours croisés : post Community → « Voir le dossier » ; Messages → « Voir le dossier » ; brouillon →
  « ← Voir le dossier ». Décidé → fiche d'enquête du Journal ; pas encore décidé → liste des signalements.
- **Pile de navigation** : chaque redirection empile l'écran d'origine ; Échap y revient (puis ferme, puis se
  lève). Sauvegardée avec le brouillon non envoyé.

## § 4 — Priorités imposées (actif ; exception au prompt 88 § 1)
Plus de fenêtre de choix : chaque matin le patron **impose 2 priorités** (3 au bout de 4 jours joués), d'abord
celles fondées sur les faits réels du jour (météo, agenda, travaux annoncés), dans la consigne de Messages et dans
le bandeau. Priorité tenue → bonus existant (+2 de réputation).

## § 5 — Somnolence nécessaire
- Toujours : la sieste n'est plus du temps perdu — au réveil, les équipes en route sont arrivées et le prochain
  signalement du jour est annoncé (heure de jeu, type).
- Option « Somnolence nécessaire » (désactivée) : la fatigue monte deux fois plus vite (dormir chaque jour devient
  inévitable) ; au-delà de 70, aggravation des retards ×1,5 et équipes 1,5 fois plus lentes ; jauge « Somnolence v
  / seuil 70 » et ⚠ en texte.

## Effet sur la variété (prompt 88)
« Less is more » remplace la rotation du prompt 88 : sans briefing au choix ni info trafic, la mesure
(`scripts/mesure-repetition.mjs`) donne un type dominant à 46 % en moyenne (31 % avec le prompt 88), 11 journées sur 19
à 50 % ou plus. Les seuils de rotation du prompt 88 ne sont plus testés ; l'absence de texte répété l'est toujours.

## Vérifications
`npm run build`, `npm test` (374 contrôles : noms globaux uniques, déblocage par semaine et temps réel, pile de
navigation, brouillon = faits du dossier sans effet de jauge, priorités 2 puis 3, somnolence). Chromium FR / EN :
dossier → B → brouillon → Échap revient au dossier ; icônes verrouillées ; options ; semaine complète sans erreur.
Test humain (semaine 1 puis 2) : [À COMPLÉTER].
