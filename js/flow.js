class Flow{

    constructor(_config, _data_trj){
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.width,
            containerHeight: _config.height,
        }
        this.margin = _config.margin;
        this.trajectory = _data_trj;
        this.seltrj = [];
        this.idleTimeout = null;
        this.initVis();
    }

    initVis() {
        let vis = this;
        // area
        vis.width = vis.config.containerWidth - vis.margin.left - vis.margin.right;
        vis.height = vis.config.containerHeight - vis.margin.top - vis.margin.bottom;
        // xscales
        vis.xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, vis.width]);
        // dynamic xscale
        vis.dScale = d3.scaleLinear()
            .range([0, vis.width]);
        let trjmin = []; let trjmax = [];
        vis.trajectory.forEach((trj) => {
            trjmin.push(d3.min(trj.trj, (t) => t.energy));
            trjmax.push(d3.max(trj.trj, (t) => t.energy));
        })
        // yscale
        vis.yScale = d3.scaleLinear()
            .domain([d3.max(trjmax), d3.min(trjmin)-1])
            .range([0, vis.height]);
        // selection trj category
        vis.sScale = d3.scaleOrdinal(d3.schemeDark2);
        // scales of binning
        vis.byScale = d3.scaleLinear().range([0, 250]);
        vis.bxScale = d3.scaleBand().domain([1]).range([50]);
        vis.byAxis = d3.axisBottom(vis.byScale).ticks(6);
        // svg of the vis
        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('id', 'flow-container')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .append('g')
            .attr('id', 'flow-area')
            .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`);
        vis.svg.append('defs').append('svg:clipPath')
            .attr('id', 'clip')
            .append('svg:rect')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('x', 0)
            .attr('y', 0);
        // axis group
        vis.xAxis = d3.axisBottom(vis.xScale).tickFormat((x) => `${x+'%'}`).tickSize(-vis.height);
        vis.yAxis = d3.axisLeft(vis.yScale).ticks(4).tickSizeOuter(-vis.width);
        vis.xAxisG = vis.svg
            .append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0, ${vis.height})`);
        vis.dAxisG = vis.svg
            .append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0, ${vis.height})`);
        vis.yAxisG = vis.svg
            .append('g')
            .attr('class', 'axis y-axis');
        // add brush
        vis.brush = d3.brushX().extent([[0,0], [vis.width, vis.height]])
            .on('end', (event) => {vis.updateChart(event)});
        vis.svg.append('g').attr('class', 'brush').call(vis.brush);
        // add bucket info
        vis.bintool = d3.select('#flow-area').append('svg')
            .attr('id', 'flow-bin')
            .append('g').style('display', 'none')
            .attr('transform', `translate(1, ${vis.height-80})`);
        vis.bintool.append('rect')
            .attr('width', 300).attr('height', 80)
            .attr('fill', '#e5ecf6')
            .attr('opacity', 0.8)
        vis.byAxisG = vis.bintool.append('g')
            .attr('class', 'axis y-axis')
            .attr('transform', `translate(25, ${60})`)
        // add text when empty
        vis.svg.append('text')
            .text('Select Trajectories to View Flow')
            .attr('class', 'flow-empty')
            .attr('transform', `translate(${vis.width/2}, ${vis.height/2})`)
            .style('font-size', 50)
            .style('text-align', 'center')
            .style('text-anchor', 'middle')
            .style('opacity', 0.3)
    }

    updateVis() {
        let vis = this;
        vis.renderVis();
    }

    renderVis() {
        let vis = this;
        // axis
        vis.yAxisG.call(vis.yAxis);
        vis.xAxisG.call(vis.xAxis);
        vis.drawAllFlow();
    }

    drawAllFlow(){
        let vis = this;
        if(vis.seltrj.length > 0 && !vis.seltrj.every(t => t === null)){
            d3.select('.flow-empty').style('opacity', 0);
        }else {
            d3.select('.flow-empty').style('opacity', 0.3);
        }
        vis.seltrj.forEach((sel, idx) => {
            vis.drawFlow(sel, idx);
        })
    }

    drawFlow(trj, idx) {
        if(!trj){
            return;
        }
        let vis = this;
        const trajectory = vis.trajectory[trj-1];
        const states = trajectory.trj;
        const times = trajectory.cumltime;
        let bucket = [];
        let boundary = [0];
        for(let i = 1; i <= 100; i++){
            if(i % 1 == 0){
                const percent = trajectory.totaltime * (i/100);
                boundary.push(percent);
            }
        }
        let b = 0;
        let ub = boundary[b+1];
        let li = 0;
        times.forEach((t, i) => {
            if(t >= ub){
                if(b == 99){
                    bucket.push({band: b, data: states.slice(li)});
                }else{
                    bucket.push({band: b, data: states.slice(li, i)});
                }
                li = i;
                b += 1;
                ub = boundary[b+1];
            }
        });
        while(b < 100){
            bucket.push({band: b, data: states.slice(li)});
            b += 1;
        }
        vis.rects = vis.svg.selectAll(`#flow-rect${trajectory.id}`)
            .data(bucket, (d) => d.band);
        vis.rectsEnter = vis.rects
            .enter()
            .append('rect')
            .attr('class', `flow-rect`)
            .attr('id', (d) => `flow-rect${trajectory.id}`);
        vis.rectsEnter
            .merge(vis.rects)
            .attr('fill', vis.sScale(idx))
            .attr('stroke', '#5a5a5a')
            .attr('stroke-width', 0.5)
            .attr('opacity', 0.6)
            .attr('x', (d) => vis.xScale(d.band))
            .attr('y', (d) => vis.yScale(d3.max(d.data, (d) => d.energy)))
            .attr('width', vis.xScale(2)-vis.xScale(1))
            .attr('height', (d) => 
                Math.max(10, vis.yScale(d3.min(d.data, (d) => d.energy))-vis.yScale(d3.max(d.data, (d) => d.energy))))
            .on('mousemove', function(e, data) {
                let count = 0;
                vis.seltrj.forEach((sel) => {
                    if(sel){
                        count += 1;
                    }
                });
                if(count == 1){
                    d3.select(this).attr('opacity', 1);
                    d3.selectAll('.flow-box').remove().exit();
                    d3.selectAll('.flow-toto').remove().exit();
                    d3.selectAll('.flow-vertical').remove().exit();
                    d3.selectAll('.flow-text').remove().exit();
                    d3.select('#flow-bin').raise();
                    vis.byScale.domain([d3.min(data.data, (d)=>d.energy), d3.max(data.data, (d)=>d.energy)])
                    vis.byAxisG.call(vis.byAxis);
                    vis.bintool.style('display', 'inline-block');
                    let energies = data.data.sort((a,b) => a.energy - b.energy);
                    let q1 = d3.quantile(energies.map((e) => e.energy), 0.25);
                    let q2 = d3.quantile(energies.map((e) => e.energy), 0.5);
                    let q3 = d3.quantile(energies.map((e) => e.energy), 0.75);
                    let min = d3.min(data.data, (d)=>d.energy);
                    let max = d3.max(data.data, (d)=>d.energy);
                    vis.bintool.append('line')
                        .attr('class', 'flow-vertical')
                        .attr('y1', 35)
                        .attr('y2', 35)
                        .attr('x1', (d) => vis.byScale(min)+25)
                        .attr('x2', (d) => vis.byScale(q1)+25)
                        .attr('stroke', '#5a5a5a')
                    vis.bintool.append('line')
                        .attr('class', 'flow-vertical')
                        .attr('y1', 35)
                        .attr('y2', 35)
                        .attr('x1', (d) => vis.byScale(q3)+25)
                        .attr('x2', (d) => vis.byScale(max)+25)
                        .attr('stroke', '#5a5a5a')
                    vis.bintool.append('rect')
                        .attr('class', 'flow-box')
                        .attr('y', 20)
                        .attr('x', vis.byScale(q1)+25)
                        .attr('width', vis.byScale(q2)-vis.byScale(q1))
                        .attr('height', 30)
                        .attr('fill', vis.sScale(idx))
                        .attr('opacity', 0.4)
                        .attr('stroke', '#5a5a5a');
                    vis.bintool.append('rect')
                        .attr('class', 'flow-box')
                        .attr('y', 20)
                        .attr('x', vis.byScale(q2)+25)
                        .attr('width', vis.byScale(q3)-vis.byScale(q2))
                        .attr('height', 30)
                        .attr('fill', vis.sScale(idx))
                        .attr('opacity', 0.6)
                        .attr('stroke', '#5a5a5a');
                    vis.bintool.selectAll('.flow-toto')
                        .data([min, max])
                        .enter()
                        .append('line')
                        .attr('class', 'flow-toto')
                        .attr('y1', 20)
                        .attr('y2', 50)
                        .attr('x1', (d) => vis.byScale(d)+25)
                        .attr('x2', (d) => vis.byScale(d)+25)
                        .attr('stroke', '#5a5a5a')
                    vis.bintool.append('text')
                        .attr('class', 'flow-text')
                        .text(`# of hops: ${data.data.length}`)
                        .style('font-size', 10)
                        .attr('transform', `translate(190, 15)`)
                        
                }
            })
            .on('mouseout', function(e, d) {
                d3.select(this).attr('opacity', 0.6);
                vis.bintool.style('display', 'none')
            })
            .attr("clip-path", "url(#clip)");
        vis.rects.exit().remove();
    }

    idled() {
        let vis = this;
        vis.idleTimeout = null; 
    }

    updateChart(event) {
        let vis = this;
        d3.selectAll('.flow-line').remove().exit();
        let extent = event.selection;
        if(!extent){
            if (!idleTimeout) return idleTimeout = setTimeout(vis.idled, 350);
            vis.xScale.domain([0, 100]);
        }else{
            vis.xScale.domain([vis.xScale.invert(extent[0]), vis.xScale.invert(extent[1])]);
            vis.svg.select('.brush').call(vis.brush.move, null);
        }
        vis.xAxisG.call(vis.xAxis);
        vis.drawAllFlow();
    }
}