var idleTimeout;
class DNAGraph {

    constructor(_config, _data_dna, _data_trj){
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.width,
            containerHeight: _config.height
        }
        this.margin = _config.margin;
        this.states = _data_dna;
        this.trajectory = _data_trj;
        this.Iid = 0;
        this.Fid = 169;
        this.initVis();
    }

    initVis() {
        let vis = this;
        // area
        vis.width = vis.config.containerWidth - vis.margin.left - vis.margin.right;
        vis.height = vis.config.containerHeight - vis.margin.top - vis.margin.bottom;
        
        // pos scale
        vis.scaleExtra = 1.1;
        vis.yScale = d3.scaleLinear()
            .domain([d3.min(vis.states, (d) => d.pca_y)*vis.scaleExtra, d3.max(vis.states, (d) => d.pca_y)*vis.scaleExtra])
            .range([vis.height, 0]);
        vis.xScale = d3.scaleLinear()
            .domain([d3.min(vis.states, (d) => d.pca_x)*vis.scaleExtra, d3.max(vis.states, (d) => d.pca_x)*vis.scaleExtra])
            .range([0, vis.width]);
        // color scale
        vis.cScale = d3.scaleLinear()
            .domain([d3.min(vis.states, (d)=> d.energy), d3.max(vis.states, (d)=> d.energy)])
            .range([0, 1]);
        // size scale
        vis.rScale = d3.scaleSqrt()
            .domain([d3.min(vis.states, (d)=> d.time), d3.max(vis.states, (d)=> d.time)])
            .range([2, 15]);
        // time scale
        vis.tScale = d3.scaleLinear()
            .domain([d3.min(vis.states, (d)=> d.time), d3.max(vis.states, (d)=> d.time)])
            .range([0, 1]);
        
            // svg of the vis
        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('id', 'scatter-svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
        // chart
        vis.chart = vis.svg
            .append('g')
            .attr('id', 'scatter-chart')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`);
        vis.chart.append('rect')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('fill', '#e5ecf6')
            .attr('opacity', 0.6);
        
        // axis group
        vis.xAxis = d3.axisBottom(vis.xScale).tickSize(-vis.height);
        vis.yAxis = d3.axisLeft(vis.yScale).tickSize(-vis.width);
        vis.xAxisG = vis.chart
            .append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0, ${vis.height})`)
        vis.yAxisG = vis.chart
            .append('g')
            .attr('class', 'axis y-axis');
        // clippath
        vis.svg.append('defs').append('SVG:clipPath')
            .attr('id', 'clip')
            .append('SVG:rect')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('x', 0)
            .attr('y', 0);

        // brush
        vis.brush = d3.brush()
            .extent([[0,0], [vis.width,vis.height]])
            .on('start', function(event){
                d3.select('.brush').raise();
            })
            .on('end', (event) => {vis.updateChart(event)});
        vis.chart.append('g')
            .attr('class', 'brush')
            .call(vis.brush);
        
    }

    updateVis() {
        let vis = this;

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        // axis
        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
        
        // draw nodes by states
        var nodes = vis.chart.append('g').attr('class', 'node-container').attr('clip-path', 'url(#clip)')
            .selectAll('.node')
            .data(vis.states, (d)=> d.id);
        var nodesEnter = nodes
            .enter().append('g')
            .attr('class', 'node-group')
            .append('circle')
            .attr('class', 'node')
            .attr('id', (d) => d.id);
        // nodes encoding state info
        nodesEnter.merge(nodes)
            .attr('cx', (d) => vis.xScale(d.pca_x))
            .attr('cy', (d) => vis.yScale(d.pca_y))
            .attr('r', (d) => {
                if(d.id == vis.Iid || d.id == vis.Fid){
                    return 10;
                } else {

                    return vis.rScale(d.time);
                }
            }).attr('fill', (d) => {
                if(d.id == vis.Iid || d.id == vis.Fid){
                    return 'green';
                } else {
                    return d3.interpolatePlasma(vis.cScale(d.energy));
                }
            }).attr('stroke', 'white')
            .attr('stroke-width', '0.5px')
            .on('mouseover', (e, d) => {
                console.log('Show tooltip of DNA id '+d.id);
            });
        // endpoints hover front
        vis.INode = d3.selectAll('.node-group').filter((d) => d.id === vis.Iid).classed('endpoint', true);
        vis.FNode = d3.selectAll('.node-group').filter((d) => d.id === vis.Fid).classed('endpoint', true);
        vis.INode.append('text')
            .attr('class', 'label')
            .text('I')
            .attr('font-size', '20px')
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('transform', (d) => `translate(${vis.xScale(d.pca_x)}, ${vis.yScale(d.pca_y)})`);
        vis.FNode.append('text')
            .attr('class', 'label')
            .text('F')
            .attr('font-size', '20px')
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('transform', (d) => `translate(${vis.xScale(d.pca_x)}, ${vis.yScale(d.pca_y)})`);
        vis.chart.selectAll('.node-group.endpoint').raise();
        // exit
        nodes.exit().remove();
        nodesEnter.exit().remove();

        // draw a path
        vis.trajectory.forEach((t) => {
            var connection = [];
            for(let i = 0; i < t.trj.length-1; i += 1){
                const curr = t.trj[i];
                const next = t.trj[i+1];
                console.log(curr.dp);
                connection.push({x1: curr.pca_x, y1: curr.pca_y, x2: next.pca_x, y2: next.pca_y, time: t.time[i]})
            }
            var particles = vis.chart.append('g').attr('class', 'trj-container').attr('clip-path', 'url(#clip)')
                .selectAll('.particle')
                .data(connection);
            var particlesEnter = particles
                .enter().append('g')
                .attr('class', 'trj-group')
                .append('rect')
                .attr('class', 'particle');
            // paths encoding trj info
            particlesEnter.merge(particles)
                .attr('x', (d) => vis.xScale(d.x1))
                .attr('y', (d) => vis.yScale(d.y1))
                .attr('width', 4)
                .attr('height', 4)
                .attr('fill', (d) => {return d3.interpolateCividis(vis.tScale(d.time));})
                .attr('opacity', 0)
        });
        var paths = vis.chart.append('g').attr('class', 'path-container').attr('clip-path', 'url(#clip)')
                .selectAll('.trj')
                .data(vis.trajectory, (d) => d.id);
            var pathsEnter = paths
                .enter().append('g')
                .attr('class', 'path-group')
                .append('path')
                .attr('class', 'trj')
                .attr('id', (d) => d.id);
            // paths encoding trj info
            pathsEnter.merge(paths)
                .attr('d', (d) => {
                    const indices = d.trj;
                    var pos = [];
                    indices.forEach((i, idx) => {
                        pos.push({x: i.pca_x, y: i.pca_y});
                    })
                    var gen = d3.line()
                        .x((d) => vis.xScale(d.x))
                        .y((d) => vis.yScale(d.y))
                        .curve(d3.curveLinear);
                    return gen(pos);
                }).attr('fill', 'none')
                .attr('stroke', (d) => {const color = ['green', 'blue']; return d.id==57? color[0]:color[1];})
                .attr('stroke-width', 2)
                .attr('opacity', 0.1)
                //.attr('display', 'none');
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
            vis.xScale.domain([d3.min(vis.states, (d)=> d.pca_x)*vis.scaleExtra, d3.max(vis.states, (d)=> d.pca_x)*vis.scaleExtra]);
            vis.yScale.domain([d3.min(vis.states, (d)=> d.pca_y)*vis.scaleExtra, d3.max(vis.states, (d)=> d.pca_y)*vis.scaleExtra]);
        }else{
            vis.xScale.domain([vis.xScale.invert(extent[0][0]), vis.xScale.invert(extent[1][0])]);
            vis.yScale.domain([vis.yScale.invert(extent[1][1]), vis.yScale.invert(extent[0][1])]);
            vis.chart.select(".brush").call(vis.brush.move, null);
        }

        vis.xAxisG.call(d3.axisBottom(vis.xScale).tickSize(-vis.height));
        vis.yAxisG.call(d3.axisLeft(vis.yScale).tickSize(-vis.width));
        vis.chart.selectAll('.particle').attr('opacity', 0);
        vis.chart.selectAll('.node')
            .attr('cx', function (d) { return vis.xScale(d.pca_x); } )
            .attr('cy', function (d) { return vis.yScale(d.pca_y); } )
        vis.chart.selectAll('.trj')
            .attr('d', (d) => {
                const indices = d.trj;
                var pos = [];
                indices.forEach((i) => {
                    pos.push({x: i.pca_x, y: i.pca_y});
                })
                var gen = d3.line()
                    .x((d) => vis.xScale(d.x))
                    .y((d) => vis.yScale(d.y))
                    .curve(d3.curveLinear);
                return gen(pos);
            });
        vis.chart.selectAll('.label')
            .attr('transform', (d)=>{return `translate(${vis.xScale(d.pca_x)}, ${vis.yScale(d.pca_y)})`});
        vis.chart.selectAll('.node-container').raise();
        vis.chart.selectAll('.path-container').raise();
        vis.chart.selectAll('.trj-container').raise();
    }

}