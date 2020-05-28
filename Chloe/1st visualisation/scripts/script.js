//SVG map

var el = document.getElementById("svgMap"); // target element
var rect = el.getBoundingClientRect(); // get the bounding rectangle

var widthMap = rect.width,
    heightMap = rect.height


// Map and projection
var projection = d3.geo.mercator()
    .scale(153)
    .center([0, 20])
    .translate([widthMap / 2, heightMap / 2]);

var path = d3.geo.path()
    .projection(projection);

// The map svg
var svgMap = d3.select("#svgMap").append("svg")
    .attr("width", widthMap)
    .attr("height", heightMap);



// date formatter
var parseDateMap = d3.time.format("%d/%m/%Y").parse;


//chart

var elChart = document.getElementById("container"); // or other selector like querySelector()
var rectChart = elChart.getBoundingClientRect(); // get the bounding rectangle

// set width and height dynamically
var width = rectChart.width - 50,
    height = rectChart.height;

// set the dimensions and margins of the graph
var margin = { top: 30, right: 70, bottom: 30, left: 120 },
    width = rectChart.width - margin.left - margin.right,
    height = rectChart.height - margin.top - margin.bottom;


// date format
var parseDate = d3.time.format("%m/%d/%Y").parse;


// Line graph: set x-axis as a time scale
var x = d3.time.scale()
    .range([0, width]);

//Line graph: set y-axis linear
var y = d3.scale.linear()
    .range([height, 0]);

// Set the color scale
var color = d3.scale.category20();

//Line graph: scale and orient x-axis
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

//Line graph: scale and orient y-axis
var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

//Line graph: add line graph
var line = d3.svg.line()
    //.interpolate("basis") // smoothens out the curve
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.index); });



// append the svg object to the #container div
var svg = d3.select("#container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");



//svg map with line chart 

// Load external data: geojson file is hosted because of browser CORS issues. 
queue()
// .defer(d3.json, "https://raw.githubusercontent.com/chloemow/data/world.geojson") 
// found someone with same file
 //   .defer(d3.json, "https://raw.githubusercontent.com/hampan-da/visualization/world.geojson")
     .defer(d3.json, "https://hampan-da.github.io/visualization.github.io/world.geojson")
//    .defer(d3.csv, "https://raw.githubusercontent.com/chloemow/data/train.csv", function(d) {
    .defer(d3.csv, "data/train.csv", function(d) {

        // formating csv data
        d.Fatalities = +d.Fatalities;
        d.ConfirmedCases = +d.ConfirmedCases;
        d.Long = +d.Long;
        d.Lat = +d.Lat;
        d.Date = parseDateMap(d.Date).getTime();

        return d;
    })
    .defer(d3.csv, "data/stockprices19_20.csv", function(data) { return data; })
    .await(ready);

// append g to svg
var gMap = svgMap.append("g");


// ready function on all the data
function ready(error, topo, covid, stock) {


    // tool tip creating and styling
    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("background-color", "black")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("color", "white");


    // zoom function
    function zoomed() {
        gMap.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        svgMap.selectAll("circle")
            .attr("r", d => (((d.ConfirmedCases) / 1000)) / d3.event.scale);
    }

    // zoom utility
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 20])
        .on("zoom", zoomed);



    //draw the map
    gMap
        .selectAll("path")
        .data(topo.features)
        .enter()
        .append("path")
        .attr("d", d3.geo.path()
            .projection(projection)
        ) // draw each country
        .attr("fill", "#eee") // set the color of each country
        .attr("id", "countries");



    //draw confirmed cases as circles
    var circles =
        gMap.selectAll('circle')
        .data(covid)
        .enter()
        .append('circle')
        .attr("class", "covid")
        .style("fill", "steelblue")
        .style("opacity", 0.7)
        .attr("cx", d => projection([d.Long, d.Lat])[0])
        .attr("cy", d => projection([d.Long, d.Lat])[1])
        .attr('r', d => ((d.ConfirmedCases) / 1000))
        .style("pointer-events", "visible")
        .attr("cursor", "pointer")
        .on("mouseover", function(d) { return tooltip.style("visibility", "visible").html("Country: " + d.Country); })
        .on("mousemove", function() { return tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px"); })
        .on("mouseout", function() { return tooltip.style("visibility", "hidden"); })
        .call(zoom);



    //stock market line chart

    // Select needed columns by taking out unnecessary ones
    color.domain(d3.keys(stock[0]).filter(function(key) {

        return key !== "Date_SPX" && key !== "PX_VOLUME_SPX" &&
            key !== "Date_AXX" && key !== "PX_VOLUME_AXX" &&
            key !== "Date_CLXP" && key !== "PX_VOLUME_CLXP" &&
            key !== "Date_ITLMS" && key !== "PX_VOLUME_ITLMS" &&
            key !== "Date_AS52" && key !== "PX_VOLUME_AS52" &&
            key !== "Date_SHSZ300" && key !== "PX_VOLUME_SHSZ300";
    }));

    // loop through each data
    stock.forEach(function(d) {
        d.date = parseDate(d.Date_SPX).getTime(); // date format and then convert to milliseconds
    });



    // mapping index
    var stockIndex = color.domain().map(function(name) {
        return {
            name: name, // name of the index
            values: stock.map(function(d) {
                return {
                    date: d.date, //date in milliseconds
                    index: +d[name] // index by name property
                };
            })
        };
    });


    // Line graph: x and y domains based on the data
    x.domain(d3.extent(stock, d => d.date));

    y.domain([
        d3.min(stockIndex, function(e) {
            return d3.min(e.values, function(f) {
                return f.index;
            });
        }),
        d3.max(stockIndex, function(e) {
            return d3.max(e.values, function(f) {
                return f.index;
            });
        })
    ]);

    // x-axis settings
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // y-axis settings
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Value");

    // Line graph: path
    var index = svg.selectAll(".index")
        .data(stockIndex)
        .enter().append("g")
        .attr("class", "index");

    index.append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke-width", "1.2px")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", d => line(d.values))
        .attr("y2", svg.height)
        .style("stroke", d => color(d.name));



    // Add the mouse line
    var crosshair = svg.append("g")
        .attr("class", "mouse-over-effects");


    crosshair.append("path")
        .attr("class", "cursor-line")
        .style("stroke", "#67809f")
        .style("stroke-width", "2px")
        .style('stroke-dasharray', '3.5 3.5')
        .style("opacity", "0");

    var lines = document.getElementsByClassName('line');

    var mouseFocus = crosshair.selectAll('.mouse-per-line')
        .data(stockIndex)
        .enter()
        .append("g")
        .attr("class", "mouse-per-line");

    mouseFocus.append("circle")
        .attr("r", 3)
        .attr("fill", d => color(d.name))
        .style("opacity", "0");

    mouseFocus.append("text")
        .attr("class", "hover-text")
        .attr("dy", "-0.8em")
        .attr("transform", "translate(10,3)")
        .style("fill", d => color(d.name));

    // Append rect to canvas
    crosshair.append('svg:rect')
        .attr('height', height)
        .attr('width', width)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', function() { // mouse out crosshair moving over canvas: hide
            d3.select(".cursor-line")
                .style("opacity", "0");
            d3.selectAll(".mouse-per-line circle")
                .style("opacity", "0");
            d3.selectAll(".mouse-per-line text")
                .style("opacity", "0");
        })
        .on('mouseover', function() { // mouse over crosshair moving over canvas: show
            d3.select(".cursor-line")
                .style("opacity", "1");
            d3.selectAll(".mouse-per-line circle")
                .style("opacity", "1");
            d3.selectAll(".mouse-per-line text")
                .style("opacity", "1");
        })
        .on('mousemove', function() { // mouse out crosshair moving over canvas
            var mouse = d3.mouse(this);

            d3.selectAll(".mouse-per-line")
                .attr("transform", function(d, i) {

                    var correspondingDate = x.invert(mouse[0]) // gets mouse position corresponding date
                    var bisect = d3.bisector(d => d.date).left;


                    ix = bisect(d.values, correspondingDate);

                    d3.select(this).select('text')
                        .text(y.invert(y(d.values[ix].index)).toFixed(2));

                    d3.select(".cursor-line")
                        .attr("d", function() {
                            var data = "M" + x(d.values[ix].date) + "," + height;
                            data += " " + x(d.values[ix].date) + "," + 0;
                            return data;
                        });
                    return "translate(" + x(d.values[ix].date) + "," + y(d.values[ix].index) + ")";
                });
        });

    // chart legend area

    var lineLegend = svg.selectAll(".lineLegend").data(stockIndex)
        .enter().append("g")
        .attr("class", "lineLegend")
        .attr("transform", (d, i) => "translate(" + (width - 90) + "," + ((i * 20) - 20) + ")");

    lineLegend.append("text").text(d => d.name)
        .attr("fill", (d, i) => color(d.name))
        .attr("transform", "translate(15,9)"); // align text

    lineLegend.append("rect")
        .attr("fill", (d, i) => color(d.name))
        .attr("width", 10).attr("height", 2);



    // min and maximum date from data
    var minDate = d3.min(covid, d => d.Date);
    var maxDate = d3.max(covid, d => d.Date);


    //total confirmed cases

    // sum confirmed cases by date
    var covidSum = d3.nest()
        .key(function(d) { return +d.Date; })
        .rollup(function(values) { return d3.sum(values, function(d) { return +d.ConfirmedCases; }) })
        .entries(covid);

    d3
        .select("#totalCases")
        .text(
            "Total Cases: " +
            covidSum.map(function(d) { if (parseInt(d.key) === minDate) return d.values })[0]
        );

    //map info
    d3
        .select("#info")
        .text("Circles are scaled per 1,000");

    //sync chart
    var sync = svg.append("line")
        .attr("x1", x(minDate))
        .attr("y1", 0)
        .attr("x2", x(minDate))
        .attr("y2", height)
        .style("stroke", "steelblue")
        .style('stroke-dasharray', '3.5 3.5')
        .style("stroke-width", 2)
        .style("fill", "none");

    //slider section

    // create the noUiSlider
    var slider = d3.select("#mySlider").node();
    noUiSlider.create(slider, {
        start: 0,
        connect: 'lower',
        orientation: "horizontal",
        behaviour: "drag-snap",
        range: {
            'min': 0,
            'max': 100
        }
    });

    // slider with update settings
    slider.noUiSlider.updateOptions({
        range: {
            'min': minDate,
            'max': maxDate
        },
        start: minDate
    });


    // function to format cases with commas
    function formatTotal(num) {
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }

    // select date display element
    var dateValues = d3.select("#startEvent").node();


    // updating with slider event
    slider.noUiSlider.on("update", function(values, handle, c, d, e) {
        time = Math.round(+values[0]);

        // map circles updating
        circles
            .style("fill", "steelblue")
            .style("opacity", 0.7)
            .filter(d => d.Date >= time)
            .style("fill", "steelblue")
            .style("opacity", 0);


        // writing date to page
        dateValues.innerHTML = getCurrentDate(new Date(time));

        // total cases updating
        d3
            .select("#totalCases")
            .text(
                "Total Cases: " +
                formatTotal(covidSum.filter(d => d.key <= time).pop()["values"])
            );

        // sync slider and chart
        sync
            .attr("x1", x(time))
            .attr("y1", 0)
            .attr("x2", x(time))
            .attr("y2", height)
            .style("stroke", "steelblue")
            .style('stroke-dasharray', '3.5 3.5')
            .style("stroke-width", 2)
            .style("fill", "none");


    });


}




//utilities 

var modal = document.getElementById("readMoreModal");
var btn = document.getElementById("readMoreBtn");
var span = document.getElementsByClassName("close")[0];


btn.onclick = function() {
    modal.style.display = "block";
}

span.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
