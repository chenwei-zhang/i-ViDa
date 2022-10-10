let pt3_dna,
    pt3_trj,
    pt3_dna_filtered,
    pt3_trj_filtered;

let trj_filter = 2000;

let overview, studio;
const dispatcher = d3.dispatch('selTrj');

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
        //pt3_trj = pt3_trj.sort((a,b) => a.trj.length - b.trj.length);
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
        pt3_trj_filtered = pt3_trj_filtered.sort((a,b) => a.trj.length - b.trj.length);
    }).then(() => {
        overview = new Overview(
            {
                parentElement: '#overview',
                width: 1000,
                height: 700,
                margin: {left: 30, right: 20, top: 20, bottom: 20},
            },
            pt3_dna,
            pt3_trj,
        );
        overview.updateVis();
        studio = new Studio(
            {
                parentElement: '#trajectory-clip',
                width: 500,
                height: 2800,
                margin: {left: 30, right: 20, top: 0, bottom: 0},
                callToolTip: callToolTip1,
            },
            pt3_trj,
            dispatcher,
        );
        studio.updateVis();
        // graph = new DNAGraph(
        //     {
        //         parentElement: '#scatter',
        //         width: 1000,
        //         height: 700,
        //         margin: {left: 30, right: 20, top: 20, bottom: 20},
        //     },
        //     pt3_dna_filtered,
        //     [pt3_trj_filtered[0]],
        // );
        // graph.updateVis();
        // d3.selectAll('.particle').each(moveParticles1);

        // function moveParticles1() {
        //     d3.select(this)
        //         .attr('x', (d) => graph.xScale(d.x1))
        //         .attr('y', (d) => graph.yScale(d.y1))
        //     d3.select(this).transition()
        //         .ease(d3.easeLinear)
        //         .duration((d) => ((d.x1-d.x2)**2+(d.y1-d.y2)**2)**0.5/(d.time*1e6))
        //         .attr('x', (d) => 0.5*(graph.xScale(d.x1))+0.5*graph.xScale(d.x2))
        //         .attr('y', (d) => 0.5*(graph.yScale(d.y1))+0.5*graph.yScale(d.y2))
        //         .attr('opacity', 1)
        //         .on('end', moveParticles2)
        // }
        // function moveParticles2(){
        //     d3.select(this).transition()
        //         .ease(d3.easeLinear)
        //         .duration((d) => {
        //             return ((d.x1-d.x2)**2+(d.y1-d.y2)**2)**0.5/(d.time*1e6);})
        //         .attr('x', (d) => 0*(graph.xScale(d.x1))+graph.xScale(d.x2))
        //         .attr('y', (d) => 0*(graph.yScale(d.y1))+graph.yScale(d.y2))
        //         .attr('opacity', 0)
        //         .on('end', moveParticles1)
        // }
        
    })
});

dispatcher.on('selTrj', (selectedTrj) => {
    overview.seltrj = selectedTrj;
    overview.drawTrajectory();
})

const callToolTip1 = function(e, d, vis) {
    d3.select("#tooltip1").style("display", "inline-block").style("opacity", 1);
    d3.select("#tooltip1")
        .html(
            `
            <div>${d.id}</div>
            <div>
                <p><text>Steps: ${d.trj.length}</text></p>
            </div>
            `
        )
        .style('left', e.pageX+'px')
        .style('top', e.pageY+'px');
};