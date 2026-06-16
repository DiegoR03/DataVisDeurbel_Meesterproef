import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const baseWidth = 1000;
const baseHeight = 550;

const margin = { top: 5, right: 0, bottom: 80, left: 60 };
const width = baseWidth - margin.left - margin.right;
const height = baseHeight - margin.top - margin.bottom;

const radius = 18;

let currentSelectedKey = "total";

function getHourTheme(hourString) {
    const hourInt = parseInt(hourString.split(':')[0], 10);

    if (hourInt >= 6 && hourInt < 9) {
        return "sunrise";
    } else if (hourInt >= 9 && hourInt < 17) {
        return "day";
    } else if (hourInt >= 17 && hourInt < 21) {
        return "sunset";
    } else {
        return "night";
    }
}

function getSunYPosition(hourString, chartHeight) {
    const hourInt = parseInt(hourString.split(':')[0], 10);
    const radians = (hourInt - 6) * (Math.PI / 12);
    const normalizedY = (Math.sin(radians) + 1) / 2;

    const minHeight = 60;
    const maxHeight = chartHeight - 60;
    return maxHeight - normalizedY * (maxHeight - minHeight);
}

function drawD3Graph(graphData, eventKeys) {
    let svgSelection = d3.select("#chart").select("svg");
    let isFirstLoad = svgSelection.empty();
    let svg;

    if (isFirstLoad) {
        svgSelection = d3.select("#chart")
            .append("svg")
            .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
            .style("width", "100%")
            .style("height", "auto")
            .attr("data-theme", "day");

        svg = svgSelection.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        svg.append("g").attr("class", "layer-background");
        svg.append("g").attr("class", "layer-data-paths");
        svg.append("g").attr("class", "layer-clipped-foreground");
        svg.append("g").attr("class", "layer-sun-moon-path");
        svg.append("g").attr("class", "layer-interface");
        svg.append("g").attr("class", "y-axis");
    } else {
        svg = svgSelection.select("g");
    }

    const backgroundLayer = svg.select(".layer-background");
    const dataPathLayer = svg.select(".layer-data-paths");
    const clippedForegroundLayer = svg.select(".layer-clipped-foreground");
    const sunMoonPathLayer = svg.select(".layer-sun-moon-path");
    const interfaceLayer = svg.select(".layer-interface");
    const yAxisGroup = svg.select(".y-axis");

    const visibleHours = graphData.filter(data => data.hour.includes(':'));

    const x = d3.scaleBand()
        .domain(visibleHours.map(data => data.hour))
        .range([0, width])
        .padding(0);

    const dataMax = d3.max(visibleHours, data => Number(data[currentSelectedKey]) || 0) || 0;

    const stepSize = dataMax > 500 ? 500 : 50;
    const rawMaxWithBuffer = dataMax * 1.15;
    const yMaxCalculated = Math.max(stepSize, Math.ceil(rawMaxWithBuffer / stepSize) * stepSize);

    const y = d3.scaleLinear()
        .domain([0, yMaxCalculated + stepSize])
        .range([height, 0]);

    const yTicks = [];
    for (let i = 0; i <= yMaxCalculated; i += stepSize) {
        yTicks.push(i);
    }

    if (isFirstLoad) {
        const defs = svg.append("defs");

        const sunSetGradient = defs.append("linearGradient")
            .attr("id", "sun-set-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        sunSetGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "var(--color-gold)");

        sunSetGradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", "var(--color-blue-green)");

        sunSetGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "var(--color-blue-green)");

        const sunGradient = defs.append("linearGradient")
            .attr("id", "sun-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        sunGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "var(--color-light-gold)");

        sunGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "var(--color-blue-green)");
        
        const nightGradient = defs.append("linearGradient")
            .attr("id", "night-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        nightGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "var(--color-dark-green)");

        nightGradient.append("stop")
            .attr("offset", "60%")
            .attr("stop-color", "var(--color-blue-green)");

        nightGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "var(--color-dark-green)");


        const filter = defs.append("filter").attr("id", "pink-tint-filter");
        filter.append("feColorMatrix")
            .attr("type", "matrix")
            .attr("values", `
                0.2126 0.7152 0.0722 0 0
                0.2126 0.7152 0.0722 0 0
                0.2126 0.7152 0.0722 0 0
                0       0      0      1 0
            `)
            .attr("result", "gray");

        const transfer = filter.append("feComponentTransfer").attr("in", "gray");
        transfer.append("feFuncR").attr("type", "table").attr("tableValues", "0.98 1.0");
        transfer.append("feFuncG").attr("type", "table").attr("tableValues", "0.40 1.0");
        transfer.append("feFuncB").attr("type", "table").attr("tableValues", "0.65 1.0");
        transfer.append("feFuncA").attr("type", "identity");

        const filterBlueGreen = defs.append("filter").attr("id", "blue-green-filter");
        filterBlueGreen.append("feColorMatrix")
            .attr("type", "matrix")
            .attr("values", "0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0")
            .attr("result", "gray");

        const transferBlueGreen = filterBlueGreen.append("feComponentTransfer").attr("in", "gray");
        transferBlueGreen.append("feFuncR").attr("type", "table").attr("tableValues", "0.00 1.0");
        transferBlueGreen.append("feFuncG").attr("type", "table").attr("tableValues", "0.55 1.0");
        transferBlueGreen.append("feFuncB").attr("type", "table").attr("tableValues", "0.55 1.0");
        transferBlueGreen.append("feFuncA").attr("type", "identity");

        defs.append("clipPath")
            .attr("id", "rect-clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height + 20)
            .attr("x", 0)
            .attr("y", 0)
            .attr("rx", 20);

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
            

        backgroundLayer.attr("clip-path", "url(#rect-clip)");
        clippedForegroundLayer.attr("clip-path", "url(#rect-clip)");

        const backgroundBlurFilter = defs.append("filter").attr("id", "background-blur");
        backgroundBlurFilter.append("feGaussianBlur")
            .attr("stdDeviation", "8");

        backgroundLayer.append("image")
            .attr("href", "./img/Stone_Wall_Background-2.jpg")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height + 20)
            .attr("preserveAspectRatio", "xMidYMid slice")
            .style("pointer-events", "none")
            .style("filter", "url(#background-blur)")
            .attr("opacity", 0.3);

        backgroundLayer.append("rect")
            .attr("class", "main-graph-bg")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height + 20)
            .style("pointer-events", "none");

        backgroundLayer.append("rect")
            .attr("class", "main-graph-sunrise-bg")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height + 20)
            .style("pointer-events", "none");

        backgroundLayer.append("rect")
            .attr("class", "main-graph-night-bg")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height + 20)
            .style("pointer-events", "none");

        initBubbleAnimation(backgroundLayer, width, height);

        interfaceLayer.append("g")
            .attr("transform", `translate(0, ${height + 50})`)
            .selectAll("text")
            .data(visibleHours)
            .join("text")
            .attr("x", data => x(data.hour) + x.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .attr("class", "axis-text-hours")
            .text((data, i) => i % 2 !== 0 ? "" : data.hour);

        const yLabelGroup = interfaceLayer.append("g")
            .attr("transform", `translate(${margin.left - 70}, ${height - 80}) rotate(-90)`);

        yLabelGroup.append("text")
            .attr("class", "axis-text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .text("Deurbellers");

        yLabelGroup.append("path")
            .attr("d", "M7.06034405,0.146449166 C7.25560479,-0.0488143917 7.57218728,-0.0488166812 7.76745083,0.146444053 L14.6814559,7.06034917 L14.692,7.073 L14.7103063,7.09175636 L14.725,7.112 L14.7393109,7.12959747 L14.749,7.147 L14.7596353,7.16154043 L14.769,7.182 L14.7827019,7.20583532 L14.788,7.223 L14.7966187,7.2394338 L14.802,7.263 L14.8116291,7.28706568 L14.815,7.309 L14.8198443,7.32402437 L14.82,7.34 L14.8260923,7.37129149 L14.826,7.402 L14.8279,7.4139 L14.826,7.424 L14.8260917,7.45651572 L14.82,7.487 L14.8198443,7.50377563 L14.815,7.518 L14.8116272,7.54074132 L14.803,7.563 L14.7966187,7.5883662 L14.787,7.607 L14.7826989,7.62197126 L14.771,7.641 L14.7596353,7.66625957 L14.748,7.681 L14.7393068,7.69820848 L14.725,7.715 L14.7103063,7.73604364 L14.692,7.754 L14.6814508,7.76745595 L7.76745083,14.6813559 C7.57218728,14.8766167 7.25560479,14.8766144 7.06034405,14.6813508 C6.86508332,14.4860873 6.86508561,14.1695048 7.06034917,13.9742441 L13.121,7.913 L0.5,7.9139 C0.254540111,7.9139 0.0503916296,7.73702484 0.00805566941,7.50377563 L-5.68434189e-14,7.4139 C-5.68434189e-14,7.13775763 0.223857625,6.9139 0.5,6.9139 L13.12,6.913 L7.06034917,0.853555947 C6.88678156,0.679990851 6.86749446,0.410566589 7.0024891,0.215697472 L7.06034405,0.146449166 Z")
            .attr("transform", "translate(55, -7.4)")
            .attr("fill", "var(--color-dark-green)");

        const xAxisGroup = interfaceLayer.append("g")
            .attr("transform", `translate(${width / 10}, ${height + margin.bottom - 80})`);

        xAxisGroup.append("text")
            .attr("class", "axis-text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .text("Tijd (Uren)");

        xAxisGroup.append("path")
            .attr("d", "M7.06034405,0.146449166 C7.25560479,-0.0488143917 7.57218728,-0.0488166812 7.76745083,0.146444053 L14.6814559,7.06034917 L14.692,7.073 L14.7103063,7.09175636 L14.725,7.112 L14.7393109,7.12959747 L14.749,7.147 L14.7596353,7.16154043 L14.769,7.182 L14.7827019,7.20583532 L14.788,7.223 L14.7966187,7.2394338 L14.802,7.263 L14.8116291,7.28706568 L14.815,7.309 L14.8198443,7.32402437 L14.82,7.34 L14.8260923,7.37129149 L14.826,7.402 L14.8279,7.4139 L14.826,7.424 L14.8260917,7.45651572 L14.82,7.487 L14.8198443,7.50377563 L14.815,7.518 L14.8116272,7.54074132 L14.803,7.563 L14.7966187,7.5883662 L14.787,7.607 L14.7826989,7.62197126 L14.771,7.641 L14.7596353,7.66625957 L14.748,7.681 L14.7393068,7.69820848 L14.725,7.715 L14.7103063,7.73604364 L14.692,7.754 L14.6814508,7.76745595 L7.76745083,14.6813559 C7.57218728,14.8766167 7.25560479,14.8766144 7.06034405,14.6813508 C6.86508332,14.4860873 6.86508561,14.1695048 7.06034917,13.9742441 L13.121,7.913 L0.5,7.9139 C0.254540111,7.9139 0.0503916296,7.73702484 0.00805566941,7.50377563 L-5.68434189e-14,7.4139 C-5.68434189e-14,7.13775763 0.223857625,6.9139 0.5,6.9139 L13.12,6.913 L7.06034917,0.853555947 C6.88678156,0.679990851 6.86749446,0.410566589 7.0024891,0.215697472 L7.06034405,0.146449166 Z")
            .attr("transform", "translate(45, -7.4)")
            .attr("fill", "var(--color-dark-green)");
    }

    const sunLineData = visibleHours.map(d => ({
        x: x(d.hour) + x.bandwidth() / 2,
        y: getSunYPosition(d.hour, height)
    }));

    const sunLineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveMonotoneX);

    let sunTrajectoryPath = sunMoonPathLayer.select(".sun-trajectory");
    if (sunTrajectoryPath.empty()) {
        sunTrajectoryPath = sunMoonPathLayer.append("path")
            .attr("class", "sun-trajectory")
            .attr("fill", "none")
            .attr("stroke", "var(--color-pink")
            .attr("stroke-dasharray", "6,6")
            .attr("stroke-width", 2);
    }
    sunTrajectoryPath.datum(sunLineData).attr("d", sunLineGenerator);

    const legendContainer = d3.select("#legend-items-container");
    legendContainer.selectAll("*").remove();

    const legendItems = [
        { key: "total", label: "Totaal" },
        ...eventKeys.map(key => ({ key: key, label: key }))
    ];

    legendItems.forEach(item => {
        const isActive = currentSelectedKey === item.key;

        const buttonContainer = legendContainer.append("div")
            .attr("class", "legend-button-wrapper")
            .classed("is-active", isActive);

        const button = buttonContainer.append("button")
            .attr("class", "legend-button")
            .on("click", () => {
                currentSelectedKey = item.key;
                drawD3Graph(graphData, eventKeys);
            });

        const circle = button.append("div")
            .attr("class", "slider-circle");

        const imageWrapper = circle.append("div")
            .attr("class", "image-container");

        imageWrapper.append("img")
            .attr("src", "https://visdeurbel.nl/wp-content/themes/visdeurbel/assets/874c058f53f2f79839e4.svg")
            .attr("alt", "Check")
            .attr("class", "circle-image");

        const contentWrapper = button.append("span")
            .attr("class", "button-content-wrapper");

        contentWrapper.append("span")
            .attr("class", "button-text")
            .text(item.label);

        contentWrapper.append("img")
            .attr("src", getFishImageUrl(item.key))
            .attr("alt", item.label)
            .attr("class", "fish-type-image");
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
    areaPath.datum(clipPoints).transition().duration(750).attr("d", areaGenerator);

    let linePath = dataPathLayer.select(".line-path");
    if (linePath.empty()) {
        linePath = dataPathLayer.append("path")
            .attr("class", "line-path")
            .attr("fill", "none")
            .attr("stroke", "var(--color-purple)")
            .attr("stroke-width", 3);
    }
    linePath.datum(clipPoints).transition().duration(750).attr("d", lineGenerator);

    interfaceLayer.select(".fish-layer").remove();
    interfaceLayer.select(".bubbles-layer").remove();
    interfaceLayer.select(".sun-moon-interactive-layer").remove();
    interfaceLayer.select(".interaction-layer").remove();

    const bubbleGroup = interfaceLayer.append("g").attr("class", "bubbles-layer");
    const sunMoonInteractiveGroup = interfaceLayer.append("g").attr("class", "sun-moon-interactive-layer");
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

            const theme = getHourTheme(data.hour);
            const iconUrl = theme === "night" ? "./img/moon.png" : "./img/sun.png";

            svgSelection.attr("data-theme", theme);

            const xPos = x(data.hour) + x.bandwidth() / 2;
            const yPos = getSunYPosition(data.hour, height);

            sunMoonInteractiveGroup.append("image")
                .attr("class", "sun-moon-hover-icon")
                .attr("href", iconUrl)
                .attr("width", 36)
                .attr("height", 36)
                .attr("x", xPos - 18)
                .attr("y", yPos - 18)
                .style("pointer-events", "none");

            let tooltipContent = `<h3>${data.hour}</h3>`;
            if (currentSelectedKey === "total") {
                tooltipContent += `<p>Totaal: <strong>${data.total}</strong> events</p><div id='line'></div>`;
                eventKeys.forEach(key => {
                    if (data[key] > 0) tooltipContent += `<p>${key}: <strong>${data[key]}</strong><br></p>`;
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

            sunMoonInteractiveGroup.selectAll(".sun-moon-hover-icon").remove();
        });

    svgSelection.on("mouseleave", () => {
        svgSelection.attr("data-theme", "day");
    });

    const yAxis = d3.axisLeft(y)
        .tickValues(yTicks)
        .tickFormat(d3.format("d"))
        .tickSize(-width);

    yAxisGroup.transition()
        .duration(750)
        .call(yAxis)
        .on("end", () => {
            yAxisGroup.selectAll("text")
                .attr("dx", "8")
                .attr("dy", "-6")
                .style("text-anchor", "start")
                .style("font-size", "12px");

            yAxisGroup.selectAll(".tick line")
                .attr("stroke", "rgba(0, 0, 0, 0.1)")
                .attr("stroke-dasharray", "4,4");

            yAxisGroup.select(".domain").remove();
        });

    yAxisGroup.selectAll("text")
        .attr("dx", "8")
        .attr("dy", "-6")
        .style("text-anchor", "start")
        .style("font-size", "12px");

    yAxisGroup.selectAll(".tick line")
        .attr("stroke", "rgba(0, 0, 0, 0.1)")
        .attr("stroke-dasharray", "1,4");

    yAxisGroup.select(".domain").remove();

    initFishAnimation(clippedForegroundLayer, width, height, currentSelectedKey);
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
        const bubble = floatingGroup.append("image")
            .attr("href", "./img/Bubble.png")
            .style("filter", "url(#blue-green-filter)")
            .attr("opacity", 0.6);
        const animate = (b) => {
            const r = 4 + Math.random() * 12;
            const xPos = Math.random() * width;
            b.attr("width", r)
                .attr("height", r)
                .attr("x", xPos)
                .attr("y", height + 20)
                .transition().duration(4000 + Math.random() * 5000)
                .ease(d3.easeLinear)
                .attr("x", xPos + (Math.random() * 40 - 20))
                .attr("y", -20)
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
            .attr("opacity", 0.9)
            .style("filter", "url(#pink-tint-filter)");

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
            const match = queryString.match(/[?&]fish=([^&]+)/i);

            if (match && match[1]) {
                const rawFishString = decodeURIComponent(match[1]);
                const cleanFishes = rawFishString.split(',')
                    .map(f => f.trim())
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