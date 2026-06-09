import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
// Met behulp van https://d3js.org/getting-started

const baseWidth = 1000;
const baseHeight = 600;

const margin = { top: 5, right: 0, bottom: 80, left: 60 };
const width = baseWidth - margin.left - margin.right;
const height = baseHeight - margin.top - margin.bottom;

const radius = 18;

let currentSelectedKey = "total";

function drawD3Graph(graphData, eventKeys) {

    // Transition gedaan met behulp van Gemini, ik wist niet waar ik moest beginnen....
    // Antwoord: Om de data écht te zien bewegen met transities zonder de functie te splitsen en zonder dat oude grafieken blijven staan, gaan we gebruikmaken van een slimme D3-techniek: we checken bij het aanroepen van de functie of de SVG al bestaat. Bestaat de SVG nog niet (eerste keer laden)? Dan maken we alles aan. Bestaat de SVG al (er is op de legenda geklikt)? Dan pakken we de bestaande elementen en animeren we ze met .transition() naar hun nieuwe plek.
    let svgSelection = d3.select("#chart").select("svg");
    let isFirstLoad = svgSelection.empty();
    let svg;

    if (isFirstLoad) {
        svgSelection = d3.select("#chart")
            .append("svg")
            .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
            .style("width", "100%")
            .style("height", "auto");

        svg = svgSelection.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);;

        svg.append("g").attr("class", "layer-background");
        svg.append("g").attr("class", "layer-data-paths");
        svg.append("g").attr("class", "layer-interface");
        svg.append("g").attr("class", "y-axis");
    } else {
        svg = svgSelection.select("g");
    }

    const backgroundLayer = svg.select(".layer-background");
    const dataPathLayer = svg.select(".layer-data-paths");
    const interfaceLayer = svg.select(".layer-interface");
    const yAxisGroup = svg.select(".y-axis");

    const visibleHours = graphData.filter(data => data.hour.includes(':'));

    const x = d3.scaleBand()
        .domain(visibleHours.map(data => data.hour))
        .range([0, width])
        .padding(0);

    // De || 0 || 0 is gedaan met Co-pilot sinds ik daar niet achter kwam. Hij had het met autocorrect afgemaakt voor mij
    const dataMax = d3.max(visibleHours, data => Number(data[currentSelectedKey]) || 0) || 0;

    const stepSize = dataMax > 500 ? 500 : 50;
    const rawMaxWithBuffer = dataMax * 1.15;
    const yMaxCalculated = Math.max(stepSize, Math.ceil(rawMaxWithBuffer / stepSize) * stepSize);

    const y = d3.scaleLinear()
        .domain([0, yMaxCalculated])
        .range([height, 0]);

    const yTicks = [];
    for (let i = 0; i <= yMaxCalculated; i += stepSize) {
        yTicks.push(i);
    }

    if (isFirstLoad) {
        const defs = svg.append("defs");

        defs.append("clipPath")
            .attr("id", "rect-clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height + 20)
            .attr("x", 0)
            .attr("y", 0)
            .attr("rx", 20);

        backgroundLayer.attr("clip-path", "url(#rect-clip)");

        backgroundLayer.append("rect")
            .attr("width", width)
            .attr("height", height + 20)
            .attr("fill", "var(--color-light-gold)")
            .attr("x", 0)
            .attr("rx", 20);

        backgroundLayer.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", x("06:00") || 0)
            .attr("height", height + 20)
            .attr("fill", "rgba(0, 0, 50, 0.2)")
            .style("pointer-events", "none");

        backgroundLayer.append("rect")
            .attr("x", x("22:00") || width)
            .attr("y", 0)
            .attr("width", width - (x("22:00") || width))
            .attr("height", height + 20)
            .attr("fill", "rgba(0, 0, 50, 0.15)")
            .style("pointer-events", "none");

        initBubbleAnimation(backgroundLayer, width, height, false);

        // Border radius added for a path with help from Gemini
        // Antwoord: https://gemini.google.com/app/fad94f25a6a64dde
        defs.append("clipPath")
            .attr("id", "round-bottom-clip")
            .append("path")
            .attr("d", `
                M 0,0 
                L ${width},0 
                L ${width},${height + 20 - radius} 
                A ${radius},${radius} 0 0 1 ${width - radius},${height + 20} 
                L ${radius},${height + 20} 
                A ${radius},${radius} 0 0 1 0,${height + 20 - radius} 
                Z
            `);

        interfaceLayer.append("g")
            .attr("transform", `translate(0, ${height + 50})`)
            .selectAll("text")
            .data(visibleHours)
            .join("text")
            .attr("x", data => x(data.hour) + x.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .attr("class", "axis-text")
            .text((data, i) => i % 2 !== 0 ? "" : data.hour);

        const yAxisGroup = interfaceLayer.append("g")
            .attr("transform", `translate(${-margin.left + 10}, ${height + 10}) rotate(-90)`);

        yAxisGroup.append("text")
            .attr("class", "axis-text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .text("Deurbellers");

        yAxisGroup.append("path")
            .attr("d", "M6.56044917,-0.353555947 C6.75571272,-0.548816681 7.07229521,-0.548814392 7.26755595,-0.353550834 C7.46281668,-0.158287276 7.46281439,0.158295214 7.26755083,0.353555947 L1.207,6.413 L13.8279,6.4139 C14.0733599,6.4139 14.2775084,6.59077516 14.3198443,6.82402437 L14.3279,6.9139 C14.3279,7.19004237 14.1040424,7.4139 13.8279,7.4139 L1.206,7.413 L7.26755083,13.4742441 C7.44111844,13.6478091 7.46040554,13.9172334 7.3254109,14.1121025 L7.26755595,14.1813508 C7.07229521,14.3766144 6.75571272,14.3766167 6.56044917,14.1813559 L-0.353550834,7.26745595 L-0.364,7.254 L-0.382406269,7.23604364 L-0.397,7.215 L-0.411406785,7.19820848 L-0.42,7.181 L-0.431735343,7.16625957 L-0.443,7.141 L-0.454798924,7.12197126 L-0.459,7.107 L-0.468718737,7.0883662 L-0.475,7.063 L-0.483727237,7.04074132 L-0.487,7.018 L-0.491944331,7.00377563 L-0.493,6.985 L-0.498191709,6.95651572 L-0.498,6.933 L-0.5,6.9139 L-0.498,6.893 L-0.498192325,6.87129149 L-0.493,6.842 L-0.491944331,6.82402437 L-0.487,6.809 L-0.483729072,6.78706568 L-0.474,6.763 L-0.468718737,6.7394338 L-0.46,6.723 L-0.454801934,6.70583532 L-0.441,6.682 L-0.431735343,6.66154043 L-0.421,6.647 L-0.411410897,6.62959747 L-0.397,6.612 L-0.382406269,6.59175636 L-0.364,6.573 L-0.353555947,6.56034917 L6.56044917,-0.353555947 Z")
            .attr("transform", "translate(45, -7) rotate(180, 7, 7)")
            .attr("fill", "var(--color-dark-green)");

        const xAxisGroup = interfaceLayer.append("g")
            .attr("transform", `translate(${width / 15}, ${height + margin.bottom - 10})`);

        xAxisGroup.append("text")
            .attr("class", "axis-text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .text("Tijd (Uren)");

        xAxisGroup.append("path")
            .attr("d", "M6.56044917,-0.353555947 C6.75571272,-0.548816681 7.07229521,-0.548814392 7.26755595,-0.353550834 C7.46281668,-0.158287276 7.46281439,0.158295214 7.26755595,-0.353550834 C7.46281668,-0.158287276 7.46281439,0.158295214 7.26755083,0.353555947 L1.207,6.413 L13.8279,6.4139 C14.0733599,6.4139 14.2775084,6.59077516 14.3198443,6.82402437 L14.3279,6.9139 C14.3279,7.19004237 14.1040424,7.4139 13.8279,7.4139 L1.206,7.413 L7.26755083,13.4742441 C7.44111844,13.6478091 7.46040554,13.9172334 7.3254109,14.1121025 L7.26755595,14.1813508 C7.07229521,14.3766144 6.75571272,14.3766167 6.56044917,14.1813559 L-0.353550834,7.26745595 L-0.364,7.254 L-0.382406269,7.23604364 L-0.397,7.215 L-0.411406785,7.19820848 L-0.42,7.181 L-0.431735343,7.16625957 L-0.443,7.141 L-0.454798924,7.12197126 L-0.459,7.107 L-0.468718737,7.0883662 L-0.475,7.063 L-0.483727237,7.04074132 L-0.487,7.018 L-0.491944331,7.00377563 L-0.493,6.985 L-0.498191709,6.95651572 L-0.498,6.933 L-0.5,6.9139 L-0.498,6.893 L-0.498192325,6.87129149 L-0.493,6.842 L-0.491944331,6.82402437 L-0.487,6.809 L-0.483729072,6.78706568 L-0.474,6.763 L-0.468718737,6.7394338 L-0.46,6.723 L-0.454801934,6.70583532 L-0.441,6.682 L-0.431735343,6.66154043 L-0.421,6.647 L-0.411410897,6.62959747 L-0.397,6.612 L-0.382406269,6.59175636 L-0.364,6.573 L-0.353555947,6.56034917 L6.56044917,-0.353555947 Z")
            .attr("transform", "translate(40, -7) rotate(180, 7, 7)")
            .attr("fill", "var(--color-dark-green)");
    }

    const legendContainer = d3.select("#legend-items-container");
    legendContainer.selectAll("*").remove();

    const legendItems = [
        { key: "total", label: "Totale uploads" },
        { key: "uploadedFish", label: "Geüploade Vissen" },
        ...eventKeys.map(key => ({ key: key, label: key }))
    ];

    legendItems.forEach(item => {
        const isActive = currentSelectedKey === item.key;

        const row = legendContainer.append("div")
            .style("background", isActive ? "var(--color-purple)" : "var(--color-white)")
            .style("transition", "background 1s")
            .on("click", () => {
                currentSelectedKey = item.key;
                drawD3Graph(graphData, eventKeys);
            });

        row.append("span")
            .text(item.label);
    });

    const clipPoints = [
        { hour: visibleHours[0].hour, edgeX: 0, value: visibleHours[0][currentSelectedKey] || 0 },
        ...visibleHours.map(data => ({ hour: data.hour, edgeX: x(data.hour) + x.bandwidth() / 2, value: data[currentSelectedKey] || 0 })),
        { hour: visibleHours[visibleHours.length - 1].hour, edgeX: width, value: visibleHours[visibleHours.length - 1][currentSelectedKey] || 0 }
    ];

    const areaGenerator = d3.area()
        .x(d => d.edgeX)
        .y0(height + 20)
        .y1(d => y(d.value))
        .curve(d3.curveCatmullRom.alpha(0.5));

    const lineGenerator = d3.line()
        .x(d => d.edgeX)
        .y(d => y(d.value))
        .curve(d3.curveCatmullRom.alpha(0.5));

    let areaPath = dataPathLayer.select(".area-path");
    if (areaPath.empty()) {
        areaPath = dataPathLayer.append("path")
            .attr("class", "area-path")
            .attr("fill", "var(--color-purple)")
            .attr("clip-path", "url(#round-bottom-clip)");
    }
    areaPath.datum(clipPoints)
        .transition()
        .duration(750)
        .attr("d", areaGenerator);

    let linePath = dataPathLayer.select(".line-path");
    if (linePath.empty()) {
        linePath = dataPathLayer.append("path")
            .attr("class", "line-path")
            .attr("fill", "none")
            .attr("stroke", "var(--color-purple)")
            .attr("stroke-width", 3);
    }
    linePath.datum(clipPoints)
        .transition()
        .duration(750)
        .attr("d", lineGenerator);

    interfaceLayer.select(".bubbles-layer").remove();
    interfaceLayer.select(".interaction-layer").remove();

    const bubbleGroup = interfaceLayer.append("g").attr("class", "bubbles-layer");
    const interactionGroup = interfaceLayer.append("g").attr("class", "interaction-layer");

    visibleHours.forEach((data, i) => {
        bubbleGroup.append("circle")
            .attr("class", `circle-${i}`)
            .attr("cx", x(data.hour) + x.bandwidth() / 2)
            .attr("cy", isFirstLoad ? height : (y(data[currentSelectedKey] || 0) - 10))
            .attr("r", 6)
            .attr("fill", "var(--color-white)")
            .style("opacity", 0)
            .style("pointer-events", "none");

        if (!isFirstLoad) {
            bubbleGroup.select(`.circle-${i}`)
                .transition()
                .duration(750)
                .attr("cy", y(data[currentSelectedKey] || 0) - 10);
        }
    });

    interactionGroup.selectAll(".interaction-rect")
        .data(visibleHours)
        .join("rect")
        .attr("x", d => x(d.hour))
        .attr("y", 0)
        .attr("width", x.bandwidth())
        .attr("class", "visible-hours")
        .attr("height", height + 60)
        .attr("fill", "rgba(255,255,255,0)")
        .on("mouseenter", function (event, data) {
            const i = visibleHours.indexOf(data);
            d3.select(`.circle-${i}`).style("opacity", 1);

            let tooltipContent = `<h3>${data.hour}</h3>`;
            if (currentSelectedKey === "total") {
                tooltipContent += `<p>Totaal: <strong>${data.total}</strong> events</p><div id='line'></div>`;
                eventKeys.forEach(key => {
                    if (data[key] > 0) tooltipContent += `<small>${key}: <strong>${data[key]}</strong><br></small>`;
                });
            } else {
                tooltipContent += `<p>${currentSelectedKey}: <strong>${data[currentSelectedKey] || 0}</strong></p>`;
            }

            d3.select("#tooltip").style("display", "block").html(tooltipContent);
        })
        .on("mousemove", function (event) {
            const tooltip = d3.select("#tooltip");
            const tooltipNode = tooltip.node();
            const tooltipWidth = tooltipNode ? tooltipNode.getBoundingClientRect().width : 180;

            let leftPosition = event.pageX + 15;
            if (event.clientX + tooltipWidth + 20 > window.innerWidth) {
                leftPosition = event.pageX - tooltipWidth - 15;
            }
            tooltip.style("left", leftPosition + "px").style("top", (event.pageY - 40) + "px");
        })
        .on("mouseleave", function (event, data) {
            const i = visibleHours.indexOf(data);
            d3.select(`.circle-${i}`).style("opacity", 0);
            d3.select("#tooltip").style("display", "none");
        });

    const yAxis = d3.axisLeft(y)
        .tickValues(yTicks)
        .tickFormat(d3.format("d"))
        .tickSize(0);

    yAxisGroup.transition()
        .duration(750)
        .call(yAxis)
        .on("end", () => {
            yAxisGroup.selectAll("text").attr("dx", "-10");
            yAxisGroup.select(".domain").remove();
        });

    yAxisGroup.selectAll("text").attr("dx", "-10");
    yAxisGroup.select(".domain").remove();

    initFishAnimation(backgroundLayer, width, height, currentSelectedKey);
}

function getFishImageUrl(fishKey) {
    if (fishKey === "total" || fishKey === "uploadedFish") {
        return "./img/fih.png";
    }

    const safeName = fishKey.toLowerCase().trim();
    return `./img/${safeName}.png`;
}

function initBubbleAnimation(svg, width, height) {
    const floatingGroup = svg.append("g").attr("class", "bubble-layer");
    for (let i = 0; i < 20; i++) {
        const bubble = floatingGroup.append("circle")
            .attr("fill", "var(--color-blue-green)")
            .attr("stroke", "var(--color-white");
        const animate = (b) => {
            const r = 2 + Math.random() * 6; const xPos = Math.random() * width;
            b.attr("cx", xPos)
                .attr("cy", height + 20)
                .attr("r", r)
                .attr("opacity", 0.6)
                .transition().duration(4000 + Math.random() * 5000)
                .ease(d3.easeLinear)
                .attr("cx", xPos + (Math.random() * 40 - 20))
                .attr("cy", -20)
                .attr("opacity", 0)
                .on("end", () => animate(b));
        };
        animate(bubble);
    }
}
function initFishAnimation(svg, width, height, currentKey) {
    svg.select(".fish-layer").remove();

    const fishGroup = svg.append("g").attr("class", "fish-layer");
    const imgUrl = getFishImageUrl(currentKey);

    for (let i = 0; i < 5; i++) {
        const fish = fishGroup.append("image")
            .attr("href", imgUrl)
            .attr("width", 60)
            .attr("height", 40)
            .attr("opacity", 0.5);

        const animate = (f) => {
            if (f.node() && !f.node().parentNode) return;

            const dir = Math.random() > 0.5 ? 1 : -1;
            const sX = dir === 1 ? -70 : width + 10;
            const eX = dir === 1 ? width + 10 : -70;
            const rY = 50 + Math.random() * (height * 0.7);

            const flip = dir === -1 ? "scale(1, 1)" : "scale(-1, 1)";

            f.attr("transform", `translate(${sX}, ${rY}) ${flip}`)
                .transition().duration(9000 + Math.random() * 3000)
                .ease(d3.easeLinear)
                .attr("transform", `translate(${eX}, ${rY + (Math.random() * 60 - 30)}) ${flip}`)
                .on("end", () => animate(f));
        };
        animate(fish);
    }
}

function createGraph(data) {
    const fishTypes = new Set();

    data.forEach(item => {
        if (item.event_name === "uploadedFish") {
            const queryString = item.referrer_query || item.url_query || "";

            // Gemini heeft mij geholpen met het filteren naar alleen vissen, ik was zelf nooit op (/[?&]fish=([^&]+)/i) gekomen
            const match = queryString.match(/[?&]fish=([^&]+)/i);

            if (match && match[1]) {
                const rawFishString = decodeURIComponent(match[1]);
                const cleanFishes = rawFishString.split(',')
                    .map(f => f.trim())
                    // Filter the onbekende en unknown uit de cvs data, met behulp van Co-pilot autocorrect gedaan
                    .filter(f => f.length > 0 && f.toLowerCase() !== 'unknown' && f.toLowerCase() !== 'onbekend');

                if (cleanFishes.length > 0) {
                    item.extracted_fishes = cleanFishes;
                    cleanFishes.forEach(fish => fishTypes.add(fish));
                }
            }
        }
    });

    const uniqueFishArray = Array.from(fishTypes).sort();
    const eventKeysForLegend = [...uniqueFishArray];

    const groupedHours = Array.from({ length: 24 }, (_, i) => {
        const hourString = `${String(i).padStart(2, '0')}:00`;
        const startObject = { hour: hourString, total: 0, uploadedFish: 0 };
        uniqueFishArray.forEach(fish => { startObject[fish] = 0; });
        return startObject;
    });

    let latestDate = null;

    data.forEach(item => {
        if (!item.created_at || isNaN(item.created_at.getTime()) || !item.event_name) return;
        if (!latestDate || item.created_at > latestDate) { latestDate = item.created_at; }

        const hourNumber = item.created_at.getHours();
        if (hourNumber >= 0 && hourNumber < 24) {
            groupedHours[hourNumber].total += 1;

            if (item.event_name === "uploadedFish") {
                groupedHours[hourNumber].uploadedFish += 1;

                if (item.extracted_fishes) {
                    item.extracted_fishes.forEach(fish => {
                        if (groupedHours[hourNumber].hasOwnProperty(fish)) {
                            groupedHours[hourNumber][fish] += 1;
                        }
                    });
                }
            }
        }
    });

    if (latestDate) {
        const formattedDate = latestDate.toLocaleDateString('nl-NL', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        d3.select("#latest-date").text(formattedDate);
    }

    const previousHour = { ...groupedHours[23], hour: "last_Hour" };
    const nextHour = { ...groupedHours[0], hour: "next_Hour" };
    const graphDataWithBuffers = [previousHour, ...groupedHours, nextHour];

    drawD3Graph(graphDataWithBuffers, eventKeysForLegend);
}

if (typeof window !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        const globalWindow = window;
        const rawData = globalWindow.SERVER_VIS_DATA || [];

        const data = rawData.map((item) => ({
            ...item,
            created_at: item.created_at ? new Date(item.created_at) : null,
        }));

        if (data.length > 0) {
            createGraph(data);
        }
    });
}