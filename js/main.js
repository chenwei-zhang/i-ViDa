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
    });
}).then(() => {
    var svg = d3.select('#scatter').append('svg')
        .attr('id', 'scattersvg')
        .attr('width', '1200px').attr('height', '850px')
        .attr("clip-path", "url(#clip)")
    var width = $('#scattersvg').width();
    var height = $('#scattersvg').height();
    var x = d3.scaleLinear().domain([d3.min(pt3_dna, (dna)=> dna.pca_x), d3.max(pt3_dna, (dna)=> dna.pca_x)])
        .range([0, width]);
    var y = d3.scaleLinear()
        .domain([d3.min(pt3_dna, (dna)=> dna.pca_y), d3.max(pt3_dna, (dna)=> dna.pca_y)])
        .range([height, 0]);
    var c = d3.scaleLinear().domain([d3.min(pt3_dna, (dna)=> dna.energy), d3.max(pt3_dna, (dna)=> dna.energy)])
        .range(["red", "lightgreen"])
    var r = d3.scaleSqrt().domain([d3.min(pt3_dna, (dna)=> dna.time), d3.max(pt3_dna, (dna)=> dna.time)])
        .range([2, 5])
    var xaxis = svg.append("g")
        .call(d3.axisBottom(x));
    var yaxis = svg.append("g")
        .call(d3.axisLeft(y));
    var clip = svg.append("defs").append("SVG:clipPath")
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


    var zoom = d3.zoom()
      .scaleExtent([.5, 20])  // This control how much you can unzoom (x0.5) and zoom (x20)
      .extent([[0, 0], [width, height]])
      .on("zoom", updateChart);
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .call(zoom);
    function updateChart() {
        // recover the new scale
        var newX = d3.zoomTransform(this).rescaleX(x);
        var newY = d3.zoomTransform(this).rescaleY(y);
        // update axes with these new boundaries
        xaxis.call(d3.axisBottom(newX))
        yaxis.call(d3.axisLeft(newY))
        // update circle position
        svg.selectAll(".dot")
          .attr('cx', function(d) {return newX(d.pca_x)})
          .attr('cy', function(d) {return newY(d.pca_y)});
    }
}).then(()=>{console.log(new Date().getTime()-start);});


