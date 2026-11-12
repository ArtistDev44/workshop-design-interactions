# Prompt 175 — Jeu : paramètres en sections (plein écran, volume, « Avancé », libellés)

Demande d'origine (prise de notes du 12/11/2026) :

> Options d'écran - plein écran. Supprimer les raccourcis des paramètres. Rajouter les sections des paramètres en
> reprenant le design du modal d'aide & tutoriel. Virer « reprendre sur un autre appareil ». Remplacer oui ou non
> par activer / désactiver. Revoir l'explication de l'« intensité du signal ». Renommer la section « options de
> jeu » par « avancé ». Rajouter des icones pour les options de jeu. Ajouter un paramètre de gestion du volume dans
> les paramètres.

Dépend du prompt 170 (icônes Lucide). Fichiers : `sketch.js` (`fenetreParametres` ~l.1460), `accessibilite.js`,
`confort.js` (`DEFAUTS`, `Reglages`), `i18n.js` (`param.*`, `acc.*`, `optjeu.*`, `commun.oui` / `commun.non`).

## À faire

1. **Sections à onglets**, sur le modèle de la fenêtre d'aide (`aide.js` : onglets, cartes, pagination, annonce
   « onglet n sur total ») : **Écran · Son · Accessibilité · Avancé**. Une seule fenêtre, plus de sous-fenêtres.
2. **Écran → Plein écran** : interrupteur qui appelle l'API Fullscreen du navigateur, reflète l'état réel
   (`fullscreenchange`, sortie par Échap) et se masque si l'API n'existe pas. Réglage non mémorisé de force au
   chargement (le navigateur exige un geste).
3. **Son → Volume** : curseur 0–100 % (clavier ← →, pas de 10) appliqué au gain maître de `confort.js` (musique,
   ambiances, alertes), mémorisé dans `Reglages` ; 0 % équivaut à « Son désactivé ». Garder le choix de la musique.
4. **Supprimer les raccourcis des paramètres** : plus de chiffres ni de « touche {k} » devant chaque ligne
   (`param.touche`) ; navigation par Tab / flèches et Entrée / Espace.
5. **« Activé » / « Désactivé »** à la place de « Oui » / « Non » sur tous les interrupteurs (paramètres,
   accessibilité, « Ne pas déranger » du téléphone), avec un vrai composant interrupteur du DS.
6. **Intensité du signal** (`acc.intensite`, réglage `intensiteFeedback` 100 / 50 / 0 %, lu par `juice.js`) :
   réécrire le libellé et l'explication pour dire ce que le joueur perçoit — secousses, éclats et vibrations qui
   accompagnent une décision — et ce que font les trois valeurs (complet, atténué, aucun).
7. **Renommer « Options de jeu » en « Avancé »** (`optjeu.titre`, FR/EN) et donner **une icône Lucide à chaque
   option** de cette section.
8. **Supprimer « Reprendre sur un autre appareil »** (`acc.reprise.*`, QR code, export / import JSON de
   `accessibilite.js` ~l.154 et `sauvegarde.js`) si plus rien d'autre ne s'en sert.

## Vérifications

- Parcours clavier complet des quatre sections ; lecteur d'écran : nom, état (« activé » / « désactivé ») et valeur
  du volume annoncés.
- Plein écran : entrée et sortie (bouton, Échap, F11) laissent l'interrupteur dans le bon état.
- Les réglages existants sont repris sans perte après la mise à jour (`localStorage`).
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
