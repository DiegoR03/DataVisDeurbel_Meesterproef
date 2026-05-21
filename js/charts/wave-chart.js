import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function drawRuisvoorn(data) {
    const fishData = data.filter(item => item.fish_name === "Ruisvoorn");
    const totaalGespot = fishData.length;

    const subtitel = document.querySelector("#kaart-ruisvoorn .kaart-subtitel");
    if(subtitel) {
        subtitel.innerText = `${totaalGespot}x gespot`;
    }

    const width = 330;
    const height = 550;
    const maxGespot = 500; 

    const container = d3.select("#kaart-ruisvoorn .d3-container");
    container.selectAll("svg").remove();

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const ySchaal = d3.scaleLinear()
        .domain([0, maxGespot])
        .range([height - 20, 150]); 

    const waterHoogte = ySchaal(totaalGespot);

    const wavePath = `
        M 0 ${waterHoogte}
        Q ${width * 0.25} ${waterHoogte + 20}, ${width * 0.5} ${waterHoogte - 5}
        T ${width} ${waterHoogte - 20}
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
    const totaalGespot = fishData.length;

    const subtitel = document.querySelector("#kaart-baars .kaart-subtitel");
    if(subtitel) {
        subtitel.innerText = `${totaalGespot}x gespot`;
    }

    const width = 330;
    const height = 550;
    const maxGespot = 500; 

    const container = d3.select("#kaart-baars .d3-container");
    container.selectAll("svg").remove();

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const ySchaal = d3.scaleLinear()
        .domain([0, maxGespot])
        .range([height - 20, 150]); 

    const waterHoogte = ySchaal(totaalGespot);

    const wavePath = `
        M 0 ${waterHoogte}
        Q ${width * 0.25} ${waterHoogte + 20}, ${width * 0.5} ${waterHoogte - 5}
        T ${width} ${waterHoogte - 20}
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
    const totaalGespot = fishData.length;

    const subtitel = document.querySelector("#kaart-paling .kaart-subtitel");
    if(subtitel) {
        subtitel.innerText = `${totaalGespot}x gespot`;
    }

    const width = 330;
    const height = 550;
    const maxGespot = 500; 

    const container = d3.select("#kaart-paling .d3-container");
    container.selectAll("svg").remove();

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const ySchaal = d3.scaleLinear()
        .domain([0, maxGespot])
        .range([height - 20, 150]); 

    const waterHoogte = ySchaal(totaalGespot);

    const wavePath = `
        M 0 ${waterHoogte}
        Q ${width * 0.25} ${waterHoogte + 20}, ${width * 0.5} ${waterHoogte - 5}
        T ${width} ${waterHoogte - 20}
        L ${width} ${height}
        L 0 ${height}
        Z
    `;

    svg.append("path")
        .attr("d", wavePath)
        .attr("fill", "var(--color-purple)");
}