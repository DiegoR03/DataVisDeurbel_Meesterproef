import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
// Met behulp van https://d3js.org/getting-started

export function drawD3Graph(graphData, eventKeys) {
    d3.select("#chart").selectAll("*").remove();

    const containerWidth = d3.select("#chart").node()?.getBoundingClientRect().width || 1250;
    const isMobile = containerWidth < 600;

    const baseWidth = 1250;
    const baseHeight = 562.5;

    const margin = { top: 60, right: 30, bottom: 50, left: 30 };
    const width = baseWidth - margin.left - margin.right;
    const height = baseHeight - margin.top - margin.bottom;

    const rootStyles = getComputedStyle(document.documentElement);
    const cssPink = rootStyles.getPropertyValue('--color-pink').trim();

    const svg = d3.select("#chart")
        .append("svg")
        .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
        .attr("width", "100%")
        .style("height", "auto")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const visibleHours = graphData.filter(d => d.hour.includes(':'));

    const x = d3.scaleBand()
        .domain(visibleHours.map(d => d.hour))
        .range([0, width])
        .padding(isMobile ? 0.2 : 0.4);

    const xWaves = d3.scalePoint()
        .domain(graphData.map(d => d.hour))
        .range([-x.step(), width + x.step()]);

    const y = d3.scaleLinear()
        .domain([0, (d3.max(visibleHours, d => d.total) || 10) * 1.1])
        .range([height, 0]);

    const darkPink = d3.color(cssPink).formatRgb();
    const lightPink = d3.color(cssPink).copy({ opacity: 0.4 }).formatRgb();

    const color = d3.scaleOrdinal()
        .domain(["uploadedFish", "dismissedUploading"])
        .range([darkPink, lightPink]);

    const defs = svg.append("defs");
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
            .attr("ry", x.bandwidth() / 2);
    });

    svg.append("g")
        .selectAll(".bg-bar")
        .data(visibleHours)
        .join("rect")
        .attr("class", (d, i) => `bg-bar bg-bar-${i}`)
        .attr("x", d => x(d.hour))
        .attr("y", 0)
        .attr("width", x.bandwidth())
        .attr("height", height)
        .attr("fill", "var(--color-white)")
        .attr("rx", x.bandwidth() / 2)
        .attr("ry", x.bandwidth() / 2);

    const stackedData = d3.stack().keys(eventKeys)(graphData);
    const area = d3.area()
        .x(d => xWaves(d.data.hour))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))
        .curve(d3.curveBasis);

    visibleHours.forEach((d, i) => {
        svg.append("g")
            .attr("clip-path", `url(#clip-${i})`)
            .selectAll(`.path-segment-${i}`)
            .data(stackedData)
            .join("path")
            .attr("class", `path-segment-${i}`)
            .attr("fill", layer => color(layer.key))
            .attr("d", area);
    });

    svg.append("g")
        .selectAll("circle")
        .data(visibleHours)
        .join("circle")
        .attr("class", (d, i) => `circle-${i}`)
        .attr("cx", d => x(d.hour) + x.bandwidth() / 2)
        .attr("cy", -20)
        .attr("r", 8)
        .attr("fill", "var(--color-light-gold)")
        .attr("stroke", "var(--color-gold)")
        .attr("stroke-width", 2);

    svg.append("g")
        .attr("transform", `translate(0, ${height + 25})`)
        .selectAll("text")
        .data(visibleHours)
        .join("text")
        .attr("x", d => x(d.hour) + x.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("class", "axis-text")
        .style("font-size", isMobile ? "var(--mobile-font-size-small)" : "var(--font-size-small)")
        .text((d, i) => {
            if (isMobile && i % 2 !== 0) return "";
            return d.hour;
        });

    svg.append("g")
        .selectAll(".interaction-rect")
        .data(visibleHours)
        .join("rect")
        .attr("x", d => x(d.hour))
        .attr("y", -40)
        .attr("width", x.bandwidth())
        .attr("height", height + 40)
        .attr("fill", "transparent")
        .style("cursor", "pointer")

        .on("mouseenter", function (event, d) {
            const i = visibleHours.indexOf(d);
            const standardWidth = x.bandwidth();
            const newWidth = standardWidth * 1.25;
            const shiftX = (newWidth - standardWidth) / 2;

            d3.selectAll(`.bg-bar-${i}, .clip-rect-${i}`)
                .attr("x", x(d.hour) - shiftX)
                .attr("width", newWidth);

            d3.select(`.circle-${i}`)
                .classed("active", true);

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
            const i = visibleHours.indexOf(d);

            d3.selectAll(`.bg-bar-${i}, .clip-rect-${i}`)
                .attr("x", x(d.hour))
                .attr("width", x.bandwidth());

            d3.select(`.circle-${i}`)
                .classed("active", false);

            d3.select("#tooltip").style("display", "none");
        });
}

export function createGraph(data) {
    const uniqueEvents = [...new Set(data.map(item => item.event_name))].filter(Boolean);

    const groupedHours = Array.from({ length: 24 }, (_, i) => {
        const hourString = `${String(i).padStart(2, '0')}:00`;
        const startObject = { hour: hourString, total: 0 };

        uniqueEvents.forEach(event => {
            startObject[event] = 0;
        });
        return startObject;
    });

    let latestDate = null;

    data.forEach(item => {
        if (!item.created_at || isNaN(item.created_at.getTime()) || !item.event_name) return;

        if (!latestDate || item.created_at > latestDate) {
            latestDate = item.created_at;
        }

        const hourNumber = item.created_at.getHours();

        if (hourNumber >= 0 && hourNumber < 24) {
            if (groupedHours[hourNumber].hasOwnProperty(item.event_name)) {
                groupedHours[hourNumber][item.event_name] += 1;
            }
            groupedHours[hourNumber].total += 1;
        }
    });

    if (latestDate) {
        // toLocaleDate gebruiks op basis van feedbavk van Jad
        const formattedDate = latestDate.toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        d3.select("#latest-date").text(formattedDate);
    }

    const previousHour = { ...groupedHours[23], hour: "last_Hour" };
    const nextHour = { ...groupedHours[0], hour: "next_Hour" };
    const graphDataWithBuffers = [previousHour, ...groupedHours, nextHour];

    drawD3Graph(graphDataWithBuffers, uniqueEvents);
}