# Visdeurbel 2026 - Handover

## Project overview

Dit project visualiseert bezoekersdata van De Visdeurbel 2026 aan de hand van meerdere interactieve visualisaties gebouwd met Astro, D3.js en vanilla JavaScript.

De data wordt server-side ingeladen vanuit een CSV-bestand, vervolgens opgeschoond en beschikbaar gemaakt voor alle componenten via:

`window.SERVER_VIS_DATA`

## Technologieën

### Framework

- Astro 6.4.2

### Visualisatie

- D3.js 7.9.0
- TopoJSON Client
- World Atlas

### Hulplibraries

- i18n-iso-countries

## Projectstructuur

src/
│
├── components/
│ ├── MainAquarium.astro
│ ├── WorldMap.astro
│ ├── timeline-graph.astro
│ ├── average-fish.astro
│ ├── guess-the-fish.astro
│ ├── fish-details.astro
│ └── IntroText.astro
│
├── js/
│ ├── index.js
│ ├── loader/
│ └── charts/
│ ├── world-map.js
│ ├── picture-of-month.js
│ ├── ...
│
├── styles/
│ ├── world-map.css
│ ├── fish-facts.css
│ ├── timeline-graph.css
│ ├── average-time.css
│ └── ...
│
└── pages/
└── index.astro

## Data flow

### CSV loading

In pages/index.astro:
`loadCsvData()`

- CSV wordt opgehaald.
- CSV wordt geparsed.
- Data wordt opgeschoond.
- Datums worden genormaliseerd.
- Visdata wordt toegevoegd.

### Global dataset

Na het laden wordt alle data beschikbaar gemaakt als:
`window.SERVER_VIS_DATA`

### Component initialization

Elke visualisatie initialiseert zichzelf:

```
document.addEventListener(
  "DOMContentLoaded",
  initWorldMap
);
```

Hierdoor zijn componenten onafhankelijk van elkaar.

## Accessibility

Toegepast in meerdere componenten:

### Keyboard navigation

`tabindex`

### Escape key

Reset wereldkaart.
`Escape`

### Focus states

Custom focus styling via:
`:focus-visible`

### Skip link

Wereldkaart bevat:
`<a href="#after-world-map">`

Zodat toetsenbordgebruikers de visualisatie kunnen overslaan.

## Styling

Elke visualisatie heeft een eigen stylesheet.

voorbeelden:
`world-map.css`
`fish-facts.css`
`timeline-graph.css`

de styling maakt gebruik van
`var(--color-*)`

Design tokens zijn centraal gedefinieerd.

## Afbeeldingen

Alle afbeeldingen staan in:
`public/img/`

voorbeelden:

`visdeurbel-logo.svg`
`route-fish.svg`
`kolblei.png`
`snoek.png`

## NPM packages

Installeren:
`npm install`

Belangrijkste dependencies:

```
npm install astro
npm install d3
npm install topojson-client
npm install world-atlas
npm install i18n-iso-countries
```

## Start project

Development:
`npm run dev`

Build:
`npm run build`
