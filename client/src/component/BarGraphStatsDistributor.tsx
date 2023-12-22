
import { useEffect, useState } from 'react';
import StatData from '../Models/StatData';
import BarGraphStats from './BarGraphStats';

export function convertStatName(name: string) {
    switch (name) {
        case "uzr":
            return "Ultimate Zone Rating";
        case "war":
            return "Wins Above Replacement";
        case "ops":
            return "On Base Percentage Plus Slugging";
        case "eraMinus":
            return "Earned Run Average Minus";
        case "fldPct":
            return "Fielding Percentage";
        case "fieldingInnings":
            return "Fielding Innings";
        case "inningsPitched":
            return "Innings Pitched";
        case "plateAppearances":
            return "Plate Appearances";
        default:
            return name;
    }
}

const emptyRound = {
    statName: "",
    rounds: []
};

export default function BarGraphRoundDistributor() {
    const [data, setData] = useState<StatData[]>([]);
    const [currentStat, setCurrentStat] = useState<StatData>(emptyRound);
    const max = Math.max(...currentStat.rounds.map(r => r.percent)) * 100;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:8800/yearly_normalized_per_stat');
                const jsonData = await response.json();
                console.log(jsonData)
                setData(jsonData as StatData[]);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        console.log(currentStat);
    }, [currentStat])

    return (
        <>
            <BarGraphStats data={currentStat} max={Math.trunc(max) + (Math.trunc(max) % 10)} />
            <select
                onChange={(evt) => {
                    const stat = data.find(d => d.statName === evt.target.value) ?? emptyRound;
                    setCurrentStat(stat); console.log(stat)
                }} >
                <option key={-1} value={"Select an option"} hidden>Select an option</option>
                {data.map((stat, idx) => {
                    return <option key={idx} value={stat.statName}>{convertStatName(stat.statName)} ({stat.statName})</option>
                })}
            </select>
        </>
    );
};