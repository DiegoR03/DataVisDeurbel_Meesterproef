import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function drawWaveChart(data) {
    const ruisvoornData = data.filter(item => item.fish_name === "Ruisvoorn");
    const totaalGespot = ruisvoornData.length;

    const subtitel = document.querySelector("#kaart-ruisvoorn .kaart-subtitel");
    if(subtitel) {
        subtitel.innerText = `${totaalGespot}x gespot`;
    }

    const width = 320;
    const height = 500;
    const maxGespot = 300; 

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
        Q 80 ${waterHoogte + 20}, 160 ${waterHoogte - 5}
        T 320 ${waterHoogte - 20}
        L 320 ${height}
        L 0 ${height}
        Z
    `;

    svg.append("path")
        .attr("d", wavePath)
        .attr("fill", "var(--color-purple)");
}