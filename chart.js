// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
            ? args[number]
            : match
            ;
        });
    };
}

var categories;
d3.csv("data.csv", function(data) {

    ////////////////////////////////////////////////////////////////////
    // CONSTANTS ///////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////

    // bars
    var BarHeight = 50;
    var BarSpacing = 5;

    // padding / spacing
    var paddingLeft = 300;
    var paddingRight = paddingLeft / 3;
    var paddingTop = BarHeight;
    var paddingBottom = 0;
    var graphSpacing = BarHeight * 2;

    // titles
    var titleOffset = -10;
    var subtitleOffset = 10;

    // scales / colors
    var scales = [1000, 1000000, 1000000000, 1000000000000];
    var colors = ['#bf616a', '#d08770', '#ebcb8b', '#a3be8c', '#796895', '#5C7DA4', '#b48ead', '#ab7967', '#537776'];

    categories = [];
    for (var i = 0; i < data.length; i++) {
        if (categories.indexOf(data[i]['category']) === -1)
            categories.push(data[i]['category']);
    }

    // canvas geometry
    var width = 1200;
    if (window.innerWidth < 1200) {
        width = 1200;
    }
    else if (window.innerWidth > 2000) {
        width = 2000;
    }
    else {
        width = window.innerWidth;
    }
    var height = data.length * (BarHeight + BarSpacing) + (graphSpacing * scales.length) + 400;
    var cur_height = 0;
    var canvas = d3.select('#wrapper')
    .append('svg')
    .attr("id","main")
    .attr({'width': width,'height': height});

    ////////////////////////////////////////////////////////////////////
    // DRAW INSETS /////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////

    function drawGraph(data, xmax) {

        ////////////////////////////////////////////////////////////////
        // CONSTANTS ///////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////

        var xmin = 0;
        var height = data.length * (BarHeight + BarSpacing) + graphSpacing;

        var canvas = d3.select('#wrapper')
        .select('#main')
        .append("g")
        .attr("transform", "translate(0," + cur_height + ")")
        .attr('class', 'inset');

        var tickVals = [0];
        for (var i = 0; i <= 10; i++) {
            tickVals.push((xmax / 10) * i);
        }

        ////////////////////////////////////////////////////////////////
        // SCALES //////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////

        var xscale = d3.scale.linear()
        .domain([xmin, xmax])
        .range([0, width - (paddingLeft + paddingRight)]);

        var yscale = d3.scale.linear()
        .domain([0,data.length - 1])
        .range([height - paddingBottom, paddingTop]);

        ////////////////////////////////////////////////////////////////
        // AXES ////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////

        // X axis
        var formatValue = d3.format("$s");
        var xAxis = d3.svg.axis()
        .orient('bottom')
        .scale(xscale)
        .tickValues(tickVals)
        .tickFormat(function(d) {
            if (width > 1600) {
                return formatValue(d)
                .replace('k', ' thousand')
                .replace('M', ' million')
                .replace('G', ' billion')
                .replace('T', ' trillion');
            }
            else {
                return formatValue(d)
                .replace('k', ' k')
                .replace('M', ' M')
                .replace('G', ' B')
                .replace('T', ' T');
            }
        });

        // Y axis
        var yAxis = d3.svg.axis()
        .orient('left')
        .scale(yscale)
        .tickFormat(function(d,i){
            return data[i].name;
        })
        .tickValues(d3.range(data.length));

        var subyAxis = d3.svg.axis()
        .orient('left')
        .scale(yscale)
        .tickFormat(function(d,i){
            try {
                return data[i].subtitle;
            } catch(e) {}
        })
        .tickValues(d3.range(data.length));

        // Create axes
        canvas.append("g")
        .attr("transform", "translate(" + paddingLeft +"," + (height - paddingBottom + (BarHeight / 1.5)) + ")")
        .attr("class", "x axis").call(xAxis);
        canvas.append("g")
        .attr("transform", "translate(" + (paddingLeft - 10) + "," + titleOffset + ")")
        .attr("class", "y axis").call(yAxis);
        canvas.append("g")
        .attr("transform", "translate(" + (paddingLeft - 10) + ","+ subtitleOffset +")")
        .attr("class", "y sub axis").call(subyAxis);

        ////////////////////////////////////////////////////////////////
        // BARS ////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////

        var chart = canvas
        .selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .datum(function (d){
            d["height_offset"] = cur_height;
            return d; })
        .attr('id','bars')
        .attr('height', BarHeight)
        .attr({
            'x': paddingLeft,
            'width': function(d) {
                return xscale(parseFloat(d.price));
            },
            'y': function(d,i) {
                return yscale(i) - (BarHeight / 2);
            }
        })
        .style({
            'fill': function(d, i) {
                var i = categories.indexOf(data[i]['category']);
                return colors[i];
            }
        });

        ////////////////////////////////////////////////////////////////
        // SLICES //////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////

        function slice(xmax, partitions,width){
            for (var i = 1; i < partitions; i++){
                canvas.append('rect')
                .attr({
                    'x': xscale((xmax / partitions) * i) + paddingLeft,
                    'width': width,
                    'y': 0,
                    'height': height + 30
                })
                .style('fill', '#2B303B')
            }
        }
        slice(xmax, 10, 2);
        slice(xmax, 100, 0.5);

        cur_height += height + graphSpacing;
    }

    var legend = d3.select('#wrapper')
    .append('svg')
    .attr("id","legend")
    .attr({'width': 250,'height': 300})
    .append('g')
    .selectAll('text')
    .data(categories)
    .enter()
    .append('text')
    .attr({
        'x': 0,
        'y': function(d, i) {
            return i * 30 + 30;
        },
        'id': 'legend'
    })
    .text(function(d) {
        return d;
    })
    .style({
        'fill': function(d, i) {
            var i = categories.indexOf(d);
            return colors[i];
        }
    });

    ////////////////////////////////////////////////////////////////////
    // CREATE PARTITIONS ///////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////

    var cur = 0;
    var i = 0;

    var partitions = new Array();
    partitions.push(new Array());
    data.forEach(function(point) {
        if (point.price <= scales[cur]) {
            partitions[i].push(point);
        }
        else {
            drawGraph(partitions[i].reverse(),scales[cur]);
            i++;
            partitions.push(new Array());
            partitions[i].push(point);
            cur++;
        }
    });
    drawGraph(partitions[i].reverse(),scales[cur]);

    ////////////////////////////////////////////////////////////////////
    // CREATE LINKS ////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////

    var linkingGroups = {};
    var bars = d3.selectAll('#bars');
    bars.each(function(i) {
        if (i['Linking']){
            var offset_h = parseFloat(i["height_offset"]);
            var y = parseFloat(d3.select(this).attr("y"));
            var price = parseFloat(i['price']);
            if (linkingGroups[i['Linking']]){
                linkingGroups[i['Linking']].unshift({"y":offset_h+y,"price":price});
            }
            else{
                linkingGroups[i['Linking']] = [{"y":offset_h+y,"price":price}];
            }
        }
    });

    var curveMax = 800;

    // draw a curve path for each linking
    Object.keys(linkingGroups).forEach(function (d,i){
        pathinfo = [];
        linkingGroups[d].forEach(function (val,i){
            pathinfo.push(val["y"]);
        });

        priceinfo = [];
        linkingGroups[d].forEach(function (val,i){
            priceinfo.push(val["price"]);
        });

        pathinfo.sort();
        priceinfo.sort();

        var baryMidpoint = BarHeight/2;

        var xCurveScaling = d3.scale.linear()
        .domain([0, curveMax])
        .range([paddingLeft, width - paddingRight]);

        var widthScaling = d3.scale.linear()
        .domain([0, 6.5])
        .range([0, 22]);

        for (var i=0;i<pathinfo.length-1;i++){
            var y1 = pathinfo[i]+baryMidpoint;
            var y2 = pathinfo[i+1]+baryMidpoint;
            var midy = (y1+y2)/2;
            var scalingFactor = midy - Math.min(y1,y2);
            var midx = xCurveScaling(scalingFactor);
            var path = "M 300 {0} C {2} {0} {2} {1} 300 {1}".format(y1,y2,midx);

            var pricediff = Math.abs(priceinfo[i+1] - priceinfo[i]);
            var minprice = Math.min(priceinfo[i+1],priceinfo[i]);
            var maxprice = Math.min(priceinfo[i+1],priceinfo[i]);

            function roundUp(x){
                var y = Math.pow(10, x.toString().length-1);

                x = (x/y);
                x = Math.ceil(x);
                x = x*y;
                return x;
            }

            var proportion = roundUp(Math.trunc(pricediff/minprice * 100));

            var textProportion = proportion + "%";

            if (midx > 1100){
                var textMid = 1000
            }
            else if (midx >830){
                var textMid = 770;
            }
            else if (midx > 720){
                var textMid = 670;
            }
            else {
                textMid = midx;
            }

            canvas.append("text")
            .text(textProportion)
            .attr("x",textMid)
            .attr("y",midy)
            .style("fill", "white");

            canvas.append("svg:path")
            .attr("d",path)
            .style("stroke-width", widthScaling(Math.log(proportion)))
            .attr("class", "arc");
        };
    });

    ////////////////////////////////////////////////////////////////////
    // CREATE INSET ////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////

    var gradient = canvas.append("defs")
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad");

    gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#839DCF")
    .attr("stop-opacity", 0);

    gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#839DCF")
    .attr("stop-opacity", .8);

    var path = "M 300,775 C 300,705 "+ width + ",705 "+ width + ",705 L 300,705 Z";
    canvas.append("svg:path")
    .attr("d",path)
    .style("stroke-width", 10)
    .attr("class","zip")
    .attr("fill", "url(#gradient)")

    var path = "M 300,775 C 300,705 "+ width + ",705 "+ width + ",705 L 300,705 Z";
    canvas.append("svg:path")
    .attr("d",path)
    .style("stroke-width", 10)
    .attr("class","zip")
    .attr("fill", "url(#gradient)")
    .attr("transform","translate(0,1720)");


    var path = "M 300,775 C 300,705 "+ width + ",705 "+ width + ",705 L 300,705 Z";
    canvas.append("svg:path")
    .attr("d",path)
    .style("stroke-width", 10)
    .attr("class","zip")
    .attr("fill", "url(#gradient)")
    .attr("transform","translate(0,915)");

    var sources = document.getElementById('sourceTable');

    var table = "";
    table += "<tr><th>Item Name</th><th>Source</th></tr>";

    data.forEach(function(data) {
        if (data['name']) {
            table += "<tr>";
            table += "<td>" + data['name'] + "</td>";
            table += "<td><a target='blank' href='" + data['source1'] + "'>Source</a></td>";
            table += "</tr>";
        }
    });

    sources.innerHTML = table;
});

var legendTop = document.getElementById('blurb').clientHeight +
document.getElementById('title').clientHeight + 100;

window.onload = function() {
    d3.select('#legend').style("top", legendTop);
};
window.onresize = function(event) {
    legendTop = document.getElementById('blurb').clientHeight +
    document.getElementById('title').clientHeight + 100;
    d3.select('#legend').style("top", legendTop);
};
