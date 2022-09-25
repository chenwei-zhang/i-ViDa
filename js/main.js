let pt3_dna,
    pt3_trj;

var start = new Date().getTime();
/**
 * Load PT3 DNA data
 */
d3.json('data/PT3_dna.json').then((data) => {
    pt3_dna = [];
    data = data.sort(function (a, b) {
        return a.ID - b.ID;
    });
    data.forEach((dna) =>{
        const dna_data = {
            id: dna.ID,
            energy: dna.Energy,
            time: dna.Avgtime,
            dp: dna.DP,
            pca_x: dna.PCA_X,
            pca_y: dna.PCA_Y,
            pht_x: dna.PHATE_X,
            pht_y: dna.PHATE_Y
        };
        pt3_dna.push(dna_data);
    });
}).then(() => {
    d3.json('data/PT3_trj.json').then((data) => {
        pt3_trj = [];
        data.forEach((trj) =>{
            const idx = [];
            trj.idx.forEach((i) => {
                idx.push(pt3_dna[i]);
            });
            const trj_data = {
                id: trj.ID,
                trj: idx,
                time: trj.time
            };
            pt3_trj.push(trj_data);
        });
        console.log(pt3_trj[pt3_trj.length-1]);
    });
}).then(() => {
    var svg = d3.select('#scatter').append('svg')
        .attr('id', 'scattersvg')
        .attr('width', '1200px').attr('height', '850px')
        .attr("clip-path", "url(#clip)")
    var width = $('#scattersvg').width();
    var height = $('#scattersvg').height();
    var x = d3.scaleLinear().domain([d3.min(pt3_dna, (dna)=> dna.pca_x), d3.max(pt3_dna, (dna)=> dna.pca_x)+2])
        .range([0, width]);
    var y = d3.scaleLinear()
        .domain([d3.min(pt3_dna, (dna)=> dna.pca_y), d3.max(pt3_dna, (dna)=> dna.pca_y)+2])
        .range([height, 0]);
    var c = d3.scaleLinear().domain([d3.min(pt3_dna, (dna)=> dna.energy), d3.max(pt3_dna, (dna)=> dna.energy)])
        .range(["red", "lightgreen"])
    var r = d3.scaleSqrt().domain([d3.min(pt3_dna, (dna)=> dna.time), d3.max(pt3_dna, (dna)=> dna.time)])
        .range([2, 20])
    var xaxis = svg.append("g")
        .call(d3.axisBottom(x));
    var yaxis = svg.append("g")
        .call(d3.axisLeft(y));
    svg.append("defs").append("SVG:clipPath")
        .attr("id", "clip")
        .append("SVG:rect")
        .attr("width", width )
        .attr("height", height )
        .attr("x", 0)
        .attr("y", 0);

    var circles = svg.append('g')
        .selectAll(".dot")
        .data(pt3_dna, (d)=> d.id)
    var circlesEnter = circles
        .enter()
        .append("circle")
        .attr('class', 'dot')
        .attr('id', (d)=>d.id);
    circlesEnter.merge(circles)
    .attr("cx", (dna)=>x(dna.pca_x))
    .attr("cy",  (dna)=>y(dna.pca_y))
    .attr("r", (dna)=>r(dna.time))
    .style("fill", (dna)=>c(dna.energy))
    .attr('stroke', 'grey')
    .attr('stroke-width', '1px')

    svg.append('circle')
    .attr("cx", x(pt3_dna[0].pca_x))
    .attr("cy", y(pt3_dna[0].pca_y))
    .attr("r", 40)

    svg.append('circle')
    .attr("cx", x(pt3_dna[169].pca_x))
    .attr("cy", y(pt3_dna[169].pca_y))
    .attr("r", 40)

    var brush = d3.brush()
        .extent( [ [0,0], [width,height] ] )
        .on("end", updateChart)
    svg.append("g")
        .attr("class", "brush")
        .call(brush);
    var idleTimeout
    function idled() { idleTimeout = null; }
    function updateChart(event) {
        extent = event.selection;

        // If no selection, back to initial coordinate. Otherwise, update X axis domain
        if(!extent){
            if (!idleTimeout) return idleTimeout = setTimeout(idled, 350);
            x.domain([d3.min(pt3_dna, (dna)=> dna.pca_x), d3.max(pt3_dna, (dna)=> dna.pca_x)])
            y.domain([d3.min(pt3_dna, (dna)=> dna.pca_y), d3.max(pt3_dna, (dna)=> dna.pca_y)])
        }else{
            x.domain([x.invert(extent[0][0]), x.invert(extent[1][0])])
            y.domain([y.invert(extent[0][1]), y.invert(extent[1][1])])
            svg.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
        }

        xaxis.call(d3.axisBottom(x))
        yaxis.call(d3.axisLeft(y))
        svg.selectAll(".dot")
            .attr("cx", function (d) { return x(d.pca_x); } )
            .attr("cy", function (d) { return y(d.pca_y); } )
    }
}).then(()=>{console.log(new Date().getTime()-start);});


