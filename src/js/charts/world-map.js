/*****************/
/* MARK: Imports */
/*****************/

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
const UTRECHT_COORDINATES = [5.1214, 52.0907];

/********************/
/* MARK: Render map */
/********************/

function renderWorldMap(data) {
  const svg = d3.select("#world-map");
  const tooltip = d3.select("#world-map-tooltip");

  svg.attr("viewBox", `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);

  const projection = d3
    .geoNaturalEarth1()
    .rotate([-5, 0])
    .scale(160)
    .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

  const path = d3.geoPath(projection);

  const mapGroup = svg.append("g").attr("class", "world-map-group");

  const countryGroup = mapGroup
    .append("g")
    .attr("class", "world-map-countries");

  const routeGroup = mapGroup.append("g").attr("class", "world-map-routes");

  enableMapZoom(svg);
  renderUtrechtMarker(mapGroup, projection);

  const countryFeatures = feature(
    world,
    world.objects.countries,
  ).features.filter((country) => String(country.id) !== "010");

  const countryCounts = getCountryCounts(data);
  const maxCount = d3.max([...countryCounts.values()]) || 1;

  const colorScale = d3
    .scaleSqrt()
    .domain([1, maxCount])
    .range(["#f4f0ff", "#c0a8ff"]);

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

function showInitialTopCountryRoute(
  routeGroup,
  projection,
  path,
  countryCounts,
  countryFeatures,
) {
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
    .attr("tabindex", (country) => {
      const count = getCountryCount(country, countryCounts);

      return count > 0 ? 0 : -1;
    })

    // Sort countries by visitor count, so keyboard users reach the most relevant countries first.
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
        return "#f4f0ff";
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
      zoomToCountry(svg, path, country);
    })

    // Keyboard interaction.
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

function zoomToCountry(svg, path, country) {
  const [[x0, y0], [x1, y1]] = path.bounds(country);

  const dx = x1 - x0;
  const dy = y1 - y0;
  const x = (x0 + x1) / 2;
  const y = (y0 + y1) / 2;

  const scale = Math.max(
    1,
    Math.min(4, 0.8 / Math.max(dx / MAP_WIDTH, dy / MAP_HEIGHT)),
  );

  const translate = [MAP_WIDTH / 2 - scale * x, MAP_HEIGHT / 2 - scale * y];

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

  const topCountries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  topCountriesList.innerHTML = "";

  topCountries.forEach(([numericCountryCode, count]) => {
    const countryCode = countries.numericToAlpha2(numericCountryCode);
    const countryName = countries.getName(countryCode, "nl") || countryCode;
    const flagEmoji = getFlagEmoji(countryCode);
    const percentage = ((count / totalVisitors) * 100).toFixed(1);

    const countryFeature = countryFeatures.find(
      (country) => String(country.id) === numericCountryCode,
    );

    const listItem = document.createElement("li");

    listItem.classList.add("top-countries-list-item");
    listItem.dataset.countryId = numericCountryCode;
    listItem.tabIndex = 0;

    const rank =
      topCountries.findIndex(([id]) => id === numericCountryCode) + 1;

    listItem.innerHTML = `
  <span class="top-countries-list-country">
    <span class="rank-badge">${rank}</span>
    ${flagEmoji} ${countryName}
  </span>

  <span class="top-countries-list-count">
    ${percentage}%
  </span>
`;

    // Highlight matching country from the list.
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

function drawRouteToCountry(routeGroup, projection, path, country) {
  const utrechtPoint = projection(UTRECHT_COORDINATES);
  const countryPoint = path.centroid(country);

  if (!utrechtPoint || !countryPoint) return;

  routeGroup.selectAll("*").remove();

  const controlPoint = [
    (utrechtPoint[0] + countryPoint[0]) / 2,
    Math.min(utrechtPoint[1], countryPoint[1]) - 80,
  ];

  const routePath = `
    M ${countryPoint[0]} ${countryPoint[1]}
    Q ${controlPoint[0]} ${controlPoint[1]}
    ${utrechtPoint[0]} ${utrechtPoint[1]}
`;

  routeGroup
    .append("path")
    .attr("class", "world-map-route")
    .attr("d", routePath);

  routeGroup
    .append("image")
    .attr("class", "route-fish-svg")
    .attr("href", "/img/route-fish.svg")
    .attr("width", 24)
    .attr("height", 24)
    .attr("x", -12)
    .attr("y", -12)
    .append("animateMotion")
    .attr("dur", "4s")
    .attr("repeatCount", "indefinite")
    .attr("rotate", "auto-reverse")
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

  mapGroup
    .append("circle")
    .attr("class", "utrecht-marker-pulse")
    .attr("cx", utrechtPoint[0])
    .attr("cy", utrechtPoint[1])
    .attr("r", 9);

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
  const totalVisitors = getTotalVisitors(countryCounts);
  const percentage = ((count / totalVisitors) * 100).toFixed(1);
  const rank = getCountryRank(country, countryCounts);

  // Keep an empty line for countries without visitors to prevent layout jumping.
  const rankMarkup = count > 0 ? `${rank} meest bezochte land` : "&nbsp;";

  card.innerHTML = `
    <strong>${country.properties.name}</strong>

    <div class="active-country-card-row">
      <span class="card-icon">🔔</span>
      <span>${count.toLocaleString("nl-NL")} bezoekers</span>
    </div>

    <div class="active-country-card-row">
      <span class="card-icon">🌍</span>
      <span>${percentage}% van alle bezoekers</span>
    </div>

    <div class="active-country-card-row">
      <span class="card-icon">#️⃣</span>
      <span>${rankMarkup}</span>
  </div>
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
