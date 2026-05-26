import * as d3 from "d3";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import countries from "i18n-iso-countries";

export function renderWorldMap(data) {
  const svg = d3.select("#world-map");

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

  const tooltip = d3.select("#world-map-tooltip");
  svg
    .selectAll(".world-map-country")
    .data(countryFeatures)
    .join("path")
    .attr("class", "world-map-country")
    .attr("d", path)
    .style("fill", (country) => {
      const count = countryCounts.get(String(country.id)) || 0;

      if (count === 0) {
        return "var(--color-white)";
      }

      return colorScale(count);
    })
    .on("mouseenter", (event, country) => {
      const count = countryCounts.get(String(country.id)) || 0;

      tooltip.style("display", "block").html(`
        <strong>${country.properties.name}</strong><br>
        ${count.toLocaleString("nl-NL")} bezoekers
      `);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", `${event.clientX + 12}px`)
        .style("top", `${event.clientY + 12}px`);
    })
    .on("mouseleave", () => {
      tooltip.style("display", "none");
    });

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
}
