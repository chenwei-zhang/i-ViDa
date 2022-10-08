class Studio {

    constructor(_config, _data_trj){
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.width,
            containerHeight: _config.height
        }
        this.margin = _config.margin;
        this.trajectory = _data_trj;
        this.seltrj = [1, 2, 3];
        this.initVis();
    }

    initVis() {
        let vis = this;
        // area
        vis.width = vis.config.containerWidth - vis.margin.left - vis.margin.right;
        vis.height = vis.config.containerHeight - vis.margin.top - vis.margin.bottom;
        // yscale
        vis.yScale = d3.scaleLinear()
            .domain(d3.range(1, 100))
            .range([0, 20]);
        // svg of the vis
        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('id', 'menu-container')
            .attr('width', vis.config.containerWidth)
            .attr('height', 2010)
        // chart area
        vis.chart = vis.svg
            .append('g')
            .attr('id', 'menu-area')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`);
    }

    updateVis() {
        let vis = this;
        vis.renderVis();
    }

    renderVis() {
        let vis = this;
        var trjBtn = vis.chart.append('g')
            .attr('class', 'trj-btn')
            .selectAll('.trjbtn-rect')
            .data(vis.trajectory)
        var trjBtnEnter = trjBtn
            .enter()
            .append('g')
            .attr('class', 'trjbtn-group')
            .append('rect')
            .attr('class', 'trjbtn-rect')
            .attr('id', (d) => d.id);
        trjBtnEnter.merge(trjBtn)
            .attr('x', (d) => 0)
            .attr('y', (d) => vis.yScale(d.id))
            .attr('width', vis.width)
            .attr('height', 20)
            .attr('fill', 'white')
            .attr('stroke', 'black')
            .attr('cursor', 'pointer');
        d3.selectAll('.trjbtn-group')
            .append('text')
            .attr('x', (d) => 15)
            .attr('y', (d) => vis.yScale(d.id)+10)
            .attr("dy", ".35em")
            .text((d) => {return "Trajectory "+d.id})
            .attr('font-size', 15)
            .attr('cursor', 'pointer');
        d3.selectAll('.trjbtn-group').on('click', (event, d) => {console.log(d)})
    }
}