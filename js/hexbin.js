class Hexbin{

    constructor(_config, _data_dna, _data_trj, _dispatcher){
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.width,
            containerHeight: _config.height,
            callToolTip: _config.callToolTip,
        }
        this.margin = _config.margin;
        this.trajectory = _data_trj;
        this.states = _data_dna;
        this.dispatcher = _dispatcher;
        this.initVis();
    }

    initVis() {
        let vis = this;
        // area
        vis.width = vis.config.containerWidth - vis.margin.left - vis.margin.right;
        vis.height = vis.config.containerHeight - vis.margin.top - vis.margin.bottom;
        // scale
        vis.scaleExtra = 1.1;
        vis.yScale = d3.scaleLinear()
            .domain([d3.min(vis.states, (d) => d.pca_y)*vis.scaleExtra, d3.max(vis.states, (d) => d.pca_y)*vis.scaleExtra])
            .range([vis.height, 0]);
        vis.xScale = d3.scaleLinear()
            .domain([d3.min(vis.states, (d) => d.pca_x)*vis.scaleExtra, d3.max(vis.states, (d) => d.pca_x)*vis.scaleExtra])
            .range([0, vis.width]);
        vis.cScale = d3.scalePow().exponent(0.6)
            .range([0.1, 1]);
        // svg
        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('id', 'hexbin-svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .append('g')
            .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`);
        // axis group
        vis.xAxis = d3.axisBottom(vis.xScale).ticks(3).tickSize(-vis.height);
        vis.yAxis = d3.axisLeft(vis.yScale).ticks(3).tickSize(-vis.width);
        vis.xAxisG = vis.svg
            .append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0, ${vis.height})`);
        vis.yAxisG = vis.svg
            .append('g')
            .attr('class', 'axis y-axis');
        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
        d3.select(vis.config.parentElement).append('div').attr('id', 'tooltip3');
    }

    updateVis() {
        let vis = this;
        vis.svg
            .append('text')
            .text('I')
            .attr('x', vis.xScale(vis.states[0].pca_x)-3)
            .attr('y', vis.yScale(vis.states[0].pca_y)-3)
            .style('font-size', 10)
            .style('text-anchor', 'middle');;
        vis.svg
            .append('text')
            .text('F')
            .attr('x', vis.xScale(vis.states[291].pca_x)-1)
            .attr('y', vis.yScale(vis.states[291].pca_y)+10)
            .style('font-size', 10)
            .style('text-anchor', 'middle');;
        vis.hex = d3.hexbin()
            .x((d) => vis.xScale(d.pca_x))
            .y((d) => vis.yScale(d.pca_y))
            .radius(8)
            .extent([[vis.margin.left, vis.margin.top], 
                [vis.width - vis.margin.right, vis.height - vis.margin.bottom]]);
        vis.bin = vis.hex(vis.states);
        vis.cScale.domain([d3.min(vis.bin, (b)=>b.length), d3.max(vis.bin, (b)=>b.length)])
        vis.hb = vis.svg.selectAll('.hexbin-bin')
            .data(vis.bin);

        vis.canvaslgd = d3.select(vis.config.parentElement)
            .append('canvas')
            .attr('class', 'overview-canvas')
            .attr('id', 'overview-canvas-lgd')
            .attr('width', 70)
            .attr('height', 135)
            .style('transform', `translate(${-93}px, ${80}px)`);
        vis.contextlgd = vis.canvaslgd.node().getContext('2d');
        for(let i = 0; i < 110; i++){
            const a = vis.cScale((110-i)/110*d3.min(vis.bin, (b)=>b.length)+i/110*d3.max(vis.bin, (b)=>b.length));
            vis.contextlgd.fillStyle = `rgb(102, 143, 255, ${a})`;
            vis.contextlgd.fillRect(60, i+20, 10, 1);
        }
        vis.contextlgd.fillStyle = `rgb(91, 91, 91)`;
        vis.contextlgd.fillRect(38, 20, 32, 1);
        vis.contextlgd.fillRect(38, 130, 32, 1);
        vis.contextlgd.font = '12px American Typewriter';
        vis.contextlgd.fillText('count', 38, 16);
        vis.contextlgd.font = '8px American Typewriter';
        vis.contextlgd.fillText(d3.min(vis.bin, (b)=>b.length), 38, 30)
        vis.contextlgd.fillText(d3.max(vis.bin, (b)=>b.length), 38, 128)
        vis.renderVis();
    }

    renderVis() {
        let vis = this;
        vis.hbEnter = vis.hb
            .enter()
            .append('path')
            .attr('class', 'hexbin-bin');
        vis.hbEnter
            .merge(vis.hb)
            .attr('d', vis.hex.hexagon())
            .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
            .attr('fill', '#668fff')
            .attr('fill-opacity', (d) => vis.cScale(d.length))
            .attr('stroke', '#5a5a5a')
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.3)
            .on('mousemove', function(e, d) {
                d3.select('#tooltip3').style('display', 'inline-block');
                vis.config.callToolTip(e, d, vis);
                d3.select(this).attr('stroke-width', 3).attr('stroke-opacity', 1);
            }).on('mouseout', function() {
                d3.select('#tooltip3').style('display', 'none');
                d3.selectAll('.hexbin-bin').attr('stroke-width', 1).attr('stroke-opacity', 0.3);
            });
    }

    showSelBin(selectedBin, sScale) {
        let vis = this;
        const bins = [];
        selectedBin.forEach((selbin) => {
            selbin.data.forEach((b) => {
                bins.push(b);
            })
        });
        vis.selBin = vis.hex(bins);
        vis.sb = vis.svg.selectAll('.hexbin-sel')
            .data(vis.selBin);
        vis.sbEnter = vis.sb
            .enter()
            .append('path')
            .attr('class', 'hexbin-sel');
        vis.sbEnter
            .merge(vis.sb)
            .attr('d', vis.hex.hexagon())
            .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
            .attr('fill', sScale)
            .attr('fill-opacity', 0)
            .attr('stroke', sScale)
            .attr('stroke-width', 3)
            .attr('cursor', 'pointer')
            .on('click', function(e, d) {
                const active = d3.select(this).classed('sb');
                if(!active){
                    vis.svg.selectAll('.hexbin-sel').attr('fill-opacity', 0);
                    d3.select(this).attr('fill-opacity', 1).classed('sb', true);
                    d = [...new Set(d)];
                    vis.dispatcher.call('selHex', e, d);
                }else{
                    vis.svg.selectAll('.hexbin-sel').attr('fill-opacity', 0);
                    d3.select(this).classed('sb', false);
                    vis.dispatcher.call('selHex', e, null);
                }
            });
    }
}