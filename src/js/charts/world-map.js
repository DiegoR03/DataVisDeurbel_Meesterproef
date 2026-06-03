import * as d3 from "d3";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import countries from "i18n-iso-countries";

let selectedCountryId = null;

const MAP_WIDTH = 900;
const MAP_HEIGHT = 500;
const UTRECHT_COORDINATES = [5.1214, 52.0907];

export function renderWorldMap(data) {
  const svg = d3.select("#world-map");

  const tooltip = d3.select("#world-map-tooltip");

  svg.attr("viewBox", `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);

  const projection = d3

    .geoNaturalEarth1()

    .scale(160)

    .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

  const path = d3.geoPath(projection);

  const mapGroup = svg.append("g").attr("class", "world-map-group");

  const countryGroup = mapGroup

    .append("g")

    .attr("class", "world-map-countries");

  const routeGroup = mapGroup

    .append("g")

    .attr("class", "world-map-routes");

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

    .range(["#DCEFEA", "#01463C"]);

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

  svg.on("click", (event) => {
    const clickedOnCountry =
      event.target.classList.contains("world-map-country");

    if (!clickedOnCountry) {
      resetMap(svg, routeGroup);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      resetMap(svg, routeGroup);
    }
  });
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
    .attr("tabindex", (country) => {
      const count = getCountryCount(country, countryCounts);

      return count > 0 ? 0 : -1;
    })
    .sort((a, b) => {
      const countA = getCountryCount(a, countryCounts);
      const countB = getCountryCount(b, countryCounts);

      return countB - countA;
    })
    .attr("aria-label", (country) => {
      const count = getCountryCount(country, countryCounts);

      return `${country.properties.name}: ${count.toLocaleString(
        "nl-NL",
      )} bezoekers`;
    })
    .style("fill", (country) => {
      const count = getCountryCount(country, countryCounts);

      if (count === 0) {
        return "#EAF4F0";
      }

      return colorScale(count);
    })
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
    .on("click", (event, country) => {
      event.stopPropagation();

      selectedCountryId = String(country.id);

      setActiveCountryById(selectedCountryId);
      updateActiveCountryCard(country, countryCounts);
      drawRouteToCountry(routeGroup, projection, path, country);
      zoomToCountry(svg, path, country);
    })
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

function renderTopCountriesList(countryCounts, countryFeatures) {
  const topCountriesList = document.getElementById("top-countries-list");

  if (!topCountriesList) return;

  const totalVisitors = [...countryCounts.values()].reduce(
    (total, count) => total + count,
    0,
  );

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

    listItem.innerHTML = `
      <span class="top-countries-list-country">
        ${flagEmoji} ${countryName}
      </span>

      <span class="top-countries-list-count">
        ${percentage}%
      </span>
    `;

    listItem.addEventListener("mouseleave", () => {
      clearActiveCountry();
    });

    listItem.addEventListener("mouseenter", () => {
      setActiveCountryById(numericCountryCode);

      if (countryFeature) {
        updateActiveCountryCard(countryFeature, countryCounts);
      }
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

function drawRouteToCountry(routeGroup, projection, path, country) {
  const utrechtPoint = projection(UTRECHT_COORDINATES);
  const countryPoint = path.centroid(country);

  if (!utrechtPoint || !countryPoint) return;

  routeGroup.selectAll("*").remove();

  const controlPoint = [
    (utrechtPoint[0] + countryPoint[0]) / 2,
    Math.min(utrechtPoint[1], countryPoint[1]) - 80,
  ];

  const routeStartPoint =
    utrechtPoint[0] < countryPoint[0] ? utrechtPoint : countryPoint;

  const routeEndPoint =
    utrechtPoint[0] < countryPoint[0] ? countryPoint : utrechtPoint;

  const routePath = `M ${routeStartPoint[0]} ${routeStartPoint[1]} Q ${controlPoint[0]} ${controlPoint[1]} ${routeEndPoint[0]} ${routeEndPoint[1]}`;

  routeGroup
    .append("path")
    .attr("class", "world-map-route")
    .attr("id", "active-route")
    .attr("d", routePath);

  routeGroup
    .selectAll(".route-fish")
    .data([0, 1, 2])
    .join("text")
    .attr("class", "route-fish")
    .append("textPath")
    .attr("href", "#active-route")
    .attr("startOffset", (d) => `${20 + d * 18}%`)
    .text("🐟");
}

function zoomToCountry(svg, path, country) {
  const [[x0, y0], [x1, y1]] = path.bounds(country);

  const dx = x1 - x0;
  const dy = y1 - y0;
  const x = (x0 + x1) / 2;
  const y = (y0 + y1) / 2;

  const scale = Math.max(
    1,
    Math.min(2.2, 0.8 / Math.max(dx / MAP_WIDTH, dy / MAP_HEIGHT)),
  );

  const translate = [MAP_WIDTH / 2 - scale * x, MAP_HEIGHT / 2 - scale * y];

  svg
    .select(".world-map-group")
    .transition()
    .duration(700)
    .attr(
      "transform",
      `translate(${translate[0]}, ${translate[1]}) scale(${scale})`,
    );
}

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

function updateActiveCountryCard(country, countryCounts) {
  const card = document.getElementById("active-country-card");

  if (!card) return;

  const count = getCountryCount(country, countryCounts);

  const totalVisitors = getTotalVisitors(countryCounts);

  const percentage = ((count / totalVisitors) * 100).toFixed(1);

  const rank = getCountryRank(country, countryCounts);

  card.innerHTML = `

    <strong>${country.properties.name}</strong>

    <span>${count.toLocaleString("nl-NL")} bezoekers</span>

    <span>${percentage}% van alle bezoekers</span>

    <span>#${rank} meest bezochte land</span>

  `;
}

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

function getFlagEmoji(countryCode) {
  if (!countryCode) return "";

  return countryCode
    .toUpperCase()
    .replace(/./g, (character) =>
      String.fromCodePoint(127397 + character.charCodeAt()),
    );
}

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

function resetMap(svg, routeGroup) {
  selectedCountryId = null;

  d3.selectAll(".world-map-country").classed("is-active", false);
  d3.selectAll(".top-countries-list-item").classed("is-active", false);

  routeGroup.selectAll("*").remove();

  svg
    .select(".world-map-group")
    .transition()
    .duration(700)
    .attr("transform", "translate(0, 0) scale(1)");
}

function renderUtrechtMarker(mapGroup, projection) {
  const utrechtPoint = projection(UTRECHT_COORDINATES);

  const labelX = utrechtPoint[0] + 10;
  const labelY = utrechtPoint[1] - 8;

  if (!utrechtPoint) return;

  mapGroup
    .append("circle")
    .attr("class", "utrecht-marker-pulse")
    .attr("cx", utrechtPoint[0])
    .attr("cy", utrechtPoint[1])
    .attr("r", 9);

  mapGroup
    .append("circle")
    .attr("class", "utrecht-marker")
    .attr("cx", utrechtPoint[0])
    .attr("cy", utrechtPoint[1])
    .attr("r", 5);

  mapGroup
    .append("text")
    .attr("class", "utrecht-marker-label")
    .attr("x", utrechtPoint[0] + 10)
    .attr("y", utrechtPoint[1] - 8)
    .text("Utrecht");

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
