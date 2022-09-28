let pt3_dna,
    pt3_trj,
    pt3_dna_filtered,
    pt3_trj_filtered;

let trj_filter = 1000;

let graph;

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
        })
        pt3_trj_filtered = [];
        pt3_trj.forEach((i) => {
            if(i.trj.length <= trj_filter){
                pt3_trj_filtered.push(i);
            }
        })
        pt3_dna_filtered = new Set();
        pt3_trj_filtered.forEach((trj) => {
            trj.trj.forEach((i) => {
                pt3_dna_filtered.add(i)
            })
        });
    }).then(() => {
        console.log(pt3_dna_filtered);
        pt3_trj_filtered = pt3_trj_filtered.sort((a,b) => a.trj.length - b.trj.length);
        console.log(pt3_trj_filtered);
        graph = new DNAGraph(
            {
                parentElement: '#scatter',
                width: 1000,
                height: 800,
                margin: {left: 30, right: 20, top: 20, bottom: 20},
            },
            pt3_dna_filtered,
            [pt3_trj_filtered[0], pt3_trj_filtered[13]],
        );
        graph.updateVis();
        d3.selectAll('.particle').each(moveParticles);

        function moveParticles() {
            d3.select(this)
                .attr('x', (d) => graph.xScale(d.x1))
                .attr('y', (d) => graph.yScale(d.y1))
            d3.select(this).transition()
                .duration((d) => {d.time*1e12/4})
                .ease(d3.easeLinear)
                .attr('x', (d) => 0.75*(graph.xScale(d.x1))+0.25*(graph.xScale(d.x2)))
                .attr('y', (d) => 0.75*(graph.yScale(d.y1))+0.25*(graph.yScale(d.y2)))
                .attr('opacity', 1)
                .on('end', moveParticles2)
        }
        function moveParticles2(){
            d3.select(this).transition()
                .ease(d3.easeLinear)
                .duration((d) => d.time*1e12/4)
                .attr('x', (d) => 0.5*(graph.xScale(d.x1)+graph.xScale(d.x2)))
                .attr('y', (d) => 0.5*(graph.yScale(d.y1)+graph.yScale(d.y2)))
                .attr('opacity', 0)
                .on('end', moveParticles3)
        }
        function moveParticles3(){
            d3.select(this).transition()
                .ease(d3.easeLinear)
                .duration((d) => d.time*1e12/4)
                .attr('x', (d) => 0.25*(graph.xScale(d.x1))+0.75*(graph.xScale(d.x2)))
                .attr('y', (d) => 0.25*(graph.yScale(d.y1))+0.75*(graph.yScale(d.y2)))
                .attr('opacity', 1)
                .on('end', moveParticles4)
        }
        function moveParticles4(){
            d3.select(this).transition()
                .ease(d3.easeLinear)
                .duration((d) => d.time*1e12/4)
                .attr('x', (d) => graph.xScale(d.x2))
                .attr('y', (d) => graph.yScale(d.y2))
                .attr('opacity', 0)
                .on('end', moveParticles)
        }
        
        //d3.selectAll('.trj').each(animateSeg);
        function animateSeg(){
            var seg = d3.select(this);
            const length = seg.node().getTotalLength(d3.easeLinear);
            var segData = seg.data();
            seg.attr("stroke-dashoffset", 200).transition()
            .attr('stroke-opacity', 100000)
            .duration(50000)
            .attr('stroke-dasharray', 200+" "+length)
            .attr("stroke-dashoffset", -length)
            .on('end', animateSeg)
          }
    })
});

