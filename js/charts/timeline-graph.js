import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
// Met behulp van https://d3js.org/getting-started

export function drawD3Graph(graphData, eventKeys) {
    d3.select("#chart").selectAll("*").remove();

    const containerWidth = d3.select("#chart").node()?.getBoundingClientRect().width || 1250;
    const isMobile = containerWidth < 600;

    const baseWidth = 1250;
    const baseHeight = 600;

    const margin = { top: 60, right: 20, bottom: 80, left: 80 };
    const width = baseWidth - margin.left - margin.right;
    const height = baseHeight - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const visibleHours = graphData.filter(d => d.hour.includes(':'));

    const x = d3.scaleBand()
        .domain(visibleHours.map(d => d.hour))
        .range([0, width])
        .padding(0);

    const dataMax = d3.max(visibleHours, d => d.total) || 1000;
    const yMaxCalculated = Math.ceil((dataMax * 1.35) / 1000) * 1000;

    const y = d3.scaleLinear()
        .domain([0, yMaxCalculated])
        .range([height, 0]);

    const defs = svg.append("defs");

    defs.append("clipPath")
        .attr("id", "chart-clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    const bgGradient = defs.append("linearGradient")
        .attr("id", "bg-gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");

    bgGradient.append("stop").attr("offset", "0%").attr("stop-color", "var(--color-blue-green)");
    bgGradient.append("stop").attr("offset", "100%").attr("stop-color", "var(--color-dark-green)");

    svg.append("rect")
        .attr("width", width)
        .attr("height", height + 20)
        .attr("fill", "url(#bg-gradient)")
        .attr("x", 0)
        .attr("rx", 20);

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${isMobile ? 0 : width - 580}, -35)`);

    const legendItems = [
        { label: "Totaal Activiteit", color: "var(--color-light-gold)", type: "line" },
        { label: "Geüploade Vis", color: "var(--color-light-gold)", type: "rect" },
        { label: "Geweigerde Uploads", color: "var(--color-purple)", type: "seaweed" }
    ];

    legendItems.forEach((item, index) => {
        const itemGroup = legend.append("g")
            .attr("transform", `translate(${index * (isMobile ? 130 : 190)}, 0)`);

        if (item.type === "line") {
            itemGroup.append("line")
                .attr("x1", 0).attr("y1", -5).attr("x2", 25).attr("y2", -5)
                .attr("stroke", item.color).attr("stroke-width", 3);
            itemGroup.append("circle")
                .attr("cx", 12.5)
                .attr("cy", -5)
                .attr("r", 4)
                .attr("fill", "var(--color-white)")
                .attr("stroke", item.color)
                .attr("stroke-width", 1.5);
        } else if (item.type === "rect") {
            itemGroup.append("rect")
                .attr("x", 0)
                .attr("y", -12)
                .attr("width", 20)
                .attr("height", 14)
                .attr("fill", item.color).attr("rx", 3);
        } else if (item.type === "seaweed") {
            itemGroup.append("path")
                .attr("d", "M4,-2 Q8,-14 4,-22 M12,2 Q16,-10 12,-18")
                .attr("fill", "none")
                .attr("stroke", item.color)
                .attr("stroke-width", 3)
                .attr("stroke-linecap", "round");
        }

        itemGroup.append("text")
            .attr("x", item.type === "seaweed" ? 25 : 28)
            .attr("y", 0)
            .attr("fill", "var(--color-white)")
            .style("font-size", isMobile ? "10px" : "13px")
            .style("font-family", "sans-serif")
            .text(item.label);
    });

    const seaweedClip = defs.append("clipPath").attr("id", "seaweed-clip");

    const clipPoints = [
        { hour: visibleHours[0].hour, uploadedFish: visibleHours[0].uploadedFish, total: visibleHours[0].total, edgeX: 0 },
        ...visibleHours.map(d => ({ ...d, edgeX: x(d.hour) + x.bandwidth() / 2 })),
        { hour: visibleHours[visibleHours.length - 1].hour, uploadedFish: visibleHours[visibleHours.length - 1].uploadedFish, total: visibleHours[visibleHours.length - 1].total, edgeX: width }
    ];

    seaweedClip.append("path")
        .datum(clipPoints)
        .attr("d", d3.area()
            .x(d => d.edgeX)
            .y0(0)
            .y1(d => y(d.uploadedFish || 0))
            .curve(d3.curveBasis)
        );

    const seaweedContainer = svg.append("g").attr("clip-path", "url(#seaweed-clip)");

    visibleHours.forEach((d, hourIdx) => {
        const colX = x(d.hour) + x.bandwidth() / 2;
        const fishValue = d.uploadedFish || 0;
        const groundY = y(fishValue);
        const topY = y(d.total);
        const seaweedHeight = Math.max(groundY - topY, 0);

        const dismissedValue = d.dismissedUploading || 0;
        const seaweedCount = dismissedValue > 0 ? Math.min(Math.max(Math.floor(dismissedValue / 500), 2), 6) : 0;

        for (let j = 0; j < seaweedCount; j++) {
            const offsetWidth = (j - (seaweedCount / 2)) * (x.bandwidth() / (seaweedCount + 1));
            const bladeX = colX + offsetWidth;
            const dynamicTopY = groundY - (seaweedHeight * (0.8 + (j % 3) * 0.1));

            const seaweedPoints = [
                [bladeX, groundY + 100],
                [bladeX - (10 - j * 2), groundY - (seaweedHeight * 0.35)],
                [bladeX + (10 - j * 2), groundY - (seaweedHeight * 0.65)],
                [bladeX + (Math.sin(hourIdx + j) * 4), dynamicTopY]
            ];

            const lineGenerator = d3.line().curve(d3.curveBasis);

            const colorVariants = [
                "var(--color-purple)",
                "var(--color-pink)"
            ];
            const bladeColor = colorVariants[j % colorVariants.length];

            seaweedContainer.append("path")
                .attr("d", lineGenerator(seaweedPoints))
                .attr("fill", "none")
                .attr("stroke", bladeColor)
                .attr("opacity", 0.6)
                .attr("stroke-width", isMobile ? 4 : 8)
                .attr("stroke-linecap", "round")
                .attr("z-index", 0);
        }
    });

    const radius = 18;

    // Border radius added for a path with help from Gemini
    // Antwoord: https://gemini.google.com/app/fad94f25a6a64dde
    defs.append("clipPath")
        .attr("id", "round-bottom-clip")
        .append("path")
        .attr("d", `
            M 0,0 
            L ${width},0 
            L ${width},${height + 25 - radius} 
            A ${radius},${radius} 0 0 1 ${width - radius},${height + 25} 
            L ${radius},${height + 25} 
            A ${radius},${radius} 0 0 1 0,${height + 25 - radius} 
            Z
        `);

    const bottomAreaGenerator = d3.area()
        .x(d => d.edgeX)
        .y0(height + 20)
        .y1(d => y(d.uploadedFish || 0))
        .curve(d3.curveBasis);

    svg.append("path")
        .datum(clipPoints)
        .attr("fill", "var(--color-light-gold)")
        .attr("d", bottomAreaGenerator)
        .attr("clip-path", "url(#round-bottom-clip)");

    const dataLineGenerator = d3.line()
        .x(d => d.edgeX)
        .y(d => y(d.total || 0))
        .curve(d3.curveCatmullRom.alpha(0.5));

    svg.append("path")
        .datum(clipPoints)
        .attr("fill", "none")
        .attr("stroke", "var(--color-light-gold)")
        .attr("opacity", 0.2)
        .attr("stroke-width", 3)
        .attr("d", dataLineGenerator);


    initFishAnimation(svg, width, height, isMobile);
    initBubbleAnimation(svg, width, height, isMobile)

    visibleHours.forEach((d, i) => {
        defs.append("clipPath")
            .attr("id", `clip-${i}`)
            .append("rect")
            .attr("class", `clip-rect-${i}`)
            .attr("x", x(d.hour))
            .attr("y", 0)
            .attr("width", x.bandwidth())
            .attr("height", height)
            .attr("rx", x.bandwidth() / 2)
            .attr("ry", x.bandwidth() / 2)
            .attr("tabindex", "0");
    });

    const bubbleGroup = svg.append("g").attr("class", "bubbles-layer");

    visibleHours.forEach((d, i) => {
        bubbleGroup.append("circle")
            .attr("class", `circle-${i}`)
            .attr("cx", x(d.hour) + x.bandwidth() / 2)
            .attr("cy", y(d.total) - 20)
            .attr("r", 8)
            .attr("fill", "rgba(255, 255, 255, 0.75)")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .style("opacity", 0)
            .style("pointer-events", "none");
    });

    svg.append("g")
        .attr("transform", `translate(0, ${height + 50})`)
        .selectAll("text")
        .data(visibleHours)
        .join("text")
        .attr("x", d => x(d.hour) + x.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("class", "axis-text")
        .text((d, i) => {
            if (isMobile && i % 2 !== 0) return "";
            return d.hour;
        });

    const tickStep = yMaxCalculated / 8;
    const ticks = Array.from({ length: 9 }, (_, i) => i * tickStep);

    const yAxis = d3.axisLeft(y)
        .tickValues(ticks)
        .tickFormat(d3.format("d"))
        .tickSize(0);

    const yAxisGroup = svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    yAxisGroup.selectAll("text")
        .attr("dx", "-10");

    yAxisGroup.select(".domain").remove();

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -height + 40)
        .attr("class", "axis-text")
        .attr("text-anchor", "middle")
        .text("Deurbellers -->");

    svg.append("g")
        .selectAll(".interaction-rect")
        .data(visibleHours)
        .join("rect")
        .attr("x", d => x(d.hour))
        .attr("y", 0)
        .attr("width", x.bandwidth())
        .attr("height", height + 60)
        .attr("class", "visible-hours")
        .attr("tabindex", "0")
        .style("outline", "none")
        .on("mouseenter", function (event, d) {
            const i = visibleHours.indexOf(d);
            const standardWidth = x.bandwidth();
            const newWidth = standardWidth * 1.25;
            const shiftX = (newWidth - standardWidth) / 2;

            d3.selectAll(`.clip-rect-${i}`)
                .attr("x", x(d.hour) - shiftX)
                .attr("width", newWidth);

            d3.select(`.circle-${i}`)
                .style("opacity", d.total > 0 ? 1 : 0);

            let tooltipContent = `
                <h3>${d.hour}</h3>
                <p>Total: ${d.total} events</p>
                <div id="line"></div>
            `;

            eventKeys.forEach(key => {
                if (d[key] > 0) {
                    tooltipContent += `<small>${key}: <strong>${d[key]}</strong></small>`;
                }
            });

            d3.select("#tooltip")
                .style("display", "block")
                .html(tooltipContent);
        })
        .on("mousemove", function (event) {
            const tooltip = d3.select("#tooltip");
            const tooltipNode = tooltip.node();
            const tooltipWidth = tooltipNode ? tooltipNode.getBoundingClientRect().width : 180;
            const windowWidth = window.innerWidth;

            let leftPosition = event.pageX + 15;
            if (event.clientX + tooltipWidth + 20 > windowWidth) {
                leftPosition = event.pageX - tooltipWidth - 15;
            }

            tooltip
                .style("left", leftPosition + "px")
                .style("top", (event.pageY - 40) + "px");
        })
        .on("mouseleave", function (event, d) {
            handleDeactivate(event, d, visibleHours, x);
        })
        .on("focus", function (event, d) {
            handleActivate(event, d, visibleHours, x, y, eventKeys);
        })
        .on("blur", function (event, d) {
            d3.select(this)
                .attr("stroke", "none")
                .attr("fill", "rgba(255, 255, 255, 0)");

            handleDeactivate(event, d, visibleHours, x);
        });
}

function handleActivate(event, d, visibleHours, x, y, eventKeys) {
    const i = visibleHours.indexOf(d);
    const standardWidth = x.bandwidth();
    const newWidth = standardWidth * 1.25;
    const shiftX = (newWidth - standardWidth) / 2;

    d3.selectAll(`.clip-rect-${i}`)
        .attr("x", x(d.hour) - shiftX)
        .attr("width", newWidth);

    d3.select(`.circle-${i}`)
        .style("opacity", d.total > 0 ? 1 : 0);

    let tooltipContent = `
        <h3>${d.hour}</h3>
        <p>Total: ${d.total} events</p>
        <div id="line"></div>
    `;

    eventKeys.forEach(key => {
        if (d[key] > 0) {
            tooltipContent += `<small>${key}: <strong>${d[key]}</strong></small>`;
        }
    });

    d3.select("#tooltip")
        .style("display", "block")
        .html(tooltipContent);

    if (event.type === "focus") {
        const rectBounding = event.target.getBoundingClientRect();
        d3.select("#tooltip")
            .style("left", (rectBounding.left + window.scrollX + rectBounding.width / 2 - 90) + "px")
            .style("top", (rectBounding.top + window.scrollY - 80) + "px");
    }
}

function handleDeactivate(event, d, visibleHours, x) {
    const i = visibleHours.indexOf(d);

    d3.selectAll(`.clip-rect-${i}`)
        .attr("x", x(d.hour))
        .attr("width", x.bandwidth());

    d3.select(`.circle-${i}`)
        .style("opacity", 0);

    d3.select("#tooltip").style("display", "none");
}

function createFishPath() {
    return "M0,6 C5,3 13,0 25,0 C32,0 40,5 45,8 L55,2 L52,10 L55,18 L45,12 C40,15 32,20 25,20 C13,20 5,17 0,14 C-3,12 -3,8 0,6 Z";
}

function initBubbleAnimation(svg, width, height, isMobile) {
    const floatingGroup = svg.append("g")
        .attr("class", "bubble-layer")
        .attr("clip-path", "url(#chart-clip)")
    
    const numberOfBubbles = isMobile ? 15 : 20;

    for(let i = 0; i < numberOfBubbles; i++) {
        const bubble = floatingGroup.append("circle")
            .attr("class", "individual-bubble")
            .attr("fill", "rgba(255, 255, 255, 0.5)")
            .attr("stroke", "rgba(255, 255, 255, 0.3)")
            .attr("stroke-width", 1)

        animateSingleBubble(bubble, width, height);
    }

    function animateSingleBubble(bubbleInstance, width, height) {
        const radius= 2 + Math.random() * 6;
        const startX = Math.random() * width;
        const startY = height + 20;
        const endY = -20;
        const duration = 4000 + Math.random() * 5000;
        const drift = (Math.random() * 40 -20);
        const scale = 0.5 + Math.random() * 0.5;

        bubbleInstance
            .attr("cx", startX)
            .attr("cy", startY)
            .attr("r", radius)
            .attr("opacity", 0.6)
            .transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .attr("cx", startX + drift)
            .attr("cy", endY)
            .attr("r", radius * scale)
            .attr("opacity", 0)
            .on("end", () => {
                animateSingleBubble(bubbleInstance, width, height);
            });
    }

}

function initFishAnimation(svg, width, height, isMobile) {
    const fishGroup = svg.append("g")
        .attr("class", "fish-layer")
        .attr("clip-path", "url(#chart-clip)");

    const numberOfFish = isMobile ? 3 : 5;
    
    for (let i = 0; i < numberOfFish; i++) {
        const fish = fishGroup.append("path")
            .attr("d", createFishPath())
            .attr("fill", "var(--color-dark-green)")
            .attr("stroke-width", 1.5)
            .attr("class", "individual-fish")
            .attr("opacity", 0.75);

        animateSingleFish(fish);
    }

    function animateSingleFish(fishInstance) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        const startX = direction === 1 ? -45 : width + 5;
        const endX = direction === 1 ? width + 5 : -45;

        const randomY = 50 + Math.random() * (height * 0.7);
        const duration = 9000 + Math.random() * 3000;
        const scale = 0.4 + Math.random() * 0.5;

        const flipTransform = direction === -1 ? `scale(1, 1)` : `scale(-1, 1)`;

        fishInstance
            .attr("transform", `translate(${startX}, ${randomY}) ${flipTransform} scale(${scale})`)
            .transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .attr("transform", `translate(${endX}, ${randomY + (Math.random() * 60 - 30)}) ${flipTransform} scale(${scale})`)
            .attr("z-index", direction === 1 ? 1 : -1)
            .on("end", () => {
                animateSingleFish(fishInstance);
            });
    }
}

export function createGraph(data) {
    const uniqueEvents = [...new Set(data.map(item => item.event_name))].filter(Boolean);

    const groupedHours = Array.from({ length: 24 }, (_, i) => {
        const hourString = `${String(i).padStart(2, '0')}:00`;
        const startObject = { hour: hourString, total: 0 };
        uniqueEvents.forEach(event => { startObject[event] = 0; });
        return startObject;
    });

    let latestDate = null;

    data.forEach(item => {
        if (!item.created_at || isNaN(item.created_at.getTime()) || !item.event_name) return;
        if (!latestDate || item.created_at > latestDate) { latestDate = item.created_at; }
        const hourNumber = item.created_at.getHours();
        if (hourNumber >= 0 && hourNumber < 24) {
            if (groupedHours[hourNumber].hasOwnProperty(item.event_name)) {
                groupedHours[hourNumber][item.event_name] += 1;
            }
            groupedHours[hourNumber].total += 1;
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

    drawD3Graph(graphDataWithBuffers, uniqueEvents);
}