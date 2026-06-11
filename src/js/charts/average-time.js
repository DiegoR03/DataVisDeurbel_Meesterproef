import * as d3 from "d3";

function getWeekInfo(date) {
    const d = new Date(date.valueOf());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const year = d.getFullYear();
    const firstThursday = new Date(year, 0, 4);
    const weekNo = Math.ceil((((d - firstThursday) / 86400000) + 1) / 7);
    
    return {
        week: weekNo,
        year: year,
        label: `Week ${weekNo + 1}, ${year}`,
        sortKey: year * 100 + weekNo
    };
}

export function initVisualisatie(data) {
    if (!data || data.length === 0) return;

    const fishEvents = data
        .filter(item =>
            item.event_name === "uploadedFish" &&
            item.fish_name &&
            item.fish_name.toLowerCase() !== 'unknown' &&
            item.fish_name.toLowerCase() !== 'onbekend' &&
            item.created_at
        )
        .flatMap(item => {
            const individualFishes = item.fish_name.split(',').map(name => name.trim());
            return individualFishes
                .filter(name => name.toLowerCase() !== 'unknown' && name.toLowerCase() !== 'onbekend' && name !== '')
                .map(singleFishName => ({
                    ...item,
                    fish_name: singleFishName,
                    date: item.created_at instanceof Date ? item.created_at : new Date(item.created_at)
                }));
        })
        .filter(item => !isNaN(item.date.getTime()))
        .sort((a, b) => a.date - b.date);

    if (fishEvents.length === 0) return;

    const weeksMap = d3.group(fishEvents, d => getWeekInfo(d.date).label);
    
    const uniekeWekenMap = new Map();
    fishEvents.forEach(d => {
        const info = getWeekInfo(d.date);
        if (!uniekeWekenMap.has(info.label)) {
            uniekeWekenMap.set(info.label, info);
        }
    });
    
    const gesorteerdeWeken = Array.from(uniekeWekenMap.values())
        .sort((a, b) => a.sortKey - b.sortKey);

    let controls = d3.select("#controls-container");
    if (controls.empty()) {
        controls = d3.select("#stopwatch-container").nodes()[0].parentNode 
            ? d3.select(d3.select("#stopwatch-container").nodes()[0].parentNode).insert("div", "#stopwatch-container").attr("id", "controls-container")
            : d3.select("body").append("div").attr("id", "controls-container");
    }
    controls.selectAll("*").remove();

    const selectWrapper = controls.append("div")
        .attr("class", "custom-select-wrapper");

    selectWrapper.append("label")
        .attr("for", "week-select")
        .attr("class", "select-label")
        .text("Periode:");

    const selectContainer = selectWrapper.append("div")
        .attr("class", "select-container");

    const select = selectContainer.append("select")
        .attr("id", "week-select")
        .attr("class", "modern-select");

    select.selectAll("option")
        .data(gesorteerdeWeken)
        .enter()
        .append("option")
        .attr("value", d => d.label)
        .text(d => d.label);

    const meestRecenteWeekLabel = gesorteerdeWeken[gesorteerdeWeken.length - 1].label;
    select.property("value", meestRecenteWeekLabel);

    setupStopwatchBase();
    setupKalenderBase();
    setupNavigation();
    
    updateStopwatch(weeksMap.get(meestRecenteWeekLabel));
    updateVisKalender(weeksMap.get(meestRecenteWeekLabel));

    select.on("change", function(event) {
        const gekozenWeek = event.target.value;
        updateStopwatch(weeksMap.get(gekozenWeek));
        updateVisKalender(weeksMap.get(gekozenWeek));
    });
}

function setupNavigation() {
    const container = d3.select("#stopwatch-container");
    if (container.empty()) return;

    const buttons = d3.selectAll("#button-container button");
    if (buttons.size() >= 2) {
        const backButton = d3.select(buttons.nodes()[0]);
        const nextButton = d3.select(buttons.nodes()[1]);

        container.style("transform", "translateX(0%)");
        backButton.style("opacity", 0.5).style("pointer-events", "none");
        nextButton.style("opacity", 1).style("pointer-events", "auto");

        nextButton.on("click", () => {
            container.style("transform", "translateX(-50%)");
            nextButton.style("opacity", 0.5).style("pointer-events", "none");
            backButton.style("opacity", 1).style("pointer-events", "auto");
        });

        backButton.on("click", () => {
            container.style("transform", "translateX(0%)");
            backButton.style("opacity", 0.5).style("pointer-events", "none");
            nextButton.style("opacity", 1).style("pointer-events", "auto");
        });
    }
}

function setupStopwatchBase() {
    const container = d3.select("#stopwatch-container");
    if (container.empty()) return;

    if (window.stopwatchInterval) window.stopwatchInterval.stop();
    container.selectAll(".stopwatch-wrapper").remove();

    const wrapper = container.append("div").attr("class", "stopwatch-wrapper");
    const internalSize = 120;
    const radius = internalSize / 2;

    const svg = wrapper.append("svg")
        .attr("viewBox", `0 0 ${internalSize} ${internalSize}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("class", "stopwatch-svg");

    const clockGroup = svg.append("g").attr("transform", `translate(${radius}, ${radius})`).attr("id", "clock-group");

    clockGroup.append("circle").attr("r", radius - 6).attr("fill", "none").attr("stroke", "var(--color-dark-green)").attr("stroke-width", 4);
    clockGroup.append("rect").attr("x", -6).attr("y", -radius).attr("width", 12).attr("height", 6).attr("fill", "var(--color-dark-green)").attr("rx", 2);

    clockGroup.append("line")
        .attr("id", "gemiddelde-wijzer")
        .attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", -(radius - 16))
        .attr("stroke", "var(--color-purple)")
        .attr("stroke-width", 4)
        .attr("stroke-linecap", "round");

    const secondenWijzer = clockGroup.append("line")
        .attr("id", "seconden-wijzer")
        .attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", -(radius - 12))
        .attr("stroke", "var(--color-purple)").attr("opacity", 0.6).attr("stroke-width", 2).attr("stroke-linecap", "round");

    clockGroup.append("circle").attr("r", 5).attr("fill", "var(--color-dark-green)");

    wrapper.append("div").attr("id", "stopwatch-text");

    let huidigeSeconde = new Date().getSeconds();
    secondenWijzer.transition().duration(1200).ease(d3.easeElasticOut.amplitude(1).period(0.4)).attr("transform", `rotate(${huidigeSeconde * 6})`);

    window.stopwatchInterval = d3.interval(() => {
        huidigeSeconde++;
        secondenWijzer.transition().duration(100).ease(d3.easeLinear).attr("transform", `rotate(${huidigeSeconde * 6})`);
    }, 1000);
}

function updateStopwatch(weekData) {
    if (!weekData || weekData.length === 0) return;

    let gemiddeldeMinuten = 0;
    let latestFishName = weekData[weekData.length - 1].fish_name;

    if (weekData.length > 1) {
        let totaleTijdVerschilMs = 0;
        for (let i = 1; i < weekData.length; i++) {
            totaleTijdVerschilMs += (weekData[i].date - weekData[i - 1].date);
        }
        const gemiddeldeMs = totaleTijdVerschilMs / (weekData.length - 1);
        gemiddeldeMinuten = Math.round(gemiddeldeMs / 1000 / 60);
    }

    const gradenMinuten = (gemiddeldeMinuten / 60) * 360;
    d3.select("#gemiddelde-wijzer")
        .transition()
        .duration(1000)
        .ease(d3.easeElasticOut.amplitude(1).period(0.4))
        .attr("transform", `rotate(${gradenMinuten})`);

    const minutenTekst = gemiddeldeMinuten === 1 ? "minuut" : "minuten";
    d3.select("#stopwatch-text").html(`
        Gemiddeld duurde het deze week <span class="stopwatch-text-highlight">${gemiddeldeMinuten} ${minutenTekst}</span> voordat er 
        een 🐟 vis werd gezien. De <span class="stopwatch-text-highlight">${latestFishName}</span> was de laatste vis van deze week.
    `);
}

function setupKalenderBase() {
    const container = d3.select("#stopwatch-container");
    if (container.empty()) return;

    container.selectAll(".timeline-wrapper.calendar-section").remove();

    const wrapper = container.append("div")
        .attr("class", "timeline-wrapper calendar-section");

    wrapper.append("div").attr("class", "timeline-title").text("Visactiviteit deze week");
    wrapper.append("p").attr("class", "timeline-explanation").text("Bekijk op welke dagen en dagdelen de vissen het meest actief waren.");

    const viewWidth = 400; 
    const viewHeight = 250;

    const svg = wrapper.append("svg")
        .attr("viewBox", `0 0 ${viewWidth} ${viewHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("class", "timeline-svg");

    const margin = { top: 40, right: 20, bottom: 20, left: 20 };
    const chartWidth = viewWidth - margin.left - margin.right;
    const chartHeight = viewHeight - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .attr("id", "calendar-grid-cells");

    svg.datum({ 
        chartWidth, 
        chartHeight, 
        margin 
    });

    const dagen = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
    const dagdelen = ["Nacht (0-6)", "Ochtend (6-12)", "Middag (12-18)", "Avond (18-24)"];

    const xScale = d3.scaleBand().domain(dagen).range([0, chartWidth]).padding(0.12);
    const yScale = d3.scaleBand().domain(dagdelen).range([0, chartHeight]).padding(0.12);

    svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top - 10})`)
        .attr("class", "calendar-axis x-axis")
        .call(d3.axisTop(xScale).tickSize(0));

    svg.append("g")
        .attr("transform", `translate(${margin.left - 10}, ${margin.top})`)
        .attr("class", "calendar-axis y-axis")
        .call(d3.axisLeft(yScale).tickSize(0));
}

function updateVisKalender(weekData) {
    const svg = d3.select(".timeline-svg");
    const gridCellsGroup = d3.select("#calendar-grid-cells");
    const { chartWidth, chartHeight } = svg.datum();

    const dagen = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
    const dagdelen = ["Nacht (0-6)", "Ochtend (6-12)", "Middag (12-18)", "Avond (18-24)"];

    const xScale = d3.scaleBand().domain(dagen).range([0, chartWidth]).padding(0.12);
    const yScale = d3.scaleBand().domain(dagdelen).range([0, chartHeight]).padding(0.12);

    const gridMatrix = [];
    dagen.forEach(dag => {
        dagdelen.forEach(deel => {
            gridMatrix.push({ dag: dag, dagdeel: deel, count: 0, fishes: [] });
        });
    });

    if (weekData && weekData.length > 0) {
        weekData.forEach(fish => {
            const jsDay = fish.date.getDay(); 
            const correctedDayIndex = jsDay === 0 ? 6 : jsDay - 1;
            const dagNaam = dagen[correctedDayIndex];

            const uur = fish.date.getHours();
            let dagdeelNaam = "";

            switch(true){
                case (uur >= 0 && uur < 6):
                    dagdeelNaam = dagdelen[0];
                    break;
                case (uur >= 6 && uur < 12):
                    dagdeelNaam = dagdelen[1];
                    break;
                case (uur >= 12 && uur < 18):
                    dagdeelNaam = dagdelen[2];
                    break;
                default:
                    dagdeelNaam = dagdelen[3];
                    break;
            }

            const cel = gridMatrix.find(c => c.dag === dagNaam && c.dagdeel === dagdeelNaam);
            if (cel) {
                cel.count++;
                cel.fishes.push(fish.fish_name);
            }
        });
    }

    const maxCount = d3.max(gridMatrix, d => d.count) || 1;

    gridCellsGroup.selectAll("rect")
        .data(gridMatrix)
        .join("rect")
        .attr("x", d => xScale(d.dag))
        .attr("y", d => yScale(d.dagdeel))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("rx", 4)
        .style("stroke", "none")
        .attr("class", d => {
            const t = maxCount > 1 ? (d.count - 1) / (maxCount - 1) : 0.5;

            switch(true){
                case (d.count === 0):
                    return "calendar-cell cell-0"
                    break;
                case (t < 0.33):
                    return "calendar-cell cell-low";
                    break;
                case (t < 0.66):
                    return "calendar-cell cell-mid";
                    break;
                default:
                    return "calendar-cell cell-high";
                    break; 
            }
        });

    gridCellsGroup.selectAll("rect")
        .on("mouseenter", function (event, d) {
            if (d.count === 0) return;

            d3.select(this)
                .style("stroke", "var(--color-purple)");

            const visTellingen = d3.rollups(d.fishes, v => v.length, f => f);
            
            let tooltipContent = `<h3>${d.dag} - ${d.dagdeel.split(" ")[0]}</h3><div id='line'></div>`;
            tooltipContent += `<p>Totaal gespot: <strong>${d.count} vissen</strong></p>`;
            visTellingen.forEach(([name, aantal]) => {
                tooltipContent += `<p>🐟 ${aantal}x <strong>${name}</strong></p>`;
            });

            d3.select("#tooltip")
                .style("display", "block")
                .html(tooltipContent);
        })
        .on("mousemove", function (event) {
            const tooltip = d3.select("#tooltip");
            const tooltipNode = tooltip.node();
            const tooltipWidth = tooltipNode ? tooltipNode.getBoundingClientRect().width : 180;

            let leftPosition = event.pageX + 15;
            if (event.clientX + tooltipWidth + 20 > window.innerWidth) {
                leftPosition = event.pageX - tooltipWidth - 15;
            }
            tooltip
                .style("left", leftPosition + "px")
                .style("top", (event.pageY - 40) + "px");
        })
        .on("mouseleave", function () {
            d3.select(this).style("stroke", "none");
            d3.select("#tooltip").style("display", "none");
        });
}

if (typeof window !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        const rawData = window.SERVER_VIS_DATA || [];
        const data = rawData.map((item) => ({
            ...item,
            created_at: item.created_at ? new Date(item.created_at) : null,
        }));
        initVisualisatie(data);
    });
}