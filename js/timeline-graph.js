import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function drawD3Graph(grafiekData, eventKeys) {
    d3.select("#chart").selectAll("*").remove();

    const containerWidth = d3.select("#chart").node()?.getBoundingClientRect().width || 1250;
    const isMobile = containerWidth < 600;

    const baseWidth = 1250;
    const baseHeight = 562.5;

    const margin = { top: 60, right: 30, bottom: 50, left: 30 };
    const width = baseWidth - margin.left - margin.right;
    const height = baseHeight - margin.top - margin.bottom;

    const rootStyles = getComputedStyle(document.documentElement);
    const cssPurple = rootStyles.getPropertyValue('--color-purple').trim();
    const cssDarkGreen = rootStyles.getPropertyValue('--color-dark-green').trim();
    const cssGold = rootStyles.getPropertyValue('--color-gold').trim();
    const cssLightGold = rootStyles.getPropertyValue('--color-light-gold').trim();

    const svg = d3.select("#chart")
        .append("svg")
        .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
        .attr("width", "100%")
        .attr("height", "auto")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(grafiekData.map(d => d.hour))
        .range([0, width])
        .padding(isMobile ? 0.2 : 0.4);

        

    const maxTotaal = d3.max(grafiekData, d => d.total) || 10;
    const y = d3.scaleLinear()
        .domain([0, maxTotaal * 1.1])
        .range([height, 0]);

    const basisKleur = d3.color(cssPurple);
    const lichteVariant = basisKleur.copy({ opacity: 0.2 });

    const color = d3.scaleOrdinal()
        .domain(eventKeys)
        .range(d3.quantize(
            d3.interpolateRgb(basisKleur.formatRgb(), lichteVariant.formatRgb()), 
            Math.max(2, eventKeys.length)
        ));

    const defs = svg.append("defs");
    grafiekData.forEach((d, i) => {
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
        .data(grafiekData)
        .join("rect")
        .attr("class", (d, i) => `bg-bar bg-bar-${i}`)
        .attr("x", d => x(d.hour))
        .attr("y", 0)
        .attr("width", x.bandwidth())
        .attr("height", height)
        .attr("fill", "var(--color-white)") 
        .attr("rx", x.bandwidth() / 2)
        .attr("ry", x.bandwidth() / 2);

    const stackedData = d3.stack().keys(eventKeys)(grafiekData);
    const area = d3.area()
        .x(d => x(d.data.hour) + x.bandwidth() / 2)
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))
        .curve(d3.curveBasis);

    grafiekData.forEach((d, i) => {
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
        .data(grafiekData)
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
        .data(grafiekData)
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
        .data(grafiekData)
        .join("rect")
        .attr("x", d => x(d.hour))
        .attr("y", -40)
        .attr("width", x.bandwidth())
        .attr("height", height + 40)
        .attr("fill", "transparent")
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            const i = grafiekData.indexOf(d);
            const barCenterX = x(d.hour) + x.bandwidth() / 2;
            const standaardBreedte = x.bandwidth();
            const nieuweBreedte = standaardBreedte * 1.25;
            const verschuivingX = (nieuweBreedte - standaardBreedte) / 2;

            d3.selectAll(`.bg-bar-${i}, .clip-rect-${i}`)
                .transition()
                .duration(150)
                .attr("x", x(d.hour) - verschuivingX)
                .attr("width", nieuweBreedte);

            d3.select(`.circle-${i}`)
                .transition()
                .duration(150)
                .style("transform-origin", `${barCenterX}px -20px`)
                .style("transform", "scale(1.35)")
                .attr("stroke", "var(--color-dark-green)") 
                .attr("stroke-width", 2.5);

            let tooltipContent = `<div style="font-family: var(--font-body); color: var(--color-dark-green);">
                <strong style="font-size: var(--font-size-small); font-weight: var(--font-weight-headings);">${d.hour}</strong><br>
                <span style="font-size: 14px;">Totaal: ${d.total} events</span><br><gap style="display:block; height:5px; border-bottom: 1px solid var(--color-light-gold); margin-bottom:5px;"></gap>`;
            
            eventKeys.forEach(key => {
                if(d[key] > 0) tooltipContent += `<small style="display:block; font-size: 12px;">${key}: <strong>${d[key]}</strong></small>`;
            });
            tooltipContent += `</div>`;

            d3.select("#tooltip")
                .style("display", "block")
                .style("border", "2px solid var(--color-purple)")
                .style("border-radius", "var(--border-radius)")
                .html(tooltipContent);
        })
        .on("mousemove", function(event) {
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
        .on("mouseleave", function(event, d) {
            const i = grafiekData.indexOf(d);

            d3.selectAll(`.bg-bar-${i}, .clip-rect-${i}`)
                .transition()
                .duration(150)
                .attr("x", x(d.hour))
                .attr("width", x.bandwidth());

            d3.select(`.circle-${i}`)
                .transition()
                .duration(150)
                .style("transform", "scale(1)")
                .attr("stroke", "var(--color-gold)")
                .attr("stroke-width", 2);

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

    data.forEach(item => {
        if (!item.created_at || !item.event_name) return;

        const timeCreated = item.created_at.split(' ')[1]; 
        if (!timeCreated) return;
        
        const hourNumber = parseInt(timeCreated.split(':')[0], 10);

        if (hourNumber >= 0 && hourNumber < 24) {
            groupedHours[hourNumber][item.event_name] += 1;
            groupedHours[hourNumber].total += 1;
        }
    });

    drawD3Graph(groupedHours, uniqueEvents);
}