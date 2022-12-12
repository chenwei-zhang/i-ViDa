class Flow{

    constructor(_config, _data_trj, _dispatcher){
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.width,
            containerHeight: _config.height,
        }
        this.margin = _config.margin;
        this.trajectory = _data_trj;
        this.seltrj = [];
        this.idleTimeout = null;
        this.selbin = [];
        this.dispatcher = _dispatcher;
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
        let trjmin = []; let trjmax = [];
        vis.trajectory.forEach((trj) => {
            trjmin.push(d3.min(trj.trj, (t) => t.energy));
            trjmax.push(d3.max(trj.trj, (t) => t.energy));
        })
        // yscale
        vis.yScale = d3.scaleLinear()
            .domain([d3.max(trjmax)+5, d3.min(trjmin)-5])
            .range([0, vis.height]);
        // selection trj category
        vis.sScale = d3.scaleOrdinal()
        .domain([2, 0, 1])
        .range(["#00ffff","#2ca02c","#f0027f"]);
        // scales of binning
        vis.byScale = d3.scaleLinear().range([0, 500]);
        vis.bxScale = d3.scaleLinear().range([0, 30]);
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
        vis.xAxis = d3.axisBottom(vis.xScale).tickFormat((x) => `${x+'%'}`)
            .tickSize(-vis.height)
            .tickPadding(5);
        vis.yAxis = d3.axisLeft(vis.yScale).ticks(8).tickSizeOuter(-vis.width);
        vis.xAxisG = vis.svg
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
            .attr('width', 550).attr('height', 80)
            .attr('fill', '#e5ecf6')
            .attr('opacity', 0.8)
        vis.byAxisG = vis.bintool.append('g')
            .attr('class', 'axis y-axis')
            .attr('transform', `translate(25, ${60})`)
        vis.bxAxisG = vis.bintool.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(25, ${30})`)
        // add text when empty
        vis.svg.append('text')
            .text('Select Trajectories to View Flow')
            .attr('class', 'flow-empty')
            .attr('transform', `translate(${vis.width/2}, ${vis.height/2})`)
            .style('font-size', 50)
            .style('text-align', 'center')
            .style('text-anchor', 'middle')
            .style('opacity', 0.3)
            .style('pointer-events', 'none');
        vis.svg.append('text')
            .text('energy kcal/mol')
            .attr('transform', `translate(50, 15)`)
            .style('font-size', 12)
            .style('text-align', 'center')
            .style('text-anchor', 'middle')
            .style('pointer-events', 'none');
        vis.svg.append('text')
            .text('time')
            .attr('transform', `translate(835, 265)`)
            .style('font-size', 12)
            .style('text-align', 'center')
            .style('text-anchor', 'middle')
            .style('pointer-events', 'none');
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
            .attr('opacity', 0.2)
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
                    d3.select(this).attr('opacity', 0.6);
                    d3.selectAll('.flow-text').remove().exit();
                    d3.selectAll('.flow-bins').remove().exit();
                    d3.select('#flow-bin').raise();
                    vis.byScale.domain([d3.min(data.data, (d)=>d.energy), d3.max(data.data, (d)=>d.energy)]).nice();
                    vis.bintool.style('display', 'inline-block');
                    var hist = d3.histogram()
                        .value((d) => d.energy)
                        .domain(vis.byScale.domain())
                        .thresholds(vis.byScale.ticks(20));
                    var bins = hist(data.data);
                    vis.byScale.ticks(bins.length)
                    vis.byAxis = d3.axisBottom(vis.byScale);
                    vis.bxAxis = d3.axisLeft(vis.bxScale);
                    vis.byAxisG.call(vis.byAxis);
                    vis.bxScale.domain([0, d3.max(bins, (d)=>d.length)])
                    console.log(bins);
                    vis.bintool.selectAll('.flow-bins')
                        .data(bins)
                        .enter()
                        .append('rect')
                        .attr('class', 'flow-bins')
                        .attr('x', 1)
                        .attr('transform', (d) => `translate(${vis.byScale(d.x0)+25}, ${30-vis.bxScale(d.length)+30})`)
                        .attr('width', (d) => {return vis.byScale(d.x1)-vis.byScale(d.x0)})
                        .attr('height', (d) => {return vis.bxScale(d.length)})
                        .attr('fill', vis.sScale(idx))
                        .attr('stroke', '#ffffff')
                        .attr('stroke-width', 1)
                        .attr('opacity', 0.5)
                    vis.bintool.append('text')
                        .attr('class', 'flow-text')
                        .text(`# of hops: ${data.data.length}`)
                        .style('font-size', 10)
                        .attr('transform', `translate(170, 15)`)
                    vis.bintool.append('text')
                        .attr('class', 'flow-text')
                .text(`Cumulative time: ${(trajectory.totaltime*data.band/100).toExponential(3)}`)
                        .style('font-size', 10)
                        .attr('transform', `translate(25, 15)`)
                        
                }
            })
            .on('mouseout', function(e, d) {
                d3.select(this).attr('opacity', 0.2);
                vis.bintool.style('display', 'none');
            }).on('click', function(e, d){
                let count = 0;
                vis.seltrj.forEach((sel) => {
                    if(sel){
                        count += 1;
                    }
                });
                if(count == 1){
                    const active = d3.select(this).classed('active');
                    if(!active){
                        d3.select(this).classed('active', true);
                        vis.selbin.push(d);
                        vis.dispatcher.call('selBin', e, vis.selbin, vis.sScale(idx));
                    }else{
                        d3.select(this).classed('active', false);
                        vis.selbin = vis.selbin.filter((v) => {
                            return v.band !== d.band;
                        });
                        vis.dispatcher.call('selBin', e, vis.selbin, vis.sScale(idx));
                    }
                }
            })
            .attr("clip-path", "url(#clip)");

        vis.line = vis.svg
            .append('path')
            .datum(bucket)
            .attr('class', 'flow-line')
            .attr('id', (d) => `flow-line${trajectory.id}`)
            .attr('fill', 'none')
            .attr('stroke', vis.sScale(idx))
            .attr('stroke-width', 1)
            .attr('d', d3.line()
                .x((d) => vis.xScale(d.band+0.5))
                .y((d) => vis.yScale(d3.mean(d.data, (d) => d.energy)))
            ).attr("clip-path", "url(#clip)");

        vis.knots = vis.svg.selectAll(`#flow-knot${trajectory.id}`)
            .data(bucket, (d) => d.band);
        vis.knotsEnter = vis.knots
            .enter()
            .append('path')
            .attr('class', 'flow-knot')
            .attr('id', (d) => `flow-knot${trajectory.id}`);
        vis.knotsEnter
            .merge(vis.knots)
            .attr('d', d3.symbol().type(d3.symbolCross).size(15))
            .attr('fill', vis.sScale(idx))
            .attr('stroke', '#5a5a5a')
            .attr('stroke-width', 0.1)
            .attr('transform', (d) => `translate(${vis.xScale(d.band+0.5)}, ${vis.yScale(d3.mean(d.data, (d) => d.energy))}) rotate(-45)`)
            .attr('opacity', (d) => (vis.xScale(d.band+0.5)>0 && vis.xScale(d.band+0.5)<vis.width)? 1:0);
            
        vis.rects.exit().remove();
        vis.knots.exit().remove();
        vis.line.exit().remove();
    }

    idled() {
        let vis = this;
        vis.idleTimeout = null; 
    }

    updateChart(event) {
        let vis = this;
        let extent = event.selection;
        if(!extent){
            if (!idleTimeout) return idleTimeout = setTimeout(vis.idled, 350);
            d3.selectAll('.flow-rect.active').classed('active', false);
            vis.dispatcher.call('selBin', event, vis.selbin, null);
            vis.selbin = [];
            vis.xScale.domain([0, 100]);
        }else{
            vis.xScale.domain([vis.xScale.invert(extent[0]), vis.xScale.invert(extent[1])]);
            vis.svg.select('.brush').call(vis.brush.move, null);
        }
        vis.xAxisG.call(vis.xAxis);
        d3.selectAll('.flow-line').remove().exit();
        vis.drawAllFlow();
    }
}