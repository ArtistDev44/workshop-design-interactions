# Prompt 123 — Jeu « Nantes en régulation » : l'aide revue pour être lisible (UX / UI)

Demande d'origine (12/11/2026) :

> Concernant le livre d'aide, je souhaite qu'il soit revu d'un point de vue UX / UI pour qu'il soit plus lisible.

Suite des prompts 66 / 80 (aide réorganisée, puis rétrécie pour tenir) et 122 (« Aide et tutoriel »).
Le contenu ne change pas sur le fond : mêmes règles, mêmes touches, mêmes malus. Rien d'ajouté sans source.

## 1. Constat

- Une seule page porte tout : 19 raccourcis, les malus et un bloc de règles de plus de 2 500 signes.
- Pour tenir, le bloc de règles descend jusqu'à **13 px**, sans titres, en paragraphes de 6 à 8 lignes.
- Les raccourcis sont une liste plate : ceux du bureau, du signalement et des équipes sont mélangés.
- Aucune hiérarchie : on ne sait pas par où commencer.

## 2. Structure : des onglets, une idée par écran

Fenêtre au style du Pixel DS (comme l'écran Crédits du prompt 120 : barre de titre en capitales, bordure
blanc 15 %, fond `DS.fond`). Quatre onglets, dans cet ordre :

1. **Bien démarrer** — l'objectif en trois lignes (jauges, score), puis le bouton primaire
   « Lancer le tutoriel (T) ».
2. **Règles** — le texte actuel découpé en **cartes titrées** (une clé i18n par carte, FR + EN) :
   Signalements · Répondre · Gravité et retard · Équipes · Somnolence et défi chrono · Le patron ·
   Tâches du jour · Comprendre une décision. Le glossaire devient une carte à part, en lignes
   libellé / définition.
3. **Raccourcis** — regroupés par contexte, avec un sous-titre : Signalement · Équipes et carte · Bureau ·
   Général. La touche est dans une **capsule** (cadre, police des données).
4. **Malus** — une ligne par malus : nom, condition → conséquence.

## 3. Lisibilité

- Corps de texte à **20 px au moins**, interligne ≥ 1,4 ; plus aucune taille ajustée vers le bas pour le
  texte courant. Si une rubrique ne tient pas, elle se pagine (« 1 / 2 », ← →), elle ne rétrécit pas.
- Largeur de ligne ≤ 75 signes : les règles sont sur deux colonnes de cartes.
- Titres de carte en capitales jaune DS (`DS.alerte`), texte en blanc 75 % ; contraste ≥ 4,5:1.
- Aucun texte coupé : zones déclarées pour l'audit des textes.

## 4. Navigation

- Onglets : clic, ← → ou Tab ; touches 1 à 4. L'onglet actif a le liseré primaire et la double bordure au
  focus clavier.
- H, ? ou Échap ferment ; T lance le tutoriel depuis n'importe quel onglet.
- L'onglet ouvert est annoncé (`aria-live`) avec son titre.
- Animation d'entrée douce, absente si les animations sont réduites.
- Portrait mobile : les cartes passent sur une colonne, cibles ≥ 44 px à l'écran.

## Vérifications

- Captures avant / après des quatre onglets à 1920×1080 et 1366×768, FR et EN.
- Audit des textes à 0 défaut ; plus aucun texte sous 18 px dans l'aide.
- `npm run build`, `npm test`.
- Copie dans `rendu/`, rapport `jeu/121-125-signalements-aide-menu.md` (section 123), `prompts/README.md`,
  `journal.md`, `npm run auteurs`.
