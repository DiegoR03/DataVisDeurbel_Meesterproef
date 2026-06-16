import * as d3 from "d3";

// Bron: https://www.w3schools.com/js/js_dates.asp
function getWeekInfo(date) {
    const d = new Date(date.valueOf());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const year = d.getFullYear();
    const firstThursday = new Date(year, 0, 4);
    const weekNo = Math.ceil((((d - firstThursday) / 86400000) + 1) / 7);

    const maandag = new Date(d.getTime());
    maandag.setDate(d.getDate() - 3);

    const zondag = new Date(maandag.getTime());
    zondag.setDate(maandag.getDate() + 6);
    
    const opties = { day: 'numeric', month: 'long' };
    const formatter = new Intl.DateTimeFormat('nl-NL', opties);
    const startTekst = formatter.format(maandag);
    const eindTekst = formatter.format(zondag);
    const label = `${startTekst} - ${eindTekst} ${year}`;
    return {
        week: weekNo,
        year: year,
        label: label,
        sortKey: year * 100 + weekNo
    };
}

export function initVisualisatie(data) {
    if (!data || data.length === 0) return;

    // Met behulp van Gemini: Filtert ongeldige visdata en splitst meervoudige visnamen (gescheiden door komma's) op naar individuele objecten.
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

    // Bron: https://d3js.org/d3-selection/selecting: is de d3 versie van querySelector
    const stopwatchNode = d3.select("#stopwatch-container").node();
    const parentContainer = stopwatchNode ? d3.select(stopwatchNode.parentNode) : d3.select("body");

    let controls = parentContainer.select("#floating-controls");
    if (controls.empty()) {
        controls = parentContainer.append("div").attr("id", "floating-controls");
    }
    controls.selectAll("*").remove();

    const meestRecenteWeekLabel = gesorteerdeWeken[gesorteerdeWeken.length - 1].label;
    let actieveWeekIndex = gesorteerdeWeken.findIndex(d => d.label === meestRecenteWeekLabel);

    const toolbar = controls.append("div").attr("class", "floating-toolbar");

    const prevBtn = toolbar.append("button")
    .attr("class", "toolbar-btn prev")
    .attr("id", "btn-prev")
    .attr("aria-label", "Button om de data van vorige week te zien");

    prevBtn.append("svg")
        .attr("viewBox", "0 0 14.8279 14.8278")
        .append("path")
        .attr("d", "M6.56044917,-0.353555947 C6.75571272,-0.548816681 7.07229521,-0.548814392 7.26755595,-0.353550834 C7.46281668,-0.158287276 7.46281439,0.158295214 7.26755595,0.353555947 L1.207,6.413 L13.8279,6.4139 C14.0733599,6.4139 14.2775084,6.59077516 14.3198443,6.82402437 L14.3279,6.9139 C14.3279,7.19004237 14.1040424,7.4139 13.8279,7.4139 L1.206,7.413 L7.26755083,13.4742441 C7.44111844,13.6478091 7.46040554,13.9172334 7.3254109,14.1121025 L7.26755595,14.1813508 C7.07229521,14.3766144 6.75571272,14.3766167 6.56044917,14.1813559 L-0.353550834,7.26745595 L-0.364,7.254 L-0.382406269,7.23604364 L-0.397,7.215 L-0.411406785,7.19820848 L-0.42,7.181 L-0.431735343,7.16625957 L-0.443,7.141 L-0.454798924,7.12197126 L-0.459,7.107 L-0.468718737,7.0883662 L-0.475,7.063 L-0.483727237,7.04074132 L-0.487,7.018 L-0.491944331,7.00377563 L-0.493,6.985 L-0.498191709,6.95651572 L-0.498,6.933 L-0.5,6.9139 L-0.498,6.893 L-0.498192325,6.87129149 L-0.493,6.842 L-0.491944331,6.82402437 L-0.487,6.809 L-0.483729072,6.78706568 L-0.474,6.763 L-0.468718737,6.7394338 L-0.46,6.723 L-0.454801934,6.70583532 L-0.441,6.682 L-0.431735343,6.66154043 L-0.421,6.647 L-0.411410897,6.62959747 L-0.397,6.612 L-0.382406269,6.59175636 L-0.364,6.573 L-0.353555947,6.56034917 L6.56044917,-0.353555947 Z");

    const currentLabel = toolbar.append("span")
        .attr("class", "toolbar-label");

    const nextBtn = toolbar.append("button")
        .attr("class", "toolbar-btn next")
        .attr("id", "btn-next")
        .attr("aria-label", "Button om de data van volgende week te zien");

    nextBtn.append("svg")
        .attr("viewBox", "0 0 14.8279 14.8278")
        .append("path")
        .attr("d", "M7.06034405,0.146449166 C7.25560479,-0.0488143917 7.57218728,-0.0488166812 7.76745083,0.146444053 L14.6814559,7.06034917 L14.692,7.073 L14.7103063,7.09175636 L14.725,7.112 L14.7393109,7.12959747 L14.749,7.147 L14.7596353,7.16154043 L14.769,7.182 L14.7827019,7.20583532 L14.788,7.223 L14.7966187,7.2394338 L14.802,7.263 L14.8116291,7.28706568 L14.815,7.309 L14.8198443,7.32402437 L14.82,7.34 L14.8260923,7.37129149 L14.826,7.402 L14.8279,7.4139 L14.826,7.424 L14.8260917,7.45651572 L14.82,7.487 L14.8198443,7.50377563 L14.815,7.518 L14.8116272,7.54074132 L14.803,7.563 L14.8166187,7.5883662 L14.787,7.607 L14.7826989,7.62197126 L14.771,7.641 L14.7596353,7.66625957 L14.748,7.681 L14.7393068,7.69820848 L14.725,7.715 L14.7103063,7.73604364 L14.692,7.754 L14.6814508,7.76745595 L7.76745083,14.6813559 C7.57218728,14.8766167 7.25560479,14.8766144 7.06034405,14.6813508 C6.86508332,14.4860873 6.86508561,14.1695048 7.06034917,13.9742441 L13.121,7.913 L0.5,7.9139 C0.254540111,7.9139 0.0503916296,7.73702484 0.00805566941,7.50377563 L-5.68434189e-14,7.4139 C-5.68434189e-14,7.13775763 0.223857625,6.9139 0.5,6.9139 L13.12,6.913 L7.06034917,0.853555947 C6.88678156,0.679990851 6.86749446,0.410566589 7.0024891,0.215697472 L7.06034405,0.146449166 Z");

    // Met behulp van Gemini: Werkt de visualisaties bij zodra de gebruiker naar een andere week navigeert en toggelt de disabled states van de knoppen.
    function switchWeek(index) {
        actieveWeekIndex = index;
        const gekozenWeekInfo = gesorteerdeWeken[actieveWeekIndex];
        
        currentLabel.text(gekozenWeekInfo.label);
        
        updateStopwatch(weeksMap.get(gekozenWeekInfo.label));
        updateVisKalender(weeksMap.get(gekozenWeekInfo.label));

        const isFirst = actieveWeekIndex === 0;
        const isLast = actieveWeekIndex === gesorteerdeWeken.length - 1;

        prevBtn.property("disabled", isFirst).attr("aria-disabled", isFirst);
        nextBtn.property("disabled", isLast).attr("aria-disabled", isLast);
    }

    prevBtn.on("click", () => {
        if (actieveWeekIndex > 0) switchWeek(actieveWeekIndex - 1);
    });

    nextBtn.on("click", () => {
        if (actieveWeekIndex < gesorteerdeWeken.length - 1) switchWeek(actieveWeekIndex + 1);
    });

    setupStopwatchBase();
    setupKalenderBase();
    setupNavigation();

    switchWeek(actieveWeekIndex);
}

// Met behulp van Gemini: Bestuurt de CSS-translatie (transformX) om soepel te skippen tussen de stopwatch en de kalender-sectie.
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

    // Met behulp van Gemini: xMidYMid zorgt ervoor dat jouw visualisatie altijd netjes in het exacte middelpunt van de container wordt geplaatst, zowel horizontaal als verticaal.
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
    
    // Bron: https://d3js.org/d3-ease
    secondenWijzer.transition().duration(1200).ease(d3.easeElasticOut.amplitude(1).period(0.4)).attr("transform", `rotate(${huidigeSeconde * 6})`);

    // Bron: https://d3js.org/d3-timer/interval
    window.stopwatchInterval = d3.interval(() => {
        huidigeSeconde++;
        secondenWijzer.transition().duration(100).ease(d3.easeLinear).attr("transform", `rotate(${huidigeSeconde * 6})`);
    }, 1000);
}

// Met behulp van Gemini: Berekent het gemiddelde tijdsverschil in minuten tussen opeenvolgende vissen binnen de geselecteerde week.
function updateStopwatch(weekData) {
    if (!weekData || weekData.length === 0) {
        d3.select("#stopwatch-text").html(`Geen visdata beschikbaar voor deze week.`);
        return;
    }

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

    container.selectAll(".calendar-section").remove();

    const wrapper = container.append("div").attr("class", "calendar-section");
    wrapper.append("div").attr("class", "calendar-title").text("Visactiviteit deze week");
    wrapper.append("p").attr("class", "calendar-explanation").text("Bekijk op welke dagen en dagdelen de vissen het meest actief waren.");

    const layoutContainer = wrapper.append("div").attr("class", "calendar-layout-container");

    const viewWidth = 500; 
    const viewHeight = 250;
    const margin = { top: 15, right: 15, bottom: 15, left: 15 };
    
    const chartWidth = viewWidth - margin.left - margin.right;
    const chartHeight = viewHeight - margin.top - margin.bottom;

    // Met behulp van Gemini: xMidYMid zorgt ervoor dat jouw visualisatie altijd netjes in het exacte middelpunt van de container wordt geplaatst, zowel horizontaal als verticaal.
    const svg = layoutContainer.append("svg")
        .attr("viewBox", `0 0 ${viewWidth} ${viewHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("class", "calendar-svg")
        .attr("role", "grid")
        .attr("aria-label", "Visactiviteit kalender per dag en dagdeel");

    svg.datum({ chartWidth, chartHeight, margin });

    const chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .attr("id", "calendar-chart-group");

    chartGroup.append("g").attr("class", "calendar-axis x-axis");
    chartGroup.append("g").attr("class", "calendar-axis y-axis");
    chartGroup.append("g").attr("id", "calendar-grid-cells");

    layoutContainer.append("div")
        .attr("id", "side-stats-card")
        .attr("class", "side-stats-card");
}

function updateVisKalender(weekData) {
    const svg = d3.select(".calendar-svg");
    const chartGroup = d3.select("#calendar-chart-group");
    const gridCellsGroup = d3.select("#calendar-grid-cells");
    const statsCard = d3.select("#side-stats-card");
    
    if (svg.empty() || chartGroup.empty() || gridCellsGroup.empty()) return;
    
    const { chartWidth, chartHeight } = svg.datum();

    const d6 = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
    const dd = ["Nacht (0-6)", "Ochtend (6-12)", "Middag (12-18)", "Avond (18-24)"];

    const xScale = d3.scaleBand().domain(d6).range([0, chartWidth]).padding(0.12);
    const yScale = d3.scaleBand().domain(dd).range([0, chartHeight]).padding(0.12);

    // Bron: https://d3js.org/d3-axis
    chartGroup.select(".x-axis")
        .attr("transform", `translate(0, -8)`)
        .call(d3.axisTop(xScale).tickSize(0));

    chartGroup.select(".y-axis")
        .attr("transform", `translate(-10, 0)`)
        .call(d3.axisLeft(yScale).tickSize(0));

    const gridMatrix = [];
    d6.forEach(dag => {
        dd.forEach(deel => {
            gridMatrix.push({ dag: dag, dagdeel: deel, count: 0, fishes: [] });
        });
    });

    // Met behulp van Gemini: Neemt de weekdata door en deelt elke vis in op basis van zijn specifieke weekdag Tobacco en uurslot.
    if (weekData && weekData.length > 0) {
        weekData.forEach(fish => {
            const jsDay = fish.date.getDay(); 
            const correctedDayIndex = jsDay === 0 ? 6 : jsDay - 1; 
            const dagNaam = d6[correctedDayIndex];
            const uur = fish.date.getHours();
            let dagdeelNaam = "";

            switch(true){
                case (uur >= 0 && uur < 6):
                    dagdeelNaam = dd[0];
                    break;
                case (uur >= 6 && uur < 12):
                    dagdeelNaam = dd[1];
                    break;
                case (uur >= 12 && uur < 18):
                    dagdeelNaam = dd[2];
                    break;
                default:
                    dagdeelNaam = dd[3];
                    break;
            }

            const cel = gridMatrix.find(c => c.dag === dagNaam && c.dagdeel === dagdeelNaam);
            if (cel) {
                cel.count++;
                cel.fishes.push(fish.fish_name);
            }
        });
    }

    gridMatrix.forEach(cel => {
        if (cel.count > 0) {
            const tellingen = d3.rollups(cel.fishes, v => v.length, f => f);
            tellingen.sort((a, b) => b[1] - a[1]);
            cel.topFish = tellingen[0][0]; 
        } else {
            cel.topFish = null;
        }
    });

    if (!statsCard.empty()) {
        const totaalVissenWekelijks = weekData ? weekData.length : 0;
        let statsHtml = `
            <h3>Totale Statistieken</h3>
            <div class="stats-total-number">${totaalVissenWekelijks}</div>
            <p class="stats-total-label">Vissen gespot deze week</p>
            <div id="stats-line" style="height: 1px; background: #eee; margin: 12px 0;"></div>
        `;

        if (totaalVissenWekelijks > 0) {
            const visSoortenTellingen = d3.rollups(weekData, v => v.length, f => f.fish_name);
            visSoortenTellingen.sort((a, b) => b[1] - a[1]);
            
            statsHtml += `<h4>Verdeling per soort:</h4><div class="stats-list" style="max-height: 120px; overflow-y: auto;">`;
            visSoortenTellingen.forEach(([naam, aantal]) => {
                statsHtml += `<p style="margin: 4px 0;">🐟 <strong>${aantal}x</strong> ${naam}</p>`;
            });
            statsHtml += `</div>`;
        } else {
            statsHtml += `<p>Geen visgegevens aanwezig voor deze week.</p>`;
        }
        statsCard.html(statsHtml);
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
    .attr("tabindex", "0")
    .attr("role", "gridcell")
    .attr("aria-label", d => {
        const dagdeelSchoon = d.dagdeel.split(" ")[0];
        if (d.count === 0) {
            return `${d.dag}, ${dagdeelSchoon}. Geen vissen gespot.`;
        }
        return `${d.dag}, ${dagdeelSchoon}. Totaal ${d.count} vissen gespot. Meest gezien: ${d.topFish}.`;
    })
    .attr("class", d => {
        const t = maxCount > 1 ? (d.count - 1) / (maxCount - 1) : 0.5;
        switch(true){
            case (d.count === 0): return "calendar-cell cell-0";
            case (t < 0.33): return "calendar-cell cell-low";
            case (t < 0.66): return "calendar-cell cell-mid";
            default: return "calendar-cell cell-high";
        }
    });

    // Met behulp van Gemini: Genereert dynamische html-content voor de tooltip en berekent de vis-tellingen.
    function toonTooltip(element, d) {
        if (d.count === 0) return;

        d3.select(element)
            .style("stroke", "var(--color-purple)")
            .style("stroke-width", "2px");

        const tellingen = d3.rollups(d.fishes, v => v.length, f => f);
        tellingen.sort((a, b) => b[1] - a[1]);
        
        let tooltipContent = `<h3>${d.dag} - ${d.dagdeel.split(" ")[0]}</h3><div id='line'></div>`;
        tooltipContent += `<p>Totaal gespot: <strong>${d.count} vissen</strong></p>`;
        
        tellingen.forEach(([name, aantal]) => {
            tooltipContent += `<p>🐟 ${aantal}x <strong>${name}</strong></p>`;
        });

        d3.select("#tooltip")
            .style("display", "block")
            .html(tooltipContent);
    }

    function verbergTooltip(element) {
        d3.select(element).style("stroke", "none");
        d3.select("#tooltip").style("none");
        d3.select("#tooltip").style("display", "none");
    }

    // Met behulp van Gemini: Projecteert optioneel een .png icoontje in het midden van de gridcel als er een topFish bekend is.
    gridCellsGroup.selectAll("image.cell-fish-img")
        .data(gridMatrix) 
        .join(
            enter => enter.append("image").attr("class", "cell-fish-img"),
            update => update,
            exit => exit.remove()
        )
        .attr("href", d => {
            if (d.count === 0 || !d.topFish) return "";
            const veiligeNaam = d.topFish.toLowerCase().trim().replace(/\s+/g, '-');
            return `./img/${veiligeNaam}.png`; 
        })
        .attr("x", d => {
            const imgWidth = xScale.bandwidth() * 0.7;
            return xScale(d.dag) + (xScale.bandwidth() - imgWidth) / 2;
        })
        .attr("y", d => {
            const imgHeight = yScale.bandwidth() * 0.7;
            return yScale(d.dagdeel) + (yScale.bandwidth() - imgHeight) / 2;
        })
        .attr("width", xScale.bandwidth() * 0.7)
        .attr("height", yScale.bandwidth() * 0.7)
        .style("pointer-events", "none");

    // Bron: https://d3js.org/d3-selection/events: Registreert alle muis- en toetsenbord-events voor de interactieve tooltips.
    gridCellsGroup.selectAll("rect")
    .on("mouseenter", function (event, d) {
        if (d.count === 0) return;

        d3.select(this)
            .style("stroke", "var(--color-purple)")
            .style("stroke-width", "2px");

        const tellingen = d3.rollups(d.fishes, v => v.length, f => f);
        tellingen.sort((a, b) => b[1] - a[1]);
        
        let tooltipContent = `<h3>${d.dag} - ${d.dagdeel.split(" ")[0]}</h3><div id='line'></div>`;
        tooltipContent += `<p>Totaal gespot: <strong>${d.count} vissen</strong></p>`;
        
        tellingen.forEach(([name, aantal]) => {
            tooltipContent += `<p>🐟 ${aantal}x <strong>${name}</strong></p>`;
        });

        d3.select("#tooltip")
            .style("display", "block")
            .html(tooltipContent);
        
        toonTooltip(this, d);
    })
        // Met behulp van Gemini: Voorkomt dat de tooltip buiten de randen van de browser-viewport valt bij mousemove.
        .on("mousemove", function (event) {
            const tooltip = d3.select("#tooltip");
            const tooltipNode = tooltip.node();
            if (!tooltipNode) return;

            const tooltipWidth = tooltipNode.offsetWidth;
            const tooltipHeight = tooltipNode.offsetHeight;

            const mouseX = event.pageX;
            const mouseY = event.pageY;

            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const offsetX = 15;
            const offsetY = 15;

            let targetX = mouseX + offsetX;
            let targetY = mouseY + offsetY;

            if ((targetX + tooltipWidth) > (scrollX + viewportWidth)) {
                targetX = mouseX - tooltipWidth - offsetX;
            }

            if ((targetY + tooltipHeight) > (scrollY + viewportHeight)) {
                targetY = mouseY - tooltipHeight - offsetY;
            }

            targetX = Math.max(scrollX + 10, targetX);
            targetY = Math.max(scrollY + 10, targetY);
            
            tooltip
                .style("left", targetX + "px")
                .style("top", targetY + "px");
        })
        .on("mouseleave", function () {
            d3.select(this).style("stroke", "none");
            d3.select("#tooltip").style("none");
            d3.select("#tooltip").style("display", "none");
            verbergTooltip(this);
        })
        .on("focus", function (event, d) {
            toonTooltip(this, d);
            
            const rect = this.getBoundingClientRect();
            d3.select("#tooltip")
                .style("left", (rect.left + window.scrollX + rect.width + 10) + "px")
                .style("top", (rect.top + window.scrollY) + "px");
        })
        .on("blur", function () {
            verbergTooltip(this);
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