import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function drawRuisvoorn(data) {
    const fishData = data.filter(item => item.fish_name === "Ruisvoorn");
    const totalSpotted = fishData.length;

    const subtitle = document.querySelector("#card-ruisvoorn .card-subtitle");
    if(subtitle) {
        subtitle.innerText = `${totalSpotted}x gespot`;
    }

    const width = 330;
    const height = 550;
    const maxSpotted = 500; 

    const container = d3.select("#card-ruisvoorn .d3-container");
    container.selectAll("svg").remove();

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const ySchaal = d3.scaleLinear()
        .domain([0, maxSpotted])
        .range([height - 20, 150]); 

    const waterHeight = ySchaal(totalSpotted);

    const wavePath = `
        M 0 ${waterHeight}
        Q ${width * 0.25} ${waterHeight + 20}, ${width * 0.5} ${waterHeight - 5}
        T ${width} ${waterHeight - 20}
        L ${width} ${height}
        L 0 ${height}
        Z
    `;

    svg.append("path")
        .attr("d", wavePath)
        .attr("fill", "var(--color-purple)");
}

export function drawBaars(data) {
    const fishData = data.filter(item => item.fish_name === "Baars");
    const totalSpotted = fishData.length;

    const subtitle = document.querySelector("#card-baars .card-subtitle");
    if(subtitle) {
        subtitle.innerText = `${totalSpotted}x gespot`;
    }

    const width = 330;
    const height = 550;
    const maxSpotted = 500; 

    const container = d3.select("#card-baars .d3-container");
    container.selectAll("svg").remove();

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const ySchaal = d3.scaleLinear()
        .domain([0, maxSpotted])
        .range([height - 20, 150]); 

    const waterHeight = ySchaal(totalSpotted);

    const wavePath = `
        M 0 ${waterHeight}
        Q ${width * 0.25} ${waterHeight + 20}, ${width * 0.5} ${waterHeight - 5}
        T ${width} ${waterHeight - 20}
        L ${width} ${height}
        L 0 ${height}
        Z
    `;

    svg.append("path")
        .attr("d", wavePath)
        .attr("fill", "var(--color-purple)");
}

export function drawPaling(data) {
    const fishData = data.filter(item => item.fish_name === "Paling");
    const totalSpotted = fishData.length;

    const subtitle = document.querySelector("#card-paling .card-subtitle");
    if(subtitle) {
        subtitle.innerText = `${totalSpotted}x gespot`;
    }

    const width = 330;
    const height = 550;
    const maxSpotted = 500; 

    const container = d3.select("#card-paling .d3-container");
    container.selectAll("svg").remove();

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const ySchaal = d3.scaleLinear()
        .domain([0, maxSpotted])
        .range([height - 20, 150]); 

    const waterHeight = ySchaal(totalSpotted);

    const wavePath = `
        M 0 ${waterHeight}
        Q ${width * 0.25} ${waterHeight + 20}, ${width * 0.5} ${waterHeight - 5}
        T ${width} ${waterHeight - 20}
        L ${width} ${height}
        L 0 ${height}
        Z
    `;

    svg.append("path")
        .attr("d", wavePath)
        .attr("fill", "var(--color-purple)");
}