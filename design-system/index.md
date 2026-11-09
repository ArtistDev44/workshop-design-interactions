# Design System — Nantes, ville et métropole (metropole.nantes.fr)

Base extraite du site officiel https://metropole.nantes.fr/ (refonte publiée le 18 avril 2025, conception Adimeo).
Fichier destiné à servir de contexte à un LLM (Claude Code) : lire le bloc `tokens` ci-dessous avant toute génération.

```yaml
tokens:
  source:
    url: https://metropole.nantes.fr/
    scraped_at: 2026-11-09
    brand: Nantes, ville et métropole (Ville de Nantes + Nantes Métropole)
    refonte: 2025-04-18 (Adimeo)
  fonts:
    display:
      family: Nantes
      foundry: Luzi Type (Luzi Gantenbein), 2016 — « typographie purement nantaise » de la refonte 2025
      type: serif à contraste, terminaisons en goutte
      weights: [300, 400, 700]
      styles: [normal, italic]
      variable: axe Light → Bold (wght), upright + italic
      usage: logotype, titres, accroches
      license: commerciale — non distribuable librement ; repli web : Fraunces (Google Fonts) ou Georgia/serif
      css_stack: '"Nantes", "Fraunces", Georgia, "Times New Roman", serif'
    text:
      family: Marianne
      note: police officielle du secteur public français (charte de l'État) ; utilisée comme référence de corps de texte lisible
      weights: [400, 500, 700]
      css_stack: '"Marianne", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    historical:
      family: Nantaise
      author: Olivier Leprévost (création pour l'ancienne identité de la métropole)
  colors:
    note: identité « verte et créative » (vert métropolitain). Valeurs web estimées à partir de l'identité visuelle ; calibrer avec la charte officielle si besoin.
    primary: '#00693C'
    primary-dark: '#004A2A'
    primary-light: '#E7F2EB'
    text: '#1C1C1C'
    text-muted: '#5B5B5B'
    surface: '#F6F5F1'
    background: '#FFFFFF'
    border: '#E4E2DB'
    on-primary: '#FFFFFF'
  typography:
    base: 16px
    scale:
      display: { size: 3rem, line: 1.08, weight: 700, family: display }
      h1: { size: 2.5rem, line: 1.12, weight: 700, family: display }
      h2: { size: 2rem, line: 1.15, weight: 700, family: display }
      h3: { size: 1.5rem, line: 1.2, weight: 700, family: display }
      h4: { size: 1.25rem, line: 1.3, weight: 700, family: display }
      body: { size: 1rem, line: 1.6, weight: 400, family: text }
      small: { size: 0.875rem, line: 1.5, weight: 400, family: text }
      tag: { size: 0.75rem, line: 1.4, weight: 700, family: text, transform: uppercase, letter-spacing: 0.06em }
  spacing:
    unit: 4px
    scale: [4, 8, 12, 16, 24, 32, 48, 64, 96]
    container-max: 1280px
    gutter: 24px
  radii:
    sm: 8px
    md: 12px
    lg: 16px
    pill: 999px
  shadows:
    card: 0 2px 8px rgba(0, 0, 0, 0.08)
    card-hover: 0 8px 24px rgba(0, 0, 0, 0.12)
  breakpoints:
    sm: 640px
    md: 768px
    lg: 1024px
    xl: 1280px
  assets:
    logo-header: https://medias-metropole.nantes.fr/s3fs-public/svg/2024-12/nantes-logo.svg
    logo-ville-footer: https://medias-metropole.nantes.fr/s3fs-public/svg/2024-12/logo%20Nantes.svg
    logo-metropole-footer: https://medias-metropole.nantes.fr/s3fs-public/svg/2024-12/logo_Nantes_metropole.svg
    hero: https://medias-metropole.nantes.fr/s3fs-public/styles/landscape_full_page_1920w/public/images/2026-10/bandeau-homepage-ile-versailles.jpg.webp
```

## Polices — intégration dans un projet (Claude Code)

```css
/* Police d'affichage Nantes (fournie sous licence par Luzi Type — à héberger soi-même) */
@font-face {
  font-family: "Nantes";
  src: url("fonts/Nantes-Regular.woff2") format("woff2");
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: "Nantes";
  src: url("fonts/Nantes-Bold.woff2") format("woff2");
  font-weight: 700; font-style: normal; font-display: swap;
}

:root {
  --font-display: "Nantes", "Fraunces", Georgia, serif;
  --font-text: "Marianne", -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
}
```

Repli recommandé si la licence Nantes n'est pas acquise : charger **Fraunces** (Google Fonts) comme substitut visuel proche (serif à contraste), et **Marianne** via le DSFR (`@gouvfr/dsfr` sur jsDelivr) ou la police système.

## Règles d'usage observées sur metropole.nantes.fr

- Titres et accroches en **Nantes** (serif), corps de texte et UI en sans-serif.
- Boutons primaires en pilule (`border-radius: 999px`), fond vert métropolitain, texte blanc.
- Cartes d'actualités avec image 16:9, tag thématique en capitales, titre en serif, date.
- En-tête blanc : logo à gauche, accès rapides / démarches / recherche / menu à droite.
- Pied de page avec logos « Ville de Nantes » et « Nantes Métropole » côte à côte.
- Grille de contenu centrée, largeur max ~1280px, fond de page blanc, sections alternées en gris chaud.

## Fidélité des valeurs

- Polices, structure de page, contenus et URLs d'assets : extraits directement du site (vérifié).
- Hexadécimales des couleurs : estimées à partir de l'identité « vert métropolitain » ; à remplacer par les valeurs officielles de la charte si elles sont communiquées.
