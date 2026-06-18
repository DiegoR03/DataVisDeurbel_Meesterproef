/*****************/
/* MARK: Imports */
/*****************/

/*
  Sources used:
  - D3 geo projections and geoPath:
    https://d3js.org/d3-geo
  - D3 zoom behavior:
    https://d3js.org/d3-zoom
  - TopoJSON to GeoJSON conversion:
    https://github.com/topojson/topojson-client
  - i18n ISO country code conversion:
    https://www.npmjs.com/package/i18n-iso-countries
*/

import * as d3 from "d3";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import countries from "i18n-iso-countries";

/***************/
/* MARK: State */
/***************/

let selectedCountryId = null;
let mapZoom = null;

/*******************/
/* MARK: Constants */
/*******************/

const MAP_WIDTH = 900;
const MAP_HEIGHT = 500;

// Longitude and latitude of Utrecht, where De Visdeurbel is located.
const UTRECHT_COORDINATES = [5.1214, 52.0907];

/********************/
/* MARK: Render map */
/********************/

function renderWorldMap(data) {
  const svg = d3.select("#world-map");
  const tooltip = d3.select("#world-map-tooltip");

  svg.attr("viewBox", `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);

  // Create the map projection.
  // The small rotation prevents Fiji from being cut off too much at the map edge
  // Bron: https://d3js.org/d3-geo
  // ChatGPT: Slightly rotating earth projection to prevent Fiji form being clipped
  // at the edge of the map.
  const projection = d3
    .geoNaturalEarth1()
    .rotate([-5, 0])
    .scale(160)
    .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

  const path = d3.geoPath(projection);

  // Main SVG group that contains everything that should zoom and pan together.
  const mapGroup = svg.append("g").attr("class", "world-map-group");

  // Countries are placed in their own group.
  const countryGroup = mapGroup
    .append("g")
    .attr("class", "world-map-countries");

  // Routes are placed after countries, so the route appears above the map.
  const routeGroup = mapGroup.append("g").attr("class", "world-map-routes");

  enableMapZoom(svg);
  renderUtrechtMarker(mapGroup, projection);

  // Convert TopoJSON country data to GeoJSON features so D3 can draw the map.
  // Antarctica is filtered out because it is not relevant for this visualization.
  // Bron: https://github.com/topojson/topojson-client
  const countryFeatures = feature(
    world,
    world.objects.countries,
  ).features.filter((country) => String(country.id) !== "010");

  const countryCounts = getCountryCounts(data);
  const maxCount = d3.max([...countryCounts.values()]) || 1;

  // Color scale for countries with visitors.
  // Countries with more visitors get a stronger purple color.
  const colorScale = d3
    .scaleSqrt()
    .domain([1, maxCount / 2, maxCount])
    .range(["#eee2ff", "#c0a8ff", "#6f4ad8"]);

  renderCountries(
    countryGroup,
    routeGroup,
    svg,
    projection,
    path,
    countryFeatures,
    countryCounts,
    colorScale,
    tooltip,
  );

  renderTopCountriesList(countryCounts, countryFeatures);

  // Draw the first route automatically to the country with the most visitors.
  showInitialTopCountryRoute(
    routeGroup,
    projection,
    path,
    countryCounts,
    countryFeatures,
  );

  // Reset the map when clicking outside a country.
  svg.on("click", (event) => {
    const clickedOnCountry =
      event.target.classList.contains("world-map-country");

    if (!clickedOnCountry) {
      resetMap(svg, routeGroup);
    }
  });

  // Allow keyboard users to leave the zoomed-in state.
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      resetMap(svg, routeGroup);
    }
  });
}

/*******************/
/* MARK: Countries */
/*******************/

// Bron: ChatGPT, automatically selecting the country with the highest visitor
// count on page load
function showInitialTopCountryRoute(
  routeGroup,
  projection,
  path,
  countryCounts,
  countryFeatures,
) {
  // Find the country with the highest visitor count.
  const topCountryEntry = [...countryCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0];

  if (!topCountryEntry) return;

  const [topCountryId] = topCountryEntry;

  const topCountry = countryFeatures.find(
    (country) => String(country.id) === topCountryId,
  );

  if (!topCountry) return;

  selectedCountryId = topCountryId;

  setActiveCountryById(topCountryId);
  updateActiveCountryCard(topCountry, countryCounts);
  drawRouteToCountry(routeGroup, projection, path, topCountry);
}

function renderCountries(
  countryGroup,
  routeGroup,
  svg,
  projection,
  path,
  countryFeatures,
  countryCounts,
  colorScale,
  tooltip,
) {
  countryGroup
    .selectAll(".world-map-country")
    .data(countryFeatures)
    .join("path")
    .attr("class", "world-map-country")
    .attr("data-country-id", (country) => String(country.id))
    .attr("d", path)

    // Only countries with visitors are reachable by keyboard.
    // Bron: https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets
    .attr("tabindex", (country) => {
      const count = getCountryCount(country, countryCounts);

      return count > 0 ? 0 : -1;
    })

    // Sort countries by visitor count, so keyboard users reach relevant countries first.
    .sort((a, b) => {
      const countA = getCountryCount(a, countryCounts);
      const countB = getCountryCount(b, countryCounts);

      return countB - countA;
    })

    // Give screenreaders meaningful information per country.
    .attr("aria-label", (country) => {
      const count = getCountryCount(country, countryCounts);

      return `${country.properties.name}: ${count.toLocaleString(
        "nl-NL",
      )} bezoekers`;
    })

    // Color countries based on visitor count.
    .style("fill", (country) => {
      const count = getCountryCount(country, countryCounts);

      if (count === 0) {
        return "#f1e7ff";
      }

      return colorScale(count);
    })

    // Mouse interaction.
    .on("mouseenter", (event, country) => {
      setActiveCountryById(String(country.id));
      updateActiveCountryCard(country, countryCounts);

      showTooltip(tooltip, country, countryCounts);
      moveTooltipToMouse(tooltip, event);
    })
    .on("mousemove", (event) => {
      moveTooltipToMouse(tooltip, event);
    })
    .on("mouseleave", () => {
      if (selectedCountryId) {
        setActiveCountryById(selectedCountryId);
      } else {
        clearActiveCountry();
      }

      hideTooltip(tooltip);
    })

    // Click selects a country, draws the route, and zooms in.
    .on("click", (event, country) => {
      event.stopPropagation();

      selectedCountryId = String(country.id);

      setActiveCountryById(selectedCountryId);
      updateActiveCountryCard(country, countryCounts);
      drawRouteToCountry(routeGroup, projection, path, country);
      zoomToCountry(svg, path, projection, country);
    })

    // Keyboard interaction.
    // Bron: https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets
    .on("focus", (event, country) => {
      setActiveCountryById(String(country.id));
      updateActiveCountryCard(country, countryCounts);

      showTooltip(tooltip, country, countryCounts);
      moveTooltipToCountry(tooltip, event);
    })
    .on("blur", () => {
      clearActiveCountry();
      hideTooltip(tooltip);
    });
}

/**************/
/* MARK: Zoom */
/**************/
// Bron: https://d3js.org/d3-zoom
function enableMapZoom(svg) {
  mapZoom = d3
    .zoom()
    .scaleExtent([1, 6])
    .translateExtent([
      [0, 0],
      [MAP_WIDTH, MAP_HEIGHT],
    ])
    .on("zoom", (event) => {
      svg.select(".world-map-group").attr("transform", event.transform);
    });

  svg.call(mapZoom);
}

// Bronnen: https://d3js.org/d3-zoom
// ChatGPT: calculating a zoom area that includes Utrecht and selected country and
// Keeping the rout visible after zooming
function zoomToCountry(svg, path, projection, country) {
  const utrechtPoint = projection(UTRECHT_COORDINATES);
  const countryPoint = path.centroid(country);

  if (!utrechtPoint || !countryPoint) return;

  /*
    Instead of zooming only to the selected country, this zooms to the area
    between the selected country and Utrecht. This keeps the route visible
    and makes sure Utrecht stays in view.
  */
  const padding = 80;

  const minX = Math.min(utrechtPoint[0], countryPoint[0]) - padding;
  const maxX = Math.max(utrechtPoint[0], countryPoint[0]) + padding;
  const minY = Math.min(utrechtPoint[1], countryPoint[1]) - padding;
  const maxY = Math.max(utrechtPoint[1], countryPoint[1]) + padding;

  const dx = maxX - minX;
  const dy = maxY - minY;

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const scale = Math.max(
    1,
    Math.min(2.5, 0.8 / Math.max(dx / MAP_WIDTH, dy / MAP_HEIGHT)),
  );

  const translate = [
    MAP_WIDTH / 2 - scale * centerX,
    MAP_HEIGHT / 2 - scale * centerY,
  ];

  // Hide the Utrecht label while zoomed in to prevent visual overlap.
  d3.select(".utrecht-marker-label-bg").style("display", "none");
  d3.select(".utrecht-marker-label").style("display", "none");

  const transform = d3.zoomIdentity
    .translate(translate[0], translate[1])
    .scale(scale);

  svg.transition().duration(700).call(mapZoom.transform, transform);
}

function resetMap(svg, routeGroup) {
  selectedCountryId = null;

  d3.selectAll(".world-map-country").classed("is-active", false);
  d3.selectAll(".top-countries-list-item").classed("is-active", false);

  d3.select(".utrecht-marker-label-bg").style("display", null);
  d3.select(".utrecht-marker-label").style("display", null);

  routeGroup.selectAll("*").remove();

  svg.transition().duration(700).call(mapZoom.transform, d3.zoomIdentity);
}

/******************/
/* MARK: Top list */
/******************/

function renderTopCountriesList(countryCounts, countryFeatures) {
  const topCountriesList = document.getElementById("top-countries-list");

  if (!topCountriesList) return;

  const totalVisitors = getTotalVisitors(countryCounts);

  // Bron: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
  const topCountries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  topCountriesList.innerHTML = "";

  // Bron: https://www.npmjs.com/package/i18n-iso-countries
  topCountries.forEach(([numericCountryCode, count]) => {
    const countryCode = countries.numericToAlpha2(numericCountryCode);
    const countryName = countries.getName(countryCode, "nl") || countryCode;
    const flagEmoji = getFlagEmoji(countryCode);
    const percentage = ((count / totalVisitors) * 100).toFixed(1);

    const countryFeature = countryFeatures.find(
      (country) => String(country.id) === numericCountryCode,
    );

    const rank =
      topCountries.findIndex(([id]) => id === numericCountryCode) + 1;

    const listItem = document.createElement("li");

    listItem.classList.add("top-countries-list-item");
    listItem.dataset.countryId = numericCountryCode;
    listItem.tabIndex = 0;

    listItem.innerHTML = `
      <span class="top-countries-list-country">
        <span class="rank-badge">${rank}</span>
        ${flagEmoji} ${countryName}
      </span>

      <span class="top-countries-list-count">
        ${percentage}%
      </span>
    `;

    // Highlight the matching country when hovering or focusing the list item.
    listItem.addEventListener("mouseenter", () => {
      setActiveCountryById(numericCountryCode);

      if (countryFeature) {
        updateActiveCountryCard(countryFeature, countryCounts);
      }
    });

    listItem.addEventListener("mouseleave", () => {
      clearActiveCountry();
    });

    listItem.addEventListener("focus", () => {
      setActiveCountryById(numericCountryCode);

      if (countryFeature) {
        updateActiveCountryCard(countryFeature, countryCounts);
      }
    });

    listItem.addEventListener("click", () => {
      selectedCountryId = numericCountryCode;
      setActiveCountryById(selectedCountryId);

      if (countryFeature) {
        updateActiveCountryCard(countryFeature, countryCounts);
      }
    });

    listItem.addEventListener("blur", () => {
      clearActiveCountry();
    });

    topCountriesList.appendChild(listItem);
  });
}

/***************/
/* MARK: Route */
/***************/
// Bronnen: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
// ChatGPT: Generating curved bezier routes and making routes originate from
// selected country an end in Utrecht

function drawRouteToCountry(routeGroup, projection, path, country) {
  const utrechtPoint = projection(UTRECHT_COORDINATES);
  const countryPoint = path.centroid(country);

  if (!utrechtPoint || !countryPoint) return;

  routeGroup.selectAll("*").remove();

  const controlPoint = [
    (utrechtPoint[0] + countryPoint[0]) / 2,
    Math.min(utrechtPoint[1], countryPoint[1]) - 80,
  ];

  /*
    The route starts at the selected country and ends in Utrecht.
    This makes the animated fish swim towards De Visdeurbel instead of away from it.
  */
  // Bron: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
  const routePath = `
    M ${countryPoint[0]} ${countryPoint[1]}
    Q ${controlPoint[0]} ${controlPoint[1]}
    ${utrechtPoint[0]} ${utrechtPoint[1]}
  `;

  routeGroup
    .append("path")
    .attr("class", "world-map-route")
    .attr("d", routePath);

  /*
    The fish is drawn directly with D3 instead of using an external image.
    This makes it easier to style the fish with CSS variables from the design system.
  */
  const fish = routeGroup
    .append("g")
    .attr("class", "route-fish-svg")
    .attr("transform", "scale(0.6)");

  // Bron: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
  fish
    .append("path")
    .attr("d", "M0 0 C7 -8 21 -10 34 0 C21 10 7 8 0 0 Z")
    .attr("class", "route-fish-body");

  fish
    .append("path")
    .attr("d", "M0 0 L-12 -8 L-8 0 L-12 8 Z")
    .attr("class", "route-fish-tail");

  fish
    .append("path")
    .attr("d", "M14 -2 C18 -8 24 -8 26 -3 C21 -4 18 -3 14 -2 Z")
    .attr("class", "route-fish-fin");

  fish
    .append("circle")
    .attr("cx", 25)
    .attr("cy", -2)
    .attr("r", 2)
    .attr("class", "route-fish-eye");

  fish
    .append("path")
    .attr("d", "M9 -3 C13 -1 13 1 9 3")
    .attr("class", "route-fish-gill");

  // Animate the custom fish along the route path.
  // Bron: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animateMotion
  // ChatGPT: Creating a custom SVG fish / Animating the fish along dynamic route /
  // Rotating fish automatically while traveling
  fish
    // animateMotion automatically follows the SVG path
    // and rotates the fish in the direction of travel.
    .append("animateMotion")
    .attr("dur", "4s")
    .attr("repeatCount", "indefinite")
    .attr("rotate", "auto")
    .attr("path", routePath);
}

/*****************/
/* MARK: Utrecht */
/*****************/

function renderUtrechtMarker(mapGroup, projection) {
  const utrechtPoint = projection(UTRECHT_COORDINATES);

  if (!utrechtPoint) return;

  const labelX = utrechtPoint[0] + 10;
  const labelY = utrechtPoint[1] - 8;

  // Pulse ring behind the logo to make Utrecht easier to spot.
  mapGroup
    .append("circle")
    .attr("class", "utrecht-marker-pulse")
    .attr("cx", utrechtPoint[0])
    .attr("cy", utrechtPoint[1])
    .attr("r", 9);

  // Visdeurbel logo marker.
  mapGroup
    .append("image")
    .attr("class", "utrecht-marker-logo")
    .attr("href", "/img/visdeurbel-logo.svg")
    .attr("x", utrechtPoint[0] - 8)
    .attr("y", utrechtPoint[1] - 8)
    .attr("width", 16)
    .attr("height", 16);

  // Background badge for the Utrecht label.
  mapGroup
    .append("rect")
    .attr("class", "utrecht-marker-label-bg")
    .attr("x", labelX - 6)
    .attr("y", labelY - 14)
    .attr("width", 58)
    .attr("height", 20)
    .attr("rx", 10);

  mapGroup
    .append("text")
    .attr("class", "utrecht-marker-label")
    .attr("x", labelX)
    .attr("y", labelY)
    .text("Utrecht");
}

/*********************/
/* MARK: Active card */
/*********************/

function updateActiveCountryCard(country, countryCounts) {
  const card = document.getElementById("active-country-card");

  if (!card) return;

  const count = getCountryCount(country, countryCounts);

  const countryCode = countries.numericToAlpha2(String(country.id));
  const flagEmoji = countryCode ? getFlagEmoji(countryCode) : "";

  const totalVisitors = getTotalVisitors(countryCounts);
  const percentage = ((count / totalVisitors) * 100).toFixed(1);
  const rank = getCountryRank(country, countryCounts);

  // Hide percentage and rank when a country has no visitors.
  const percentageRow =
    count > 0
      ? `
        <div class="active-country-card-row">
          <span class="card-icon">🌍</span>
          <span>${percentage}% van alle bezoekers</span>
        </div>
      `
      : "";

  const rankRow =
    count > 0
      ? `
        <div class="active-country-card-row">
          <span class="card-icon">#️⃣</span>
          <span>${rank} meest bezochte land</span>
        </div>
      `
      : "";

  card.innerHTML = `
    <strong class="country-title">
      <span class="country-flag">${flagEmoji}</span>
      <span class="country-name">${country.properties.name}</span>
    </strong>

    <div class="active-country-card-row">
      <span class="card-icon">👥</span>
      <span>${count.toLocaleString("nl-NL")} bezoekers</span>
    </div>

    ${percentageRow}
    ${rankRow}
  `;
}

/*****************/
/* MARK: Tooltip */
/*****************/

function showTooltip(tooltip, country, countryCounts) {
  const count = getCountryCount(country, countryCounts);

  tooltip.style("display", "block").html(`
    <strong>${country.properties.name}</strong><br>
    ${count.toLocaleString("nl-NL")} bezoekers
  `);
}

function moveTooltipToMouse(tooltip, event) {
  tooltip
    .style("left", `${event.clientX + 12}px`)
    .style("top", `${event.clientY + 12}px`);
}

function moveTooltipToCountry(tooltip, event) {
  const bounds = event.target.getBoundingClientRect();

  tooltip
    .style("left", `${bounds.left + bounds.width / 2}px`)
    .style("top", `${bounds.top - 12}px`);
}

function hideTooltip(tooltip) {
  tooltip.style("display", "none");
}

/**********************/
/* MARK: Active state */
/**********************/

function setActiveCountryById(countryId) {
  d3.selectAll(".world-map-country").classed("is-active", false);
  d3.selectAll(".top-countries-list-item").classed("is-active", false);

  d3.select(`.world-map-country[data-country-id="${countryId}"]`).classed(
    "is-active",
    true,
  );

  d3.select(`.top-countries-list-item[data-country-id="${countryId}"]`).classed(
    "is-active",
    true,
  );
}

function clearActiveCountry() {
  if (selectedCountryId) return;

  d3.selectAll(".world-map-country").classed("is-active", false);
  d3.selectAll(".top-countries-list-item").classed("is-active", false);
}

/**********************/
/* MARK: Data helpers */
/**********************/

function getCountryCounts(data) {
  const countrySessions = new Map();

  data.forEach((item) => {
    if (!item.country || !item.session_id) return;

    const numericCountryCode = countries.alpha2ToNumeric(item.country);

    if (!numericCountryCode) return;

    if (!countrySessions.has(numericCountryCode)) {
      countrySessions.set(numericCountryCode, new Set());
    }

    countrySessions.get(numericCountryCode).add(item.session_id);
  });

  const countryCounts = new Map();

  countrySessions.forEach((sessions, countryCode) => {
    countryCounts.set(countryCode, sessions.size);
  });

  return countryCounts;
}

function getCountryCount(country, countryCounts) {
  return countryCounts.get(String(country.id)) || 0;
}

function getTotalVisitors(countryCounts) {
  return [...countryCounts.values()].reduce((total, count) => total + count, 0);
}

function getCountryRank(country, countryCounts) {
  const sortedCountries = [...countryCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  );

  const countryId = String(country.id);

  return sortedCountries.findIndex(([id]) => id === countryId) + 1;
}

function getFlagEmoji(countryCode) {
  if (!countryCode) return "";

  return countryCode
    .toUpperCase()
    .replace(/./g, (character) =>
      String.fromCodePoint(127397 + character.charCodeAt()),
    );
}

/**************/
/* MARK: Init */
/**************/

function initWorldMap() {
  const rawData = window.SERVER_VIS_DATA || [];

  const data = rawData.map((item) => ({
    ...item,
    created_at: item.created_at ? new Date(item.created_at) : null,
  }));

  if (document.getElementById("world-map") && data.length > 0) {
    renderWorldMap(data);
  }
}

if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", initWorldMap);
}
