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
        this.sortby = 'byid';
        this.ordertime = Array(100);
        this.initVis();
    }

    initVis() {
        let vis = this;
        // area
        vis.width = vis.config.containerWidth - vis.margin.left - vis.margin.right;
        vis.height = vis.config.containerHeight - vis.margin.top - vis.margin.bottom;
        // xscale
        vis.xScale = d3.scalePow().exponent(0.5)
            .range([0, vis.width-60]);
        // yscale
        vis.yScale = d3.scaleBand()
            .range([0, vis.height]).padding(1);
        // selection trj category
        vis.sScale = d3.scaleOrdinal()
        .domain([2, 0, 1])
        .range(["#1f77b4","#2ca02c","#f0027f"]);
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
            .html(
                `<div>
                    <label> Sort by:
                    <input type='radio' name='sort' value='byid' checked> id
                    <input type='radio' name='sort' value='bytime'> time
                </div>`
            )
        d3.selectAll('input').on('change', function(e) {
            vis.sortby = this.value;
            if(vis.sortby == 'bytime'){
                d3.selectAll('.trj-bar')
                    .attr('x1', (d) => vis.xScale(0))
                    .attr('x2', (d) => {return vis.xScale(d3.sum(d.time));})
                    .transition().duration(500)
                    .attr('y2', (d) => vis.yScale(d.ranktime))
                    .attr('y1', (d) => vis.yScale(d.ranktime));
                d3.selectAll('.trj-star')
                    .transition().duration(500)
                    .attr('transform', (d) => `translate(${0}, ${vis.yScale(d.ranktime)})`);
                vis.yScale.domain(vis.ordertime);
                vis.yAxisG.transition().duration(500).call(vis.yAxis);
            }else if(vis.sortby == 'byid'){
                vis.yScale.domain(vis.trajectory.map((d) => d.id));
                d3.selectAll('.trj-bar')
                    .attr('x1', (d) => vis.xScale(0))
                    .attr('x2', (d) => {return vis.xScale(d3.sum(d.time));})
                    .transition().duration(500)
                    .attr('y2', (d) => vis.yScale(d.id))
                    .attr('y1', (d) => vis.yScale(d.id))
                d3.selectAll('.trj-star')
                    .transition().duration(500)
                    .attr('transform', (d) => `translate(${0}, ${vis.yScale(d.id)})`);
                vis.yAxisG.transition().duration(500).call(vis.yAxis);
            }
        });
        // axis group
        vis.xAxisG = vis.chart
            .append('g')
            .attr('class', 'axis x-axis')
        vis.yAxisG = vis.chart
            .append('g')
            .attr('class', 'axis y-axis')
            .attr('transform', `translate(${40}, 0)`);
        vis.xAxis = d3.axisBottom(vis.xScale);
        vis.yAxis = d3.axisLeft(vis.yScale).tickSizeOuter([0]);
        d3.select('#ctn1').append('div').attr('id', 'tooltip1');
    }

    updateVis() {
        let vis = this;
        vis.xScale.domain([0, d3.max(vis.trajectory, (d)=>(d.totaltime))]);
        vis.yScale.domain(vis.trajectory.map((d) => d.id));
        vis.trajectory.forEach((trj) => {
            vis.ordertime[trj.ranktime-1] = trj.id; 
        });
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
            .attr('stroke', '#668fff')
            .attr('stroke-width', 10)
            .attr('stroke-opacity', 0.6)
            .attr('transform', `translate(${40}, 0)`)
            .attr('x1', (d) => vis.xScale(0))
            .attr('y2', (d) => vis.yScale(d.id))
            .attr('y1', (d) => vis.yScale(d.id))
            .attr('x2', (d) => {return vis.xScale(d.totaltime);});
        vis.barsEnter.on('mousemove', function(e, d) {
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
                    d3.select(`#trj-star${d.id}`)
                        .attr('stroke', vis.sScale(pos))
                        .attr('stroke-width', 2);
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
                    d3.select(`#trj-star${d.id}`)
                        .attr('stroke', '#5a5a5a')
                        .attr('stroke-width', 0.1);
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
        // add symbols
        vis.stars = vis.chart.selectAll('.trj-star')
            .data(vis.trajectory, (d) => d.id);
        vis.starsEnter = vis.stars
            .enter()
            .append('path')
            .attr('d', d3.symbol().type(d3.symbolStar).size(100))
            .attr('fill', '#ffffff')
            .attr('stroke', '#5a5a5a')
            .attr('stroke-width', 0.1)
            .attr('class', 'trj-star')
            .attr('id', (d) => `trj-star${d.id}`)
            .attr('transform', (d) => `translate(${0}, ${vis.yScale(d.id)})`);
    }
}