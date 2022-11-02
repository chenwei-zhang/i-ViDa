class Flow{

    constructor(_config, _data_trj){
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.width,
            containerHeight: _config.height,
        }
        this.margin = _config.margin;
        this.trajectory = _data_trj;
        this.seltrj = [88,97,24];
        this.domain = null;
        this.idleTimeout = null;
        this.flag = 0;
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
            .domain([11, -40])
            .range([0, vis.height]);
        // selection trj category
        vis.sScale = d3.scaleOrdinal(d3.schemeDark2);
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
        vis.xAxis = d3.axisBottom(vis.xScale).tickFormat((x) => `${x+'%'}`).tickSizeOuter(-vis.height);
        vis.dAxis = d3.axisBottom(vis.dScale);
        vis.yAxis = d3.axisLeft(vis.yScale).ticks(6).tickSize(-vis.width);
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
        vis.drawAllFlow(vis.flag, vis.domain);
    }

    drawAllFlow(flag, domain){
        let vis = this;
        vis.seltrj.forEach((sel, idx) => {
            vis.drawFlow(sel, idx, flag, domain);
        })
    }

    drawFlow(trj, idx, flag, domain) {
        if(!trj){
            return;
        }
        let vis = this;
        const states = vis.trajectory[trj-1].trj;
        if(!domain){
            vis.dScale.domain([0, states.length-1]);
        }else {
            vis.dScale.domain([Math.floor(states.length*domain[0]*0.01), Math.ceil(states.length*domain[1]*0.01)]);   
        }
        let pos = [];
        states.forEach((s, i) => {
            if(states.length >= 200){
                if(i % Math.floor(states.length/200) == 0 || (i == states.length-1)){
                    pos.push({x: i, y:s.energy});
                }
            }else {
                pos.push({x: i, y:s.energy});
            }
        });
        vis.line = vis.svg
            .append('path')
            .datum(pos)
            .attr('class', 'flow-line')
            .attr('fill', 'none')
            .attr('stroke', flag==0? '#668fff': vis.sScale(idx))
            .attr('stroke-width', 1.5)
            .attr('d', d3.line()
                .x(d => vis.dScale(d.x))
                .y(d => vis.yScale(d.y))
            ).attr("clip-path", "url(#clip)");
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
            vis.domain = null;
        }else{
            vis.domain = [vis.xScale.invert(extent[0]), vis.xScale.invert(extent[1])];
            vis.xScale.domain([vis.xScale.invert(extent[0]), vis.xScale.invert(extent[1])]);
            vis.svg.select('.brush').call(vis.brush.move, null);
        }
        vis.xAxisG.call(vis.xAxis);
        vis.drawAllFlow(vis.flag, vis.domain);
    }
}