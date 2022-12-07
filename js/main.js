let pt3_dna,
    pt3_trj;

let overview, studio;
const dispatcher = d3.dispatch('selTrj', 'selBin', 'selHex');

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
            trj.ranktime = 101-pt3_ranktime[index];
            let count = 0;
            let cumltime = [];
            trj.time.forEach((t) => {
                count = count + t;
                cumltime.push(count);
            });
            trj.cumltime = cumltime;
        });
    }).then(() => {
        overview = new Overview(
            {
                parentElement: '#overview',
                width: 900,
                height: 660,
                margin: {left: 30, right: 20, top: 10, bottom: 20},
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
                height: 300,
                margin: {left: 30, right: 20, top: 10, bottom: 20},
            },
            pt3_trj,
            dispatcher,
        );
        flow.updateVis();
        hexbin = new Hexbin(
            {
                parentElement: '#hex',
                width: 500,
                height: 300,
                margin: {left: 30, right: 20, top: 10, bottom: 20},
                callToolTip: callToolTip3,
            },
            pt3_dna,
            pt3_trj,
            dispatcher,
        );
        hexbin.updateVis();
        info = new Info(
            {
                parentElement: '#info',
                width: 470,
            },
            pt3_dna,
            [],
            [pt3_dna[0], pt3_dna[291]],
        );
        info.updateVis();
    })
});

dispatcher.on('selTrj', (selectedTrj) => {
    overview.seltrj = selectedTrj;
    overview.drawTrajectory();
    d3.selectAll(`.flow-rect`).remove().exit();
    d3.selectAll(`.flow-knot`).remove().exit();
    d3.selectAll(`.flow-line`).remove().exit();
    flow.selbin = [];
    flow.seltrj = selectedTrj;
    flow.drawAllFlow();
    d3.selectAll('.hexbin-sel').remove().exit();
    info.mode = 'empty';
    info.updateVis();
});

dispatcher.on('selBin', (selectedBin, sScale) => {
    d3.selectAll('.hexbin-sel').remove().exit();
    hexbin.showSelBin(selectedBin, sScale);
    info.mode = 'empty';
    info.updateVis();
});

dispatcher.on('selHex', (selectedData) => {
    if(!selectedData){
        info.mode = 'empty';
        d3.select('#info').style('display', 'none');
        d3.select('.menu').style('height', '700px');
        d3.select('#trajectory-clip').style('height', '600px');
        d3.select('#hex').style('border-style', 'none none none none');
    }else{
        info.mode = 'bin';
        d3.select('#info').style('display', 'inline-block');
        d3.select('.menu').style('height', '400px');
        d3.select('#trajectory-clip').style('height', '300px');
        d3.select('#hex').style('border-style', 'dashed none none none');
        info.data = selectedData;
    }
    info.updateVis();
});

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

const callToolTip3 = function(e, d, vis) {
    d3.select("#tooltip3")
        .html(
            `
            <div style='font-size:10px'>
                <br> # of states: ${d.length}<br>
                <br> Avg. energy: ${d3.mean(d, (data) => data.energy).toFixed(2)}<br>
            </div>
            `
        );
};