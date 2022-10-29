class Studio {

    constructor(_config, _data_trj, _dispatcher){
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.width,
            containerHeight: _config.height,
            callToolTip: _config.callToolTip,
        }
        this.margin = _config.margin;
        this.dispatcher = _dispatcher;
        this.trajectory = _data_trj;
        this.seltrj = [null, null, null];
        this.initVis();
    }

    initVis() {
        let vis = this;
        // area
        vis.width = vis.config.containerWidth - vis.margin.left - vis.margin.right;
        vis.height = vis.config.containerHeight - vis.margin.top - vis.margin.bottom;
        // xscale
        vis.xScale = d3.scalePow().exponent(0.5)
            .range([0, vis.width]);
        // yscale
        vis.yScale = d3.scaleBand()
            .range([0, vis.height]).padding(1);
        // selection trj category
        vis.sScale = d3.scaleOrdinal(d3.schemeDark2);
        // svg of the vis
        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('id', 'bar-container')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
        // chart area
        vis.chart = vis.svg
            .append('g')
            .attr('id', 'bar-area')
            .attr('width', vis.width)
            .attr('height', 700)
            .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`);
        // control area
        vis.ctrl = d3.select('#trajectory-ctrl')
            .append('svg')
            .attr('width', 250)
            .attr('height', 200)
            .attr('id', 'ctrl-area')
            .attr('transform', `translate(${vis.width+vis.margin.left-vis.width/2}, ${vis.margin.top})`)
            .append('rect')
            .attr('width', vis.width/2)
            .attr('height', 200)
            .attr('x', 0)
            .attr('y', 0)
            .attr('fill', 'grey')
            .attr('opacity', 0);
        // clippath
        vis.svg.append('defs').append('SVG:clipPath')
            .attr('id', 'clip')
            .append('SVG:rect')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('x', 0)
            .attr('y', 0);
        // axis group
        vis.xAxisG = vis.chart
            .append('g')
            .attr('class', 'axis x-axis')
        vis.yAxisG = vis.chart
            .append('g')
            .attr('class', 'axis y-axis');
        vis.xAxis = d3.axisBottom(vis.xScale);
        vis.yAxis = d3.axisLeft(vis.yScale).tickSizeOuter([0]);
        d3.select('#ctn1').append('div').attr('id', 'tooltip1');
    }

    updateVis() {
        let vis = this;
        // update scale domain
        vis.xScale.domain([0, d3.max(vis.trajectory, (d)=>(d3.sum(d.time)))]);
        //vis.xScale.domain([0, d3.max(vis.trajectory, (d) => d.trj.length)]);
        vis.yScale.domain(vis.trajectory.map((d) => d.id));
        vis.renderVis();
    }

    renderVis() {
        let vis = this;
        // axis
        vis.yAxisG.call(vis.yAxis);
        // add bars
        vis.bars = vis.chart.selectAll('.trj-bar')
            .data(vis.trajectory, (d) => d.id);
        vis.barsEnter = vis.bars
            .enter()
            .append('line')
            .attr('class', 'trj-bar')
            .attr('id', (d) => `trj-bar${d.id}`);
        vis.barsEnter
            .merge(vis.bars)
            .attr('x1', (d) => {return vis.xScale(d3.sum(d.time));})
            .attr('x2', (d) => vis.xScale(0))
            .attr('y1', (d) => vis.yScale(d.id))
            .attr('y2', (d) => vis.yScale(d.id))
            .attr('stroke', '#668fff')
            .attr('stroke-width', 10)
            .attr('stroke-opacity', 0.6)
            .on('mousemove', function(e, d) {
                d3.select(this).transition().duration(200).attr('stroke-opacity', 1);
                vis.config.callToolTip(e, d, vis);
            }).on('mouseout', function() {
                d3.select(this).transition().duration(200).attr('stroke-opacity', (d) => {
                    if(d3.select(this).classed('active'))
                        return 1;
                    else
                        return 0.6;
                });
                d3.select("#tooltip1").style("opacity", 0);
            }).on('click', function(e, d) {
                const isActive = d3.select(this).classed('active');
                let numSeltrj = 0;
                let pos = 100;
                vis.seltrj.forEach((t, idx) => {
                    if(t){
                        numSeltrj++;
                    }else{
                        if(idx < pos) pos = idx;
                    }
                })
                if(numSeltrj == 3 && !isActive){
                    return;
                }
                d3.select(this).classed('active', !isActive);
                if(!isActive) {
                    d3.select(this)
                        .attr('stroke-opacity', 1)
                        .attr('stroke', vis.sScale(pos));
                    vis.seltrj[pos] = d.id;
                    if(numSeltrj == 2){
                        d3.selectAll('.trj-bar').each((d) =>{
                            if(!vis.seltrj.includes(d.id)){
                                d3.select(`#trj-bar${d.id}`).attr('stroke', 'grey').attr('pointer-events', 'none');
                            }
                        });
                    }
                }else{
                    d3.select(this)
                        .attr('stroke-opacity', 0.6)
                        .attr('stroke', '#668fff');
                    vis.seltrj.forEach((t, idx) => {
                        if(t === d.id){
                            vis.seltrj[idx] = null;
                        }
                    })
                    d3.selectAll('.trj-bar').each((d) =>{
                        if(!vis.seltrj.includes(d.id)){
                            d3.select(`#trj-bar${d.id}`).attr('stroke', '#668fff').attr('pointer-events', 'auto');
                        }
                    });
                }
                vis.dispatcher.call('selTrj', e, vis.seltrj);
            });
    }
}