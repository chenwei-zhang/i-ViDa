var idleTimeout;
class Overview {

    constructor(_config, _data_dna, _data_trj){
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.width,
            containerHeight: _config.height
        }
        this.margin = _config.margin;
        this.states = _data_dna;
        this.trajectory = _data_trj;
        this.seltrj = [1, 2, 3];
        this.seldna = null;
        this.iID = -1;
        this.fID = -1;
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
            .range([5, 20]);

        // selection trj category
        vis.sScale = d3.scaleOrdinal(d3.schemeDark2);
        // svg of the vis
        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('id', 'overview-svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);
        // canvas-nodes
        vis.canvas = d3.select(vis.config.parentElement)
            .append('canvas')
            .attr('id', 'overview-canvas-nodes')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .style('transform', `translate(${vis.margin.left}px, ${vis.margin.top}px)`);
        vis.context = vis.canvas.node().getContext('2d');
        // canvas-selection
        vis.canvasSel = d3.select(vis.config.parentElement)
            .append('canvas')
            .attr('id', 'overview-canvas-sel')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .style('transform', `translate(${vis.margin.left}px, ${vis.margin.top}px)`);
        vis.contextSel = vis.canvasSel.node().getContext('2d');
        // canvas-trj
        vis.canvasTrj = d3.select(vis.config.parentElement)
            .append('canvas')
            .attr('id', 'overview-canvas-trj')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .style('transform', `translate(${vis.margin.left}px, ${vis.margin.top}px)`);
        vis.contextTrj = vis.canvasTrj.node().getContext('2d');
        // axis group
        vis.xAxis = d3.axisBottom(vis.xScale).tickSize(-vis.height);
        vis.yAxis = d3.axisLeft(vis.yScale).tickSize(-vis.width);
        vis.xAxisG = vis.svg
            .append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0, ${vis.height})`)
        vis.yAxisG = vis.svg
            .append('g')
            .attr('class', 'axis y-axis');
        
        // overlay
        vis.overlay = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('id', 'overview-overlay')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);
        // brush
        vis.brush = d3.brush()
            .extent([[0,0], [vis.width,vis.height]])
            .on('start', function(event){
                d3.select('.brush').raise();
            })
            .on('end', (event) => {vis.updateChart(event)});
        vis.overlay.append('g')
            .attr('class', 'brush')
            .call(vis.brush)
        vis.overlay.on('click', (event) => {vis.displayTooltipStates(event)});
        // quadtree
        vis.quadTree = d3.quadtree()
            .x((d) => d.pca_x)
            .y((d) => d.pca_y)
        vis.states.forEach((i) => {
            vis.quadTree.add(i)
        })
    }

    updateVis() {
        let vis = this;
        vis.iID = vis.trajectory[0].trj[0].id;
        vis.fID = vis.trajectory[0].trj[vis.trajectory[0].trj.length-1].id;
        vis.renderVis();
    }

    renderVis() {
        let vis = this;
        // axis
        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
        // draw nodes
        vis.drawStates();
        // draw trjs
        vis.drawTrajectory();
    }

    drawStates() {
        let vis = this;
        vis.context.clearRect(0, 0, vis.width, vis.height);
        // draw background
        vis.context.fillStyle = 'rgba(229, 236, 246, 0.3)';
        vis.context.fillRect(0, 0, vis.width, vis.height);
        // draw all points
        vis.states.forEach((dna) => {
            vis.drawNode(dna);
        });
        vis.drawNode(vis.states[vis.iID]);
        vis.drawNode(vis.states[vis.fID]);

    }

    drawNode(dna) {
        let vis = this;
        var cx = vis.xScale(dna.pca_x);
        var cy = vis.yScale(dna.pca_y);
        var cr = 0;
        if(dna.id != vis.iID && dna.id != vis.fID)
            cr = vis.rScale(dna.time);
        else
            cr = 20;
        vis.context.beginPath();
        vis.context.arc(cx, cy, cr, 0, 2*Math.PI);
        var cf = null;
        if(dna.id != vis.iID && dna.id != vis.fID){
            cf = d3.rgb(d3.interpolatePlasma(vis.cScale(dna.energy)));
            cf.opacity = 0.8;
        }else{
            cf = d3.rgb('green');
            cf.opacity = 1.0;
        }
        vis.context.fillStyle = cf;
        vis.context.fill();
        vis.context.strokeStyle = 'white';
        vis.context.lineWidth = 0.5;
        vis.context.stroke();
    }

    drawTrajectory() {
        let vis = this;
        vis.contextTrj.clearRect(0, 0, vis.width, vis.height);
        // draw selected
        vis.seltrj.forEach((id, idx) => {
            if(id >= 1 && id <= 100){
                const trj = vis.trajectory[id];
                vis.drawTrj(trj, idx);
            }
        });
    }

    drawTrj(trj, idx) {
        let vis = this;
        var pos = [];
        trj.trj.forEach((i, idx) => {
            pos.push({x: i.pca_x, y: i.pca_y});
        });
        var gen = d3.line()
            .x((d) => vis.xScale(d.x))
            .y((d) => vis.yScale(d.y))
            .curve(d3.curveLinear);
        gen.context(vis.contextTrj);
        vis.contextTrj.beginPath();
        gen(pos);
        vis.contextTrj.strokeStyle = vis.sScale(idx);
        vis.contextTrj.lineWidth = 2;
        vis.contextTrj.stroke();
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
            vis.overlay.select(".brush").call(vis.brush.move, null);
        }
        vis.drawTrajectory();
        vis.drawSelection(vis.seldna);
        vis.drawStates();
        vis.xAxisG.call(d3.axisBottom(vis.xScale).tickSize(-vis.height));
        vis.yAxisG.call(d3.axisLeft(vis.yScale).tickSize(-vis.width));
    }

    displayTooltipStates(event) {
        let vis = this;
        var mouse = d3.pointer(event);
        var xPos = vis.xScale.invert(mouse[0]);
        var yPos = vis.yScale.invert(mouse[1]);
        var closest = vis.quadTree.find(xPos, yPos);
        var dX = vis.xScale(closest.pca_x);
        var dY = vis.yScale(closest.pca_y);
        var dist = Math.sqrt(((mouse[0]-dX)**2+(mouse[1]-dY)**2));
        if(dist < vis.rScale(closest.time)){
            if(!vis.seldna || (vis.seldna && vis.seldna.id != closest.id)){
                vis.seldna = closest;
                vis.drawSelection(closest);
            }else{
                vis.contextSel.clearRect(0, 0, vis.width, vis.height);
            }
        }else{
            vis.seldna = null;
            vis.contextSel.clearRect(0, 0, vis.width, vis.height);
        }
    }

    drawSelection(sel) {
        if(!sel) return;
        let vis = this;
        console.log(sel);
        vis.contextSel.clearRect(0, 0, vis.width, vis.height);
        vis.contextSel.fillStyle = 'rgba(255, 0, 0, 1)';
        var cx = vis.xScale(sel.pca_x);
        var cy = vis.yScale(sel.pca_y);
        var cr = vis.rScale(sel.time);
        vis.contextSel.beginPath();
        vis.contextSel.arc(cx, cy, cr, 0, 2*Math.PI);
        vis.contextSel.fill();
        vis.contextSel.strokeStyle = 'white';
        vis.contextSel.lineWidth = 1;
        vis.contextSel.stroke();
    }

}