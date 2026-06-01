import * as d3 from "d3";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import countries from "i18n-iso-countries";

export function renderWorldMap(data) {
  const svg = d3.select("#world-map");
  const tooltip = d3.select("#world-map-tooltip");

  const width = 900;
  const height = 500;

  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const projection = d3
    .geoNaturalEarth1()
    .scale(160)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath(projection);
  const countryFeatures = feature(world, world.objects.countries).features;

  const countryCounts = getCountryCounts(data);
  const maxCount = d3.max([...countryCounts.values()]) || 1;

  const colorScale = d3
    .scaleSqrt()
    .domain([1, maxCount])
    .range(["#dfffee", "#01463C"]);

  renderCountries(
    svg,
    countryFeatures,
    path,
    countryCounts,
    colorScale,
    tooltip,
  );
  renderTopCountriesList(countryCounts);
}

function renderCountries(
  svg,
  countryFeatures,
  path,
  countryCounts,
  colorScale,
  tooltip,
) {
  svg
    .selectAll(".world-map-country")
    .data(countryFeatures)
    .join("path")
    .attr("class", "world-map-country")
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
        return "var(--color-white)";
      }

      return colorScale(count);
    })
    .on("mouseenter", (event, country) => {
      showTooltip(tooltip, country, countryCounts);
      moveTooltipToMouse(tooltip, event);
    })
    .on("mousemove", (event) => {
      moveTooltipToMouse(tooltip, event);
    })
    .on("mouseleave", () => {
      hideTooltip(tooltip);
    })
    .on("focus", (event, country) => {
      showTooltip(tooltip, country, countryCounts);
      moveTooltipToCountry(tooltip, event);
    })
    .on("blur", () => {
      hideTooltip(tooltip);
    });
}

function renderTopCountriesList(countryCounts) {
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

    const listItem = document.createElement("li");

    listItem.classList.add("top-countries-list-item");

    listItem.innerHTML = `
      <span class="top-countries-list-country">
        ${flagEmoji} ${countryName}
      </span>

      <span class="top-countries-list-count">
        ${percentage}%
      </span>
    `;

    topCountriesList.appendChild(listItem);
  });
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
