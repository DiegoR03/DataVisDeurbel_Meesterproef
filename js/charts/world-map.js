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
    .scaleLinear()
    .domain([0, maxCount])
    .range(["#ffffff", "#00ff88"]);

  svg
    .selectAll(".world-map-country")
    .data(countryFeatures)
    .join("path")
    .attr("class", "world-map-country")
    .attr("d", path)
    .style("fill", (country) => {
      const count = countryCounts.get(String(country.id)) || 0;

      return count > 0 ? colorScale(count) : "var(--color-white)";
    });
}

function getCountryCounts(data) {
  const countryCounts = new Map();

  data.forEach((item) => {
    if (!item.country) return;

    const numericCountryCode = countries.alpha2ToNumeric(item.country);

    if (!numericCountryCode) return;

    const currentCount = countryCounts.get(numericCountryCode) || 0;

    countryCounts.set(numericCountryCode, currentCount + 1);
  });

  return countryCounts;
}