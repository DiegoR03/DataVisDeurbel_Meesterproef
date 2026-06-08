import * as d3 from "d3";

function drawDynamicStopwatch(data) {
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

    let gemiddeldeMinuten = 0;
    let latestFishName = "Geen";

    if (fishEvents.length > 0) {
        latestFishName = fishEvents[fishEvents.length - 1].fish_name;
    }

    if (fishEvents.length > 1) {
        let totaleTijdVerschilMs = 0;
        for (let i = 1; i < fishEvents.length; i++) {
            totaleTijdVerschilMs += (fishEvents[i].date - fishEvents[i - 1].date);
        }
        const gemiddeldeMs = totaleTijdVerschilMs / (fishEvents.length - 1);
        gemiddeldeMinuten = Math.round(gemiddeldeMs / 1000 / 60);
    }

    const endWindow = fishEvents[fishEvents.length - 1].date;
    const startWindow = new Date(endWindow.getTime() - (60 * 60 * 1000));
    const fishInLastHour = fishEvents.filter(d => d.date >= startWindow && d.date <= endWindow);

    const groupedFish = [];
    fishInLastHour.forEach(fish => {
        const minuteKey = d3.timeMinute(fish.date).getTime();
        const existingGroup = groupedFish.find(g => g.key === minuteKey);

        if (existingGroup) {
            existingGroup.names.push(fish.fish_name);
        } else {
            groupedFish.push({
                key: minuteKey,
                date: fish.date,
                names: [fish.fish_name]
            });
        }
    });

    const container = d3.select("#stopwatch-container");
    if (container.empty()) return;

    if (window.stopwatchInterval) window.stopwatchInterval.stop();
    container.selectAll("*").remove();

    container.style("transform", "translateX(0%)");

    const wrapper = container.append("div")
        .attr("class", "stopwatch-wrapper");

    const internalSize = 120;
    const radius = internalSize / 2;

    const svg = wrapper.append("svg")
        .attr("viewBox", `0 0 ${internalSize} ${internalSize}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("class", "stopwatch-svg");

    const clockGroup = svg.append("g").attr("transform", `translate(${radius}, ${radius})`);

    clockGroup.append("circle").attr("r", radius - 6).attr("fill", "none").attr("stroke", "var(--color-dark-green)").attr("stroke-width", 4);
    clockGroup.append("rect").attr("x", -6).attr("y", -radius).attr("width", 12).attr("height", 6).attr("fill", "var(--color-dark-green)").attr("rx", 2);

    const gradenMinuten = (gemiddeldeMinuten / 60) * 360;

    const wijzer = clockGroup.append("line")
        .attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", -(radius - 16))
        .attr("stroke", "var(--color-purple)")
        .attr("stroke-width", 4)
        .attr("stroke-linecap", "round");

    const secondenWijzer = clockGroup.append("line")
        .attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", -(radius - 12))
        .attr("stroke", "var(--color-purple)").attr("opacity", 0.6).attr("stroke-width", 2).attr("stroke-linecap", "round")
        .attr("class", "stopwatch-second-hand");

    wijzer.transition().duration(1200).ease(d3.easeElasticOut.amplitude(1).period(0.4)).attr("transform", `rotate(${gradenMinuten})`);

    let huidigeSeconde = new Date().getSeconds();
    secondenWijzer.transition().duration(1200).ease(d3.easeElasticOut.amplitude(1).period(0.4)).attr("transform", `rotate(${huidigeSeconde * 6})`);

    window.stopwatchInterval = d3.interval(() => {
        huidigeSeconde++;
        secondenWijzer.transition().duration(100).ease(d3.easeLinear).attr("transform", `rotate(${huidigeSeconde * 6})`);
    }, 1000);

    clockGroup.append("circle").attr("r", 5).attr("fill", "var(--color-dark-green)");

    const textDiv = wrapper.append("div").attr("id", "stopwatch-text");
    const minutenTekst = gemiddeldeMinuten === 1 ? "minuut" : "minuten";

    textDiv.html(`
        Gemiddeld duurt het <span class="stopwatch-text-highlight">${gemiddeldeMinuten} ${minutenTekst}</span> voordat je 
        een 🐟 vis ziet. De <span class="stopwatch-text-highlight">${latestFishName}</span> was als laatst gespot.
    `);

    const timelineWrapper = container.append("div")
        .attr("class", "timeline-wrapper");

    const tijdFormaat = d3.timeFormat("%H:%M");

    timelineWrapper.append("div")
        .attr("class", "timeline-title")
        .text(`Visactiviteit afgelopen uur (${tijdFormaat(startWindow)} - ${tijdFormaat(endWindow)})`);

    timelineWrapper.append("p")
        .attr("class", "timeline-explanation")
        .text(`Sleep met de muis over de stippen om te zien welke vissen er wanneer zijn gezien!`);

    const margin = { top: 20, right: 35, bottom: 20, left: 35 };
    const tlWidth = 450 - margin.left - margin.right;
    const tlHeight = 70 - margin.top - margin.bottom;

    const tlSvg = timelineWrapper.append("svg")
        .attr("viewBox", `0 0 ${tlWidth + margin.left + margin.right} ${tlHeight + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("class", "timeline-svg");

    const g = tlSvg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleTime().domain([startWindow, endWindow]).range([0, tlWidth]);
    const xAxis = d3.axisBottom(xScale).ticks(4).tickFormat(tijdFormaat);

    g.append("g")
        .attr("transform", `translate(0, ${tlHeight / 2})`)
        .attr("class", "timeline-axis")
        .call(xAxis);

    if (groupedFish.length === 0) {
        g.append("text")
            .attr("x", tlWidth / 2).attr("y", tlHeight / 2 - 5).attr("text-anchor", "middle")
            .text("Geen vissen gezien in dit uur.");
    } else {
        const dotsGroup = g.append("g").attr("class", "dots-layer");
        const interactionGroup = g.append("g").attr("class", "interaction-layer");

        dotsGroup.selectAll(".fish-dot")
            .data(groupedFish)
            .enter()
            .append("circle")
            .attr("class", (d, i) => `fish-dot dot-index-${i}`)
            .attr("cx", d => xScale(d.date))
            .attr("cy", tlHeight / 2)
            .attr("r", 6);

        dotsGroup.selectAll(".fish-label")
            .data(groupedFish)
            .enter()
            .append("text")
            .attr("class", "fish-timeline-label")
            .attr("x", d => xScale(d.date))
            .attr("y", (tlHeight / 2) - 12)
            .attr("text-anchor", "start")
            .attr("transform", d => `rotate(-45, ${xScale(d.date)}, ${(tlHeight / 2) - 12})`)
            .text(d => d.names.length === 1 ? "1 vis" : `${d.names.length} vissen`);

        interactionGroup.selectAll(".interaction-rect")
            .data(groupedFish)
            .join("circle")
            .attr("cx", d => xScale(d.date))
            .attr("cy", tlHeight / 2)
            .attr("r", 6)
            .attr("fill", "rgba(255,255,255,0)")
            .style("cursor", "pointer")
            .on("mouseenter", function (event, d) {
                const i = groupedFish.indexOf(d);
                d3.select(`.dot-index-${i}`)
                    .attr("r", 8)
                    .style("fill", "var(--color-dark-green)");

                let tooltipContent = `<h3>${tijdFormaat(d.date)}</h3><div id='line'></div>`;
                d.names.forEach(name => {
                    tooltipContent += `<p>🐟 <strong>${name}</strong><br></p>`;
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
            .on("mouseleave", function (event, d) {
                const i = groupedFish.indexOf(d);
                d3.select(`.dot-index-${i}`)
                    .attr("r", 6)
                    .style("fill", "");
                d3.select("#tooltip").style("display", "none");
            });
    }

    const buttons = d3.selectAll("#button-container button");
    const backButton = d3.select(buttons.nodes()[0]);
    const nextButton = d3.select(buttons.nodes()[1]);

    backButton.style("opacity", 0.5)
        .style("pointer-events", "none");

    nextButton.style("opacity", 1)
        .style("pointer-events", "auto");

    nextButton.on("click", () => {
        container.style("transform", "translateX(-50%)");

        nextButton.style("opacity", 0.5)
            .style("pointer-events", "none");
        backButton.style("opacity", 1)
            .style("pointer-events", "auto");
    });

    backButton.on("click", () => {
        container.style("transform", "translateX(0%)");
        backButton.style("opacity", 0.5)
            .style("pointer-events", "none");
        nextButton.style("opacity", 1)
            .style("pointer-events", "auto");
    });
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
            drawDynamicStopwatch(data);
        }
    });
}