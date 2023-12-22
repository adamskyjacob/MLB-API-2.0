
import { useEffect, useState } from 'react';
import RoundData from '../Models/RoundData';
import BarGraphRound from './BarGraphRound';

export default function BarGraphRoundDistributor() {
    const [data, setData] = useState<RoundData[]>([]);
    const numeric = data.filter(data => !/[^0-9]/.test(data.round)).sort((a, b) => { return Number(a.round) - Number(b.round) });
    const nonnumeric = data.filter(data => /[^0-9]/.test(data.round)).sort((a, b) => { return a.round.localeCompare(b.round) });
    const [currentRound, setCurrentRound] = useState<RoundData>({
        round: "-1", stats: {}
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:8800/yearly_normalized_per_round');
                const jsonData = await response.json();
                setData(jsonData as RoundData[]);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <>
            <BarGraphRound data={currentRound} max={RoundData.findOverallMaxValue(data)} />
            <select onChange={(evt) => {
                const newRound = numeric.find(r => r.round === evt.target.value) ?? nonnumeric.find(r => r.round === evt.target.value) ?? { round: "", stats: {} };
                setCurrentRound(newRound);
            }}>
                <option key={-1} value={"Select an option"} hidden>Select an option</option>
                {numeric.map((round, idx) => { return <option key={idx} value={round.round}>{round.round}</option> })}
                {nonnumeric.map((round, idx) => { return <option key={idx} value={round.round}>{round.round}</option> })}
            </select>
        </>
    );
};