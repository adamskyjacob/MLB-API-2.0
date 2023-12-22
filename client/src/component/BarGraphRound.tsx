import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import RoundData from '../Models/RoundData'

function convertRound(round: string) {
    if (round === "intl") {
        return "Undrafted";
    }
    return round;
}

function shortenStatString(stat: string | unknown) {
    switch (stat) {
        case "uzr":
        case "war":
        case "ops":
            return stat.toUpperCase();
        case "fldPct": {
            return "FLD_PCT";
        }
        case "inningsPitched": {
            return "IP";
        }
        case "plateAppearances": {
            return "PA";
        }
        case "fieldingInnings": {
            return "FLD_INN";
        }
        case "eraMinus": {
            return "ERA-";
        }
        default: {
            if (typeof stat == "string") {
                return stat.toUpperCase();
            }
            return String(stat);
        }
    }
}

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

export default function BarGraphRound(props: { data: RoundData; max: number }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const { data, max } = props;
    const margin = { top: 40, right: 40, bottom: 240, left: 60 };
    const width = window.innerWidth - margin.left - margin.right;
    const height = window.innerHeight - margin.top - margin.bottom;

    useEffect(() => {
        const keys = Object.keys(data.stats);
        const svg = d3.select(svgRef.current);
        const xScale = d3.scaleBand().domain(keys).range([0, width]).padding(0.2);
        const yMax = Math.trunc(max * 100) + (10 - (Math.trunc(max * 100) % 10));
        const yScale = d3.scaleLinear().domain([0, yMax]).range([height, 0]);

        svg.selectAll('*').remove();

        svg.append('text')
            .attr('y', height + 20 + margin.top + 32)
            .attr('x', width / 2)
            .style('text-anchor', 'middle')
            .style('font-size', '1.5em')
            .text('Statistics');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', margin.left / 2)
            .attr('x', 0 - height / 2)
            .style('text-anchor', 'middle')
            .style('font-size', '1.5em')
            .style('font-weight', '600')
            .text('Percentage');

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '1.5em')
            .style('font-weight', '600')
            .style('text-decoration', 'underline')
            .text(`${data.round == 'intl' ? convertRound(data.round) : `Round ${data.round}`} Statistics`);

        svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
            .style('font-size', '.75em')
            .style('font-weight', '600')
            .call(d3.axisLeft(yScale).ticks(5).scale(yScale));

        svg.append('g')
            .attr('transform', `translate(${margin.left}, ${height + margin.top})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('font-size', '1.5em')
            .style('font-weight', '600')
            .attr('dy', '1em')
            .text((statKey) => shortenStatString(statKey));

        svg.append('rect')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('fill', 'white');

        svg.selectAll('rect').lower();

        svg.selectAll('.bar')
            .data(keys)
            .enter()
            .append('rect')
            .attr('x', (statKey) => (xScale(statKey) || 0) + margin.left)
            .attr('y', (statKey) => yScale(data.stats[statKey] * 100) + margin.top)
            .attr('width', xScale.bandwidth())
            .attr('height', (statKey) => height - yScale(data.stats[statKey] * 100))
            .attr('fill', 'blue')
            .attr("fill", "steelblue");

        svg.selectAll('.bar')
            .data(keys)
            .enter()
            .append('rect')
            .attr('x', (statKey) => (xScale(statKey) || 0) + margin.left)
            .attr('y', (statKey) => yScale(data.stats[statKey] * 100) + margin.top)
            .attr('width', xScale.bandwidth())
            .attr('height', (statKey) => height - yScale(data.stats[statKey] * 100))
            .attr('fill', 'blue')
            .attr("fill", "steelblue");

        svg.selectAll('.bar-label')
            .data(keys)
            .enter()
            .append('text')
            .text((statKey) => `${(data.stats[statKey] * 100).toFixed(2)}%`)
            .attr('x', (statKey) => ((xScale(statKey) || 0)) + xScale.bandwidth() / 1.5 || 0)
            .attr('y', (statKey) => yScale(data.stats[statKey] * 100) + margin.top - 5)
            .style('font-size', '1em')
            .style('font-weight', '600')
            .attr('fill', 'black')
            .classed('bar-label', true);
    }, [data, width, height, max]);

    return (
        <>
            <svg ref={svgRef} width={width + margin.left + margin.right} height={height + margin.top + 64}></svg>
            <span style={{ marginLeft: margin.left }}>Percentages for statistics are per-round, and are for all players from 2000 through 2022.</span>
            <br/>
            <button
                onClick={() => {
                    const svg = document.querySelector('svg') as SVGElement;
                    downloadSvgAsPng(svg, document.querySelector('select')?.value + '.png');
                }}>Download Image</button>
        </>
    );
}