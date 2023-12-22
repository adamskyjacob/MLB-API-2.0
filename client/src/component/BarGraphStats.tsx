import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import StatData from '../Models/StatData'
import { convertStatName } from './BarGraphStatsDistributor';

function downloadSvgAsPng(svgElement: SVGElement, filename: string): void {
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();

    img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Unable to get 2D context for canvas');
        }

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');

        link.href = dataURL;
        link.download = filename;
        link.click();
    };

    img.src = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svgString);
}

export default function BarGraphStats(props: { data: StatData, max: number }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const margin = { top: 40, right: 20, bottom: 150, left: 50 };
    const width = window.innerWidth - margin.left - margin.right;
    const height = window.innerHeight - margin.top - margin.bottom;
    const { data, max } = props;

    useEffect(() => {
        const svg = d3.select(svgRef.current);

        const labels = data.rounds.map((round) => round.round);
        const statData = data.rounds.map((round) => round.percent * 100);

        console.log(labels)

        // Set up the scales
        const xScale = d3.scaleBand()
            .domain(labels)
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, max])
            .range([height, 0]);

        svg.selectAll("*").remove();

        svg.append('rect')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('fill', 'white');

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '1.5em')
            .style('font-weight', '600')
            .style('text-decoration', 'underline')
            .text(`${convertStatName(data.statName)} Statistics`);

        svg.append('g')
            .attr('transform', `translate(${margin.left}, ${height + margin.top})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('font-size', '1.5em')
            .attr("transform", "rotate(-90) translate(-10, -17.5)")
            .style('font-weight', '600')
            .style("text-anchor", "end")
            .attr('dy', '1em');

        svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
            .style('font-size', '.75em')
            .style('font-weight', '600')
            .call(d3.axisLeft(yScale).ticks(max / 2).scale(yScale));

        svg.selectAll(".bar")
            .data(statData)
            .enter()
            .append("rect")
            .attr("x", (_, i) => (xScale(labels[i]) || 0) + margin.left)
            .attr("y", d => height + margin.top)
            .attr("width", xScale.bandwidth())
            .attr("height", 50)
            .attr("fill", "transparent")
            .on("mouseover", function (event, d) {
                const xPos = event.pageX + 20;
                const yPos = event.pageY + 20;

                d3.select(this).attr("fill", "rgba(0,0,0,.5)");

                d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("position", "absolute")
                    .style("left", xPos + "px")
                    .style("top", yPos + "px")
                    .style("background-color", "white")
                    .style("border", "1px solid black")
                    .style("padding", "5px")
                    .html(`Value: ${d.toFixed(3)}%`);
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", "transparent");
                d3.select(".tooltip").remove();
            });

        svg.selectAll(".bar")
            .data(statData)
            .enter()
            .append("rect")
            .attr("x", (_, i) => (xScale(labels[i]) || 0) + margin.left)
            .attr("y", d => yScale(d) + margin.top)
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d))
            .attr("fill", "steelblue")
            .on("mouseover", function (event, d) {
                const xPos = event.pageX + 20;
                const yPos = event.pageY + 20;

                d3.select(this).attr("fill", "orange");

                d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("position", "absolute")
                    .style("left", xPos + "px")
                    .style("top", yPos + "px")
                    .style("background-color", "white")
                    .style("border", "1px solid black")
                    .style("padding", "5px")
                    .html(`Value: ${d.toFixed(3)}%`);
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", "steelblue");
                d3.select(".tooltip").remove();
            });
    }, [width, height, data]);

    return (
        <>
            <svg ref={svgRef} width={width + margin.left + margin.right} height={height + margin.top + 64}></svg>
            <span style={{ marginLeft: margin.left }}>Percentages for statistics are per-round, and are for all players from 2000 through 2022.</span>
            <br />
            <button
                onClick={() => {
                    const svg = document.querySelector('svg') as SVGElement;
                    downloadSvgAsPng(svg, document.querySelector('select')?.value + '.png');
                }}>Download Image</button>
        </>
    );
}
