# Pixel Design System (Community)

Design system extrait du fichier Figma communautaire **« Pixel Design System (Community) »**
(export PDF : `pixel-design-system-community.pdf`, 18 pages, exporté de Figma le 2026-11-10).

> **Connexion Figma vérifiée le 2026-11-10** : l'API REST Figma (`api.figma.com/v1/me`) répond
> avec le token configuré (`FIGMA_ACCESS_TOKEN`, préfixe `figd_`) — compte
> `guillaume.renoult@mail-esd.com` (handle « Guillaume », id `1422524856950906642`).
> À noter : le serveur MCP distant `mcp.figma.com/mcp` n'accepte pas ce PAT en
> `X-Figma-Token` (HTTP 401) ; il exige un token OAuth. L'extraction ci-dessous
> provient donc de l'export PDF officiel du fichier Figma.

---

## 1. Fondations

### 1.1 Unité de mesure — 4 px

Toutes les mesures du fichier reposent sur une **unité unique de 4 pixels**.

- `Measures/N` signifie `N × 4` pixels.
- Exemple : `Measures/4` = 4 × 4 = **16 px**.

### 1.2 Padding vs Spacing

| Concept | Définition |
|---|---|
| **Container** | Tout élément qui contient d'autres éléments. |
| **Blocks** | Tout élément contenu dans un container. |
| **Padding** | Mesure entre un container et ses blocs contenus. Chaque container a un certain padding pour disposer les blocs à l'intérieur. |
| **Spacing** | Mesure entre les blocs à l'intérieur d'un container, pour les espacer entre eux. |

### 1.3 Typographie

| Rôle | Police |
|---|---|
| Titres (`Fonts/Titles`) | **Bitsy Pixels** (police pixel personnalisée) |
| Paragraphes (`Fonts/Paragraph`) | **JetBrains Mono** |

### 1.4 Roundness général

`General Roundness` → `Radius/radius-0` (coins non arrondis par défaut).

---

## 2. Variables (tokens)

### 2.1 Thème (sémantique)

| Token | Valeur |
|---|---|
| Accent | `Colors/Neutral/White 05` |
| Accent Foreground | `Colors/Neutral/White` |
| Background | `#0D0C0C` |
| Background-Foreground | `Colors/Neutral/White` |
| Border | `Colors/Neutral/White 15` |
| Input | `Colors/Neutral/White` |
| Primary | `#D4031C` |
| Primary-Foreground | `Colors/Neutral/White` |
| Secondary | `Colors/Neutral/White` |
| Secondary-Foreground | `Colors/Background` |
| Specific/Disabled — Background | `Colors/Neutral/White 15` |
| Specific/Disabled — Foreground | `Colors/Neutral/White 50` |
| Specific/Disabled — Border | `Colors/Neutral/White 15` |
| Specific/Text/On Primary — Title | `Primary-Foreground` |
| Specific/Text/On Primary — Paragraph | `Colors/Neutral/White 75` |
| Specific/Text/On Secondary — Title | `Colors/Secondary-Foreground` |
| Specific/Text/On Secondary — Paragraph | `Colors/Secondary-Foreground` |
| Specific/Text/On Background — Title | `Background-Foreground` |
| Specific/Text/On Background — Paragraph | `Colors/Neutral/White 50` |

### 2.2 Dimensions (padding, spacing, radius)

Conversion : `Measures/N` = N × 4 px.

| Token | Valeur (Measures) | Pixels |
|---|---|---|
| Padding-xxs | Measures/0,5 | 2 px |
| Padding-xs | Measures/1 | 4 px |
| Padding-sm | Measures/2 | 8 px |
| Padding-md | Measures/4 | 16 px |
| Padding-xl | Measures/5 | 20 px |
| Padding-xxl | Measures/6 | 24 px |
| Spacing-xxs | Measures/0,5 | 2 px |
| Spacing-xs | Measures/1 | 4 px |
| Spacing-sm | Measures/2 | 8 px |
| Spacing-md | Measures/4 | 16 px |
| Spacing-xl | Measures/5 | 20 px |
| Spacing-xxl | Measures/6 | 24 px |
| radius-0 | Measures/0 | 0 px |
| radius-1 | Measures/1 | 4 px |
| radius-2 | Measures/2 | 8 px |
| radius-4 | Measures/4 | 16 px |
| radius-6 | Measures/6 | 24 px |
| radius-8 | Measures/8 | 32 px |
| radius-10 | Measures/10 | 40 px |
| radius-16 | Measures/16 | 64 px |
| Full | 9999 | pill / cercle |

### 2.3 Primitives (couleurs de base)

**Functional**

| Token | Hex |
|---|---|
| Success Primary | `#00B74F` |
| Success Light | `#BFFFDB` |
| Warning Primary | `#FFC138` |
| Warning Light | `#FFECC2` |
| Error Primary | `#D10B00` |
| Error Light | `#FFC5C2` |
| Info Primary | `#3860FF` |
| Info Light | `#C2CEFF` |

**Neutral** (les variantes sont des opacités appliquées à la couleur de base)

| Token | Couleur de base |
|---|---|
| Black, Black 75, Black 50, Black 15, Black 05, Black 03 | `#0D0C0C` |
| White, White 75, White 50, White 15, White 05, White 03 | `#FFFFFF` |
| Transparent | transparent (affiché `#FFFFFF` dans l'export) |

---

## 3. Composants

| Composant | Description (du fichier) |
|---|---|
| **Alerts** | Informer l'utilisateur de changements importants de façon visible et proéminente. |
| **Badges** | Convey dynamic information, such as a count or status (texte, labels ou nombres). |
| **Buttons** | Aider les utilisateurs à effectuer des actions (envoyer un e-mail, partager un document, aimer un commentaire). Variantes multiples (plein, contour, fantôme, tailles, avec/sans icône). |
| **Button group** | Wrapper pour plusieurs boutons liés entre eux (ex. sélecteur `DAY / WEEK / MONTH / QUARTER / YEAR / ALL`). |
| **Checkboxes** | Sélectionner un ou plusieurs éléments d'un ensemble, ou activer/désactiver une option. |
| **Chips** | Saisir une information, faire une sélection, filtrer du contenu ou déclencher une action. |
| **Dialogs** | Fenêtre modale affichée devant le contenu : information critique ou décision à prendre (titre + actions « Action 1 / Action 2 »). |
| **Navigation** | Container de liens de navigation (pages du site ou éléments de la page courante). |
| **Logo** | Logo produit (« Product Logo »). |
| **Progress indicators** | Informer de l'état d'un processus en cours (barres de progression linéaires, différents taux d'avancement). |
| **Radio buttons** | Sélectionner une seule option dans un ensemble. |
| **Switch** | Basculer l'état d'un élément unique (on/off). |
| **Tables** | Afficher de grandes quantités de données en lignes et colonnes (Header, Cell, Label, Button). |
| **Tabs** | Organiser la navigation entre groupes de contenus de même niveau (ex. `First / Second / Third`, filtre `All`). |
| **Text fields** | Permettre la saisie de texte dans une UI (formes, dialogues), avec placeholder, label, input et supporting text. |
| **Misc** | Éléments divers. |

---

## 4. Sources et licence

- Fichier Figma Community « Pixel Design System (Community) » — export PDF local : `pixel-design-system-community.pdf`.
- Source et licence du fichier communautaire : à compléter (voir page Community de Figma).
- Connexion au compte Figma vérifiée via l'API REST le 2026-11-10 (voir en-tête).
