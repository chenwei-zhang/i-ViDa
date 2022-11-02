let trj_filter = 2000;
let pt3_dna,
    pt3_trj;

let overview, studio;
const dispatcher = d3.dispatch('selTrj');

/**
 * Load PT3 DNA data
 */
d3.json('data/PT4_dna.json').then((data) => {
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
            pht_y: dna.PHATE_Y,
            density: new Set(),
        };
        pt3_dna.push(dna_data);
    });
}).then(() => {
    d3.json('data/PT4_trj.json').then((data) => {
        pt3_trj = [];
        data.forEach((trj, index) =>{
            const idx = [];
            trj.idx.forEach((i) => {
                idx.push(pt3_dna[i]);
                pt3_dna[i].density.add(index+1);
            });
            const trj_data = {
                id: trj.ID,
                trj: idx,
                time: trj.time,
                totaltime: d3.sum(trj.time),
            };
            pt3_trj.push(trj_data);
        });
        pt3_sorttime = pt3_trj.slice().sort((a, b) => (a.totaltime - b.totaltime));
        pt3_ranktime = pt3_trj.map((x)=> pt3_sorttime.indexOf(x)+1);
        pt3_trj.forEach((trj, index) => {
            trj.ranktime = pt3_ranktime[index];
        });
    }).then(() => {
        overview = new Overview(
            {
                parentElement: '#overview',
                width: 900,
                height: 700,
                margin: {left: 30, right: 20, top: 20, bottom: 20},
                callToolTip: callToolTip2,
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
        flow = new Flow(
            {
                parentElement: '#flow',
                width: 900,
                height: 500,
                margin: {left: 30, right: 20, top: 20, bottom: 20},
            },
            pt3_trj,
        );
        flow.updateVis();
    })
});

dispatcher.on('selTrj', (selectedTrj) => {
    overview.seltrj = selectedTrj;
    overview.drawTrajectory();
    d3.selectAll('.flow-line').remove().exit();
    flow.seltrj = selectedTrj;
    console.log(selectedTrj)
    if(selectedTrj.every(e => e===null)){
        flow.seltrj = [88,97,24];
        flow.flag = 0;
        flow.drawAllFlow(flow.flag, null);
    }else{
        flow.flag = 1;
        flow.drawAllFlow(flow.flag, null);
    }
})

const callToolTip1 = function(e, d, vis) {
    d3.select("#tooltip1").style("display", "inline-block").style("opacity", 1);
    d3.select("#tooltip1")
        .html(
            `
            <div>${d.id}</div>
            <div>
                <p><text>Steps: ${d.trj.length}</text></p>
                <p><text>Time: ${(d3.sum(d.time)).toExponential(3)}</text></p>
            </div>
            `
        )
        .style('left', e.pageX+'px')
        .style('top', e.pageY+'px');
};

const callToolTip2 = function(e, d, vis) {
    d3.select("#tooltip2")
        .html(
            `
            <div style='font-size:10px'>
                <br> DP: ${d.dp}<br>
                <br> Energy: ${d.energy}<br>
                <br> Time: ${d.time}<br>
                <br> Density: ${d.density.size} ${d.density.size<=5? '['+[...d.density].join(' ')+']':''}<br>
            </div>
            `
        );
};