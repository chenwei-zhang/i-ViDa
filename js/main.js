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
    var x = d3.scaleLinear().domain([d3.min(pt3_dna, (dna)=> dna.pca_x)-2, d3.max(pt3_dna, (dna)=> dna.pca_x)+2])
        .range([0, width]);
    var y = d3.scaleLinear()
        .domain([d3.min(pt3_dna, (dna)=> dna.pca_y)-2, d3.max(pt3_dna, (dna)=> dna.pca_y)+2])
        .range([height, 0]);
    var c = d3.scaleLinear().domain([d3.min(pt3_dna, (dna)=> dna.energy), d3.max(pt3_dna, (dna)=> dna.energy)])
        .range(["black", "white"])
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
        .append('g')
        .attr('class', 'dotgroup')
        .append("circle")
        .attr('class', 'dot')
        .attr('id', (d)=>{return d.id});
    circlesEnter.merge(circles)
    .attr("cx", (dna)=>x(dna.pca_x))
    .attr("cy",  (dna)=>y(dna.pca_y))
    .attr("r", (dna)=>{if(dna.id==0||dna.id==169) return 40; else return r(dna.time)})
    .attr("fill", (dna)=>{return c(dna.energy)})
    .attr('stroke', 'grey')
    .attr('stroke-width', '1px')
    var endpoints = d3.selectAll('.dotgroup').filter((d)=>{return d.id===0||d.id===169});
    endpoints.append('text').attr('class', 'label').text('I').attr('font-size', 30).attr('transform', (d)=>{return `translate(${x(d.pca_x)}, ${y(d.pca_y)})`});
    endpoints.select('.dot').attr('fill', 'blue');
    endpoints.raise();
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
            x.domain([d3.min(pt3_dna, (dna)=> dna.pca_x)-2, d3.max(pt3_dna, (dna)=> dna.pca_x)+2])
            y.domain([d3.min(pt3_dna, (dna)=> dna.pca_y)-2, d3.max(pt3_dna, (dna)=> dna.pca_y)+2])
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
        svg.selectAll(".label")
            .attr('transform', (d)=>{return `translate(${x(d.pca_x)}, ${y(d.pca_y)})`});
    }
}).then(()=>{console.log(new Date().getTime()-start);});


