let pt3_dna,
    pt3_trj;

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
    }).then(() => {
        graph = new DNAGraph(
            {
                parentElement: '#scatter',
                width: 1000,
                height: 700,
                margin: {left: 30, right: 20, top: 20, bottom: 20},
            },
            pt3_dna,
            pt3_trj.slice(0,4),
        );
        graph.updateVis();

        d3.selectAll('.trj').each(animateSeg);
        function animateSeg(){
            let vis = this;
            var seg = d3.select(vis);
            const length = seg.node().getTotalLength(d3.easeLinear);
            var segData = seg.data();
            seg.attr("stroke-dashoffset", 200).transition()
            .attr('stroke-opacity',10000)
            .duration(1000)
            .attr('stroke-dasharray', 20+" "+3)
            .attr("stroke-dashoffset", -length)
            .on('end', animateSeg);
        }
    })
});

