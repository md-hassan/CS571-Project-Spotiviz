const params = new URLSearchParams(window.location.search);
const city   = params.get("city") || "DefaultCity";

function prettify(name){
    return name
      .replace('newyorkcity','New York City')
      .replace('losangeles','Los Angeles')
      .replace('chicago','Chicago')
      .replace('mexicocity','Mexico City')
      .replace('toronto','Toronto')      
  }
  
const displayCity = prettify(city);

d3.select("#topTracksHeader center")
.text(`Top Tracks in ${displayCity}`);

d3.select("#pulseTracksHeader center")
.text(`Unique Tracks in ${displayCity}`);

var topTracksPath = `../data/genre_ranking/citytoptrack-${city}-weekly.json`;
var pulseTracksPath = `../data/genre_ranking/citypulsetrack-${city}-weekly.json`;
const parseDate = d3.timeParse("%Y-%m-%d");
const formatDate = d3.timeFormat("%Y-%m-%d");
let weeklyData, topDates, pulseDates, allGenres;

Promise.all([
  d3.json(topTracksPath),
  d3.json(pulseTracksPath),
]).then(([weeklyTop, weeklyPulse]) => {
    weeklyTopData = weeklyTop;
    weeklyPulseData = weeklyPulse;
    allGenres = Object.keys(Object.values(weeklyTopData)[0]);
    topDates = Object.keys(weeklyTopData).map(parseDate).sort((a, b) => a - b);
    pulseDates = Object.keys(weeklyPulseData).map(parseDate).sort((a, b) => a - b);

    const dropdown = d3.select("#genreDropdown");
    const menu     = d3.select("#genreMenu");
    const btn      = d3.select("#genreBtn");

    // populate checkboxes
    menu.selectAll("label")
    .data(allGenres)
    .enter().append("label")
        .html(d => `<input type="checkbox" value="${d}"> ${d}`);

    // toggle open/close
    btn.on("click", () => {
    menu.classed("show", !menu.classed("show"));
    });

    // close when clicking outside
    d3.select("body").on("click", (event) => {
    if (!dropdown.node().contains(event.target)) {
        menu.classed("show", false);
    }
    });

    const colorScale = d3.scaleOrdinal()
    .domain(allGenres)
    .range(d3.quantize(d3.interpolateTurbo, allGenres.length));

    // re-render on any change
    menu.selectAll("input").on("change", () => {
    const selected = menu.selectAll("input:checked").nodes().map(n=>n.value);
    btn.text(
        selected.length
        ? `Genres: ${selected.join(", ")}`
        : "Select Genres ▾"
    );
    updateCharts(selected, colorScale);
    });

    // time-range changes → redraw
    d3.select("#rangeSelect").on("change", () => {
    const selected = menu.selectAll("input:checked")
                            .nodes().map(n => n.value);
    updateCharts(selected, colorScale);
    });

    // 5) initial draw (no genres selected → fallback inside)
    updateCharts([], colorScale);

});

function getFilteredDates(Dates, range) {
    const today = new Date(Math.max(...Dates));
    if (range === "all") return Dates;
    const monthsAgo = new Date(today.setMonth(today.getMonth() - parseInt(range)));
    return Dates.filter(d => d >= monthsAgo);
}

function getSeriesData(Data, dates, range, selectedGenres) {
    const filteredDates = getFilteredDates(dates, range);
    const datesFmt = filteredDates.map(formatDate);

    // for each genre build its own date→stream series
    return selectedGenres.map(genre => ({
        genre,
        values: datesFmt.map(date => ({
            date: parseDate(date),
            streams: (Data[date] && Data[date][genre]) || 0
        }))
    }));
}

function getPieData(Data, dates, range, selectedGenres) {
    const filteredDates = getFilteredDates(dates, range);
    const datesFmt = filteredDates.map(formatDate);
    
    // compute total streams per genre over the filtered dates
    return selectedGenres.map(genre => {
        const sum = datesFmt.reduce((acc, d) => {
            return acc + ((Data[d] && Data[d][genre]) || 0);
        }, 0);
        return { genre, value: sum };
    });
    }

function updateCharts(selectedGenres=[], colorScale) {
    // grab every selected genre (fallback to first if none)
    if (!selectedGenres.length) selectedGenres = [allGenres[0]];

    const range = d3.select("#rangeSelect").property("value") || "3";
    topSeries = getSeriesData(weeklyTopData, topDates, range, selectedGenres);
    pulseSeries = getSeriesData(weeklyPulseData, pulseDates, range, selectedGenres);
    drawLineChart(topSeries, colorScale, "#topLineChart");
    drawLineChart(pulseSeries, colorScale, "#pulseLineChart");
    
    topTotals = getPieData(weeklyTopData, topDates, range, allGenres);
    pulseTotals = getPieData(weeklyPulseData, pulseDates, range, allGenres);
    drawPieChart(topTotals, colorScale, "#topPieChart");    
    drawPieChart(pulseTotals, colorScale, "#pulsePieChart");
}

function drawPieChart(data, colorScale, pieChart) {
    const svg = d3.select(pieChart);
    svg.selectAll("*").remove();

    const svgNode = svg.node();
    const fullW   = svgNode.viewBox.baseVal.width;
    const fullH   = svgNode.viewBox.baseVal.height;
    const margin  = fullH * 0.033;                                 // <-- extra padding
    const width   = fullW  - margin * 2;
    const height  = fullH - margin * 2;
    const radius  = Math.min(width, height) / 2 - margin * 1.5;       // now fits inside padded box

    // move the group into the padded center
    const g = svg.append("g")
    .attr(
    "transform",
    `translate(${margin + width/3},${margin + height/1.9})`
    );

    const pie = d3.pie().sort(null).value(d => d.value);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const labelArc = d3.arc().innerRadius(radius).outerRadius(radius + margin * 3);

    const arcs = g.selectAll(".arc")
    .data(pie(data))
    .enter().append("g")
    .attr("class", "arc");

    // draw slices
    arcs.append("path")
    .attr("d", arc)
    .attr("fill", d => colorScale(d.data.genre))
    .attr("stroke", "#fff")
    .attr("stroke-width", "1px");

    // percentage labels just outside each slice
    const total = d3.sum(data, d => d.value);
    arcs.filter(d => (d.data.value / total) >= 0.01)
    .append("text")
    .attr("transform", d => `translate(${labelArc.centroid(d)})`)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .text(d => `${((d.data.value/total)*100).toFixed(1)}%`);

    svg.append("text")
      .attr("x", fullW / 2)
      .attr("y", margin * 1.2)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Genre Share");    

      // legend
    const legend = svg.append("g")
    .attr("transform", `translate(${width - margin * 20}, ${margin})`);

    data.forEach((s, i) => {
        const yOff = i * 18;
        legend.append("rect")
        .attr("x", 0).attr("y", yOff - 6)
        .attr("width", 12).attr("height", 12)
        .attr("fill", colorScale(s.genre));

        legend.append("text")
        .attr("x", 18).attr("y", yOff)
        .attr("dy", "0.32em")
        .attr("font-size", "12px")
        .text(s.genre);
        // .text(s.genre + ': ' +  ((s.value/total)*100).toFixed(1) + '%');
    });

    }

    
function drawLineChart(series, colorScale, lineChart) {
    const svg = d3.select(lineChart)
    .attr("overflow", "visible");    // allow legend to show outside    
    svg.selectAll("*").remove();
    
    const svgNode = svg.node();
    const fullW   = svgNode.viewBox.baseVal.width;
    const fullH   = svgNode.viewBox.baseVal.height;
  
    const margin = {
        top:    fullH * 0.10,
        right:  fullW * 0.20,  // enough room for legend
        bottom: fullH * 0.10,
        left:   fullW  * 0.10
    };
    const w  = fullW  - margin.left - margin.right;
    const h = fullH - margin.top  - margin.bottom;

    const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    // x & y scales
    const x = d3.scaleTime()
    .domain(d3.extent(series[0].values, d => d.date))
    .range([0, w]);

    const y = d3.scaleLinear()
    .domain([0, d3.max(series, s => d3.max(s.values, v => v.streams))])
    .nice()
    .range([h, 0]);

    g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left)
    .attr("x", -h/2)
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .attr("font-size","14px")
    .attr("font-weight", "bold")
    .text("Number of Songs in Top 100");

    g.append("text")
    .attr("class", "chart-title")
    .attr("text-anchor", "middle")
    .attr("x", w / 2)
    .attr("y", -margin.top)
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text(`Number of Songs in Top 100 by Genre`);


    // 2) axis generators with formatted y ticks
    const yAxis = d3.axisLeft(y)
    .ticks(6)
    .tickFormat(d => {
        return d3.format(".2s")(d).replace(/G$/, "B");
    }); 

    const xAxis = d3.axisBottom(x)
    .tickFormat(getTickFormat());

    g.append("g")
    .call(yAxis);

    g.append("g")
    .attr("transform", `translate(0,${h})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

    // 3) line generator with smoothing
    const line = d3.line()
    .curve(d3.curveMonotoneX)     // smooth
    .x(d => x(d.date))
    .y(d => y(d.streams));

    // draw each series
    series.forEach(s => {
    g.append("path")
    .datum(s.values)
    .attr("fill", "none")
    .attr("stroke", colorScale(s.genre))
    .attr("stroke-width", 2)
    .attr("d", line);
    });

    // legend
    const legend = svg.append("g")
    .attr("transform", `translate(${margin.left + w + 10}, ${margin.top})`);

    series.forEach((s, i) => {
    const yOff = i * 20;
    legend.append("rect")
    .attr("x", 0).attr("y", yOff - 8)
    .attr("width", 12).attr("height", 12)
    .attr("fill", colorScale(s.genre));

    legend.append("text")
    .attr("x", 18).attr("y", yOff)
    .attr("dy", "0.32em")
    .text(s.genre);
    });
    }

    function getTickFormat() {
    const r = d3.select("#rangeSelect").property("value");
    return r === "3" || r === "6"
    ? d3.timeFormat("%b %d")
    : r === "12"
    ? d3.timeFormat("%b")
    : d3.timeFormat("%Y");
    }

