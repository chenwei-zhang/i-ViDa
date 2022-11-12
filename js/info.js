class Info{

    constructor(_config, _allData, _data, _endpoint){
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.width,
            containerHeight: _config.height,
        }
        this.allData = _allData;
        this.data = _data;
        this.end = _endpoint;
        this.mode = 'empty';
        this.initVis();
    }

    initVis() {
        let vis = this;
        // area
        vis.width = vis.config.containerWidth;
        // color scale
        vis.cScale = d3.scaleLinear()
            .domain([d3.min(vis.allData, (d)=> d.energy), d3.max(vis.allData, (d)=> d.energy)])
            .range([0, 1]);
        // size scale
        vis.rScale = d3.scaleSqrt()
            .domain([d3.min(vis.allData, (d)=> d.time), d3.max(vis.allData, (d)=> d.time)])
            .range([4, 15]);
        d3.select(vis.config.parentElement)
            .append('h2')
            .attr('class', 'info-title')
            .style('color', '#5a5a5a')
        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('width', vis.width);
        vis.svg
            .append('line')
            .attr('x1', 0)
            .attr('x2', vis.width)
            .attr('y1', 0)
            .attr('y2', 0)
            .attr('fill', 'none')
            .attr('stroke', '#5a5a5a')
            .attr('stroke-width', 6)
            .style('stroke-dasharray', (10, 10));
    }

    updateVis() {
        let vis = this;
        d3.selectAll('.info-util').remove().exit();
        d3.selectAll('.info-box').remove().exit();
        if(vis.mode == 'empty'){
            vis.data = vis.end;
            vis.updateBin();
        }else if(vis.mode == 'bin'){
            vis.updateBin();
        }
    }

    updateBin(){
        let vis = this;
        vis.data = vis.data.sort((a,b) => a.energy-b.energy);
        if(vis.data.length > 20){
            vis.data = vis.data.slice(0, 20);
        }
        d3.selectAll('.info-title')
            .text(vis.mode =='empty'? 'Click a Bin to View its Info': `Top ${vis.data.length} Structure with Minimum Energy`);
        if(vis.mode == 'empty'){
            vis.svg
                .append('circle')
                .attr('class', 'info-util')
                .attr('cx', 75)
                .attr('cy', 75)
                .attr('r', 15)
                .attr('fill', 'none')
                .attr('stroke', '#5a5a5a')
                .attr('stroke-width', 3);
            vis.svg
                .append('circle')
                .attr('class', 'info-util')
                .attr('cx', 75)
                .attr('cy', 175)
                .attr('r', 15)
                .attr('fill', 'none')
                .attr('stroke', '#5a5a5a')
                .attr('stroke-width', 3);
            vis.svg
                .append('text')
                .attr('class', 'info-util')
                .attr('x', 75)
                .attr('y', 82)
                .text('I')
                .style('font-size', 20)
                .style('text-anchor', 'middle');
            vis.svg
                .append('text')
                .attr('class', 'info-util')
                .attr('x', 75)
                .attr('y', 182)
                .text('F')
                .style('font-size', 20)
                .style('text-anchor', 'middle');;
        }
        vis.svg
            .attr('height', vis.data.length*100+10);
        vis.rank = d3.rank(vis.data, (d) => d.energy);
        vis.data.forEach((d, i) => {
            d.rank = vis.rank[i]+1;
        });
        vis.renderBin();
    }

    renderBin() {
        let vis = this;
        vis.svg.append('line')
            .attr('class', 'info-util')
            .attr('x1', 100)
            .attr('x2', 100)
            .attr('y1', 3)
            .attr('y2', vis.data.length*100)
            .attr('fill', 'none')
            .attr('stroke', '#5a5a5a')
            .attr('stroke-width', 3)
            .style('stroke-dasharray', (10, 10));
        vis.box = vis.svg.selectAll('.info-box')
            .data(vis.data);
        vis.boxEnter = vis.box
            .enter()
            .append('g')
            .attr('class', 'info-box');
        vis.boxEnter
            .merge(vis.box)
            .append('line')
            .attr('id', (d) => d.rank)
            .attr('x1', 0)
            .attr('x2', vis.width)
            .attr('y1', (d) => d.rank*100)
            .attr('y2', (d) => d.rank*100)
            .attr('fill', 'none')
            .attr('stroke', '#5a5a5a')
            .attr('stroke-width', 3)
            .style('stroke-dasharray', (8, 8));
        vis.boxEnter
            .append('circle')
            .attr('cx', 50)
            .attr('cy', (d) => d.rank*100-50)
            .attr('r', (d) => vis.rScale(d.time))
            .attr('fill', (d) => d3.interpolateRainbow(vis.cScale(d.energy)))
            .attr('opacity', 0.5)
            .attr('strokeWidth', 1)
            .attr('stroke', '#5a5a5a');
        vis.boxEnter
            .append('text')
            .attr('x', 235)
            .attr('y', (d) => d.rank*100-70)
            .text((d) => `DP: ${d.dp}`)
            .style('font-size', 10)
            .style('text-align', 'center')
            .style('text-anchor', 'middle');
        vis.boxEnter
            .append('text')
            .attr('x', 235)
            .attr('y', (d) => d.rank*100-50)
            .text((d) => `Energy: ${d.energy}`)
            .style('font-size', 10)
            .style('text-align', 'center')
            .style('text-anchor', 'middle');
        vis.boxEnter
            .append('text')
            .attr('x', 235)
            .attr('y', (d) => d.rank*100-30)
            .text((d) => `Density: ${d.density.size}`)
            .style('font-size', 10)
            .style('text-align', 'center')
            .style('text-anchor', 'middle');
        vis.boxEnter
            .append('text')
            .attr('x', 50)
            .attr('y', (d) => d.rank*100-85)
            .text((d) => `ID: ${d.id}`)
            .style('font-size', 10)
            .style('text-align', 'center')
            .style('text-anchor', 'middle');
    }
}