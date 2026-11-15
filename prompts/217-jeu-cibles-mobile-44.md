# Prompt 217 — Jeu : toutes les cibles tactiles du mobile à 44 px CSS au moins

Origine : demande du 14/11/2026 (« passe aussi les autres cibles à 44 px minimum »), après les prompts 214 à 216.
Statut : **exécuté le 15/11/2026**.

## Constat (mesure des cibles en px CSS, prompt 214)

Après le prompt 216, 61 cibles restaient sous 44 px CSS en 412 × 915 comme en 915 × 412 : objets de la pièce dans
l'image du bureau (8 à 28 px), fiche du dossier (« × », onglets Enquête / Historique, répliques en mode compact,
« Dites-m'en plus », « Publier sur Community » : 28 à 40 px), Mails (barre d'outils, dossiers : 28 à 36 px),
téléphone (onglets, « × », « +n autres », « Tout effacer », Ne pas déranger, Fermer : 32 à 41 px), flèches de pages de
l'aide (36), « Fermer » du rapport de la veille (39), lien des crédits (28), option du guide (39), « Autoriser » (41),
bulle du guide (38), marqueurs de la carte (26).

## Fait

- **`hCible(h, min)`** (`ds.js`) : en mobile (portrait ou paysage, recomposés), au moins `min` px de l'espace de dessin ;
  sur ordinateur, la taille d'origine (rien ne change). Le minimum dépend de l'échelle de la recomposition :
  70 dans l'appli (≈ 0,64 px CSS par px), 60 dans le téléphone (≈ 0,73), 74 dans les fenêtres et le menu (≈ 0,60),
  84 pour + / − / Recentrer (≈ 0,53).
- Appliqué à chaque cible de la liste ; ce qui suit une cible agrandie est décalé d'autant (contenu sous les onglets
  de l'enquête, liste des Mails, liste du téléphone, case « Autoriser »).
- **Marqueurs de la carte** : zone de toucher de 70 px centrée sur le marqueur (le dessin ne change pas).
- **Pièce du bureau** : en mobile, l'image de la pièce est un décor — un toucher dessus ne fait rien ; chaque objet a son
  grand bouton (120–124 px, ≈ 46 px CSS). Plus de clic involontaire sur un objet minuscule.

## Vérifié

- `npm run build`, `npm test` (+23 contrôles : `hCible` sur ordinateur et en mobile, chaque cible, pièce inerte).
- Mesure (audit des textes, parcours FR + EN) : **0 cible sous 44 px CSS** en 412 × 915 et en 915 × 412 (61 avant),
  0 défaut de texte ; même résultat en 740 × 360 (0 cible sous 44 px CSS, 0 défaut de texte).
- Ordinateur : 1920 × 1080 inchangé (81 cibles sous 44 px CSS, aucune sous 24 — à cette taille, 44 px de l'image =
  44 px CSS) ; 1366 × 768 : aucune sous 24.
- Captures de contrôle en 412 × 915 : fiche du dossier, Mails, téléphone, aide.

## Limites

- Pas de vérification sur un vrai téléphone (non renseigné).
- Des zones de toucher de marqueurs voisins sur la carte peuvent se recouvrir quand la carte est dézoomée.
