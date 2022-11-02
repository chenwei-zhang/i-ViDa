var idleTimeout;
class Overview {

    constructor(_config, _data_dna, _data_trj){
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.width,
            containerHeight: _config.height,
            callToolTip: _config.callToolTip,
        }
        this.hull = [39719, 22692, 7835,7837, 15452, 10138, 19971,
                     17896, 29072, 11060, 5027, 289, 288, 290, 15131, 19245, 39719];
        this.margin = _config.margin;
        this.states = _data_dna;
        this.trajectory = _data_trj;
        this.seltrj = [];
        this.seldna = [];
        this.iID = -1;
        this.fID = -1;
        this.k = 1;
        this.initVis();
    }

    initVis() {
        let vis = this;
        vis.iID = vis.trajectory[0].trj[0].id;
        vis.fID = vis.trajectory[0].trj[vis.trajectory[0].trj.length-1].id;
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
            .range([4, 15]);
        // opacity scale
        vis.oScale = d3.scalePow().exponent(0.3)
            .domain([150, 150000])
            .range([1, 0.4]);

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
            .attr('class', 'overview-canvas')
            .attr('id', 'overview-canvas-nodes')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .style('transform', `translate(${vis.margin.left}px, ${vis.margin.top}px)`);
        vis.context = vis.canvas.node().getContext('2d');
        // canvas-selection
        vis.canvasSel = d3.select(vis.config.parentElement)
            .append('canvas')
            .attr('class', 'overview-canvas')
            .attr('id', 'overview-canvas-sel')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .style('transform', `translate(${vis.margin.left}px, ${vis.margin.top}px)`);
        vis.contextSel = vis.canvasSel.node().getContext('2d');
        // canvas-trj
        vis.canvasTrj = d3.select(vis.config.parentElement)
            .append('canvas')
            .attr('class', 'overview-canvas')
            .attr('id', 'overview-canvas-trj')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .style('transform', `translate(${vis.margin.left}px, ${vis.margin.top}px)`);
        vis.contextTrj = vis.canvasTrj.node().getContext('2d');
        // canvas-region
        vis.canvasRegion = d3.select(vis.config.parentElement)
            .append('canvas')
            .attr('class', 'overview-canvas')
            .attr('id', 'overview-canvas-hull')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .style('transform', `translate(${vis.margin.left}px, ${vis.margin.top}px)`);
        vis.contextRegion = vis.canvasRegion.node().getContext('2d');
        // canvas-Voronoi
        vis.canvasVor = d3.select(vis.config.parentElement)
            .append('canvas')
            .attr('class', 'overview-canvas')
            .attr('id', 'overview-canvas-vor')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .style('transform', `translate(${vis.margin.left}px, ${vis.margin.top}px)`);
        vis.contextVor = vis.canvasVor.node().getContext('2d');
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
            .attr('id', 'overview-overlay-area')
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
        });
        // slider for density filter
        vis.filterk = d3.sliderBottom()
            .min(5).max(50).step(1)
            .width(300)
            .tickPadding(-10)
            .default(5)
            .ticks(10)
            .fill('#668fff')
            .handle(d3.symbol().type(d3.symbolCircle).size(100))
            .on('onchange', (v) => {
                vis.k = v;
                vis.drawStates();
                vis.drawTrajectory();
        });
        d3.select('body').on('keydown', (e) => {
            if(e.keyCode == 82){
                vis.k = 1;
                vis.drawStates();
                vis.drawTrajectory();
            }
        });
        vis.filterkG = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('id', 'overview-slider')
            .attr('width', 400)
            .attr('height', 75)
            .append('g')
            .attr('transform', `translate(${vis.margin.left+20}, ${vis.margin.top+20})`)
            .call(vis.filterk);
        d3.selectAll('.parameter-value').attr('font-family', 'American Typewriter').attr('fill', '#5a5a5a');
        // add tooltip
        d3.select(vis.config.parentElement).append('div').attr('id', 'tooltip2');
        vis.config.callToolTip(null, vis.states[vis.iID], vis);
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
        // draw hull
        vis.drawRegion();
        // draw Voronoi
        vis.drawVoronoi();
        // draw nodes
        vis.drawStates();
        // draw trjs
        vis.drawTrajectory();
    }

    drawRegion() {
        let vis = this;
        vis.contextRegion.clearRect(0, 0, vis.width, vis.height);
        var hull = [];
        vis.hull.forEach((h) => hull.push({x: vis.states[h].pca_x, y: vis.states[h].pca_y}));
        var gen = d3.line()
            .x((d) => vis.xScale(d.x))
            .y((d) => vis.yScale(d.y))
            .curve(d3.curveLinear)
        gen.context(vis.contextRegion);
        vis.contextRegion.beginPath();
        gen(hull);
        var cf = 'grey';
        vis.contextRegion.strokeStyle = cf;
        vis.contextRegion.setLineDash([10, 5]);
        vis.contextRegion.lineWidth = 3;
        vis.contextRegion.stroke();
    }

    drawVoronoi() {
        let vis = this;
        var cf = 'grey';
        vis.contextVor.strokeStyle = cf;
        vis.contextVor.setLineDash([10, 5]);
        vis.contextVor.lineWidth = 3;
        vis.contextVor.clearRect(0, 0, vis.width, vis.height);
        var ridge = [{x: 1.82882116, y:1.80069572}, {x: 2.60314502, y:1.9296819}];
        var endpoint = [{x: -4.411104455607263, y: 5.011169997810457, r: 0}, 
                        {x: -3.1943716580989547, y: -6.263976988353363, r: 0},
                        {x: 8.600064309381615, y: 12.231706127208183, r: 1},
                        {x: 6.17185900905939, y: -1.686892561319461, r: 1}];
        var gen = d3.line()
            .x((d) => vis.xScale(d.x))
            .y((d) => vis.yScale(d.y))
            .curve(d3.curveLinear)
        gen.context(vis.contextVor);
        vis.contextVor.beginPath();
        gen(ridge);
        vis.contextVor.stroke();
        vis.contextVor.closePath();
        endpoint.forEach((e) => {
            vis.contextVor.beginPath();
            var seg = [ridge[e.r], {x: e.x, y: e.y}];
            gen(seg);
            vis.contextVor.stroke();
            vis.contextVor.closePath();
        });
    }


    drawStates() {
        let vis = this;
        vis.context.clearRect(0, 0, vis.width, vis.height);
        // draw background
        vis.context.fillStyle = 'rgba(229, 236, 246, 0.3)';
        vis.context.fillRect(0, 0, vis.width, vis.height);
        // draw all points
        vis.states.filter((s) => s.density.size >= vis.k).forEach((dna) => {
            if(dna.id != vis.iID && dna.id != vis.fID)
                vis.drawNode(dna);
        });
        vis.drawNode(vis.states[vis.iID]);
        vis.drawNode(vis.states[vis.fID]);
    }

    drawNode(dna) {
        let vis = this;
        var cx = vis.xScale(dna.pca_x);
        var cy = vis.yScale(dna.pca_y);
        var cr = null;
        if(dna.id != vis.iID && dna.id != vis.fID){
            cr = vis.rScale(dna.time);
        }else{
            cr = 15;
        }
        vis.context.strokeStyle = 'white';
        vis.context.lineWidth = 0.5;
        vis.context.beginPath();
        vis.context.arc(cx, cy, cr, 0, 2*Math.PI);
        var cf = null;
        if(dna.id != vis.iID && dna.id != vis.fID){
            cf = d3.rgb(d3.interpolateRainbow(vis.cScale(dna.energy)));
            cf.opacity = 0.6;
        }else{
            cf = d3.rgb('green');
            cf.opacity = 1.0;
        }
        vis.context.fillStyle = cf;
        vis.context.fill();
        vis.context.stroke();
    }

    drawTrajectory() {
        let vis = this;
        vis.contextTrj.clearRect(0, 0, vis.width, vis.height);
        // draw selected
        vis.seltrj.forEach((id, idx) => {
            if(id >= 1 && id <= 100){
                const trj = vis.trajectory[id-1];
                vis.drawTrj(trj, idx);
            }
        });
    }

    drawTrj(trj, idx) {
        let vis = this;
        var pos = [];
        trj.trj.forEach((i, idx) => {
            if(trj.trj.length >= 3000){
                if(idx % Math.floor(trj.trj.length/3000) == 0 || (idx <= trj.trj.length-1&&idx >= trj.trj.length-20)){
                    if(i.density.size > vis.k)
                        pos.push({x: i.pca_x, y: i.pca_y});
                }
            }else{
                if(i.density.size > vis.k)
                    pos.push({x: i.pca_x, y: i.pca_y});
            }
        });
        var gen = d3.line()
            .x((d) => vis.xScale(d.x))
            .y((d) => vis.yScale(d.y))
            .curve(d3.curveLinear);
        gen.context(vis.contextTrj);
        vis.contextTrj.beginPath();
        gen(pos);
        var cf = d3.rgb(vis.sScale(idx));
        cf.opacity = vis.oScale(trj.trj.length);
        vis.contextTrj.strokeStyle = cf;
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
        vis.drawRegion();
        vis.drawVoronoi();
        vis.drawTrajectory();
        vis.drawStates();
        vis.drawSelection(vis.seldna);
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
        if((dist < vis.rScale(closest.time)+10 && closest.density.size >= vis.k) 
        || ((closest.id==vis.fID||closest.id==vis.iID) && (dist < 15))){
            if(vis.seldna.lenngth == 0 || (!vis.seldna.includes(closest))){
                vis.seldna.push(closest);
                vis.drawSelection(vis.seldna);
            }else{
                vis.seldna = vis.seldna.filter((v) => {return v.id != closest.id});
                vis.drawSelection(vis.seldna);
            }
        }else{
            vis.seldna = [];
            vis.contextSel.clearRect(0, 0, vis.width, vis.height);
            d3.selectAll(`.trj-star`).attr('fill', '#ffffff');
        }
        var tooltipdna = vis.seldna.length==0? vis.states[vis.iID]:vis.seldna[vis.seldna.length-1];
        vis.config.callToolTip(event, tooltipdna, vis);
    }

    drawSelection(sel) {
        let vis = this;
        if(sel.length == 0) {
            vis.contextSel.clearRect(0, 0, vis.width, vis.height);
            return;
        }
        vis.contextSel.clearRect(0, 0, vis.width, vis.height);
        vis.contextSel.fillStyle = d3.rgb('#d03830');
        d3.selectAll(`.trj-star`).attr('fill', '#ffffff');
        sel.forEach((s, i) => {
            var cx = vis.xScale(s.pca_x);
            var cy = vis.yScale(s.pca_y);
            var cr = (s.id == vis.iID||s.id == vis.fID)? 15:vis.rScale(s.time);
            vis.contextSel.beginPath();
            vis.contextSel.arc(cx, cy, cr, 0, 2*Math.PI);
            vis.contextSel.fill();
            vis.contextSel.strokeStyle = 'white';
            vis.contextSel.lineWidth = 1;
            vis.contextSel.stroke();
            s.density.forEach((t) => {
                if(i == sel.length-1){
                    d3.select(`#trj-star${t}`).attr('fill', '#d03830');
                }else{
                    d3.select(`#trj-star${t}`).attr('fill', '#f7d58f');
                }
            })
        });
    }

    computeIntersection(x1, x2, x3, x4, y1, y2, y3, y4){
        return {x: ((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4)),
        y: ((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4))};
    }

}