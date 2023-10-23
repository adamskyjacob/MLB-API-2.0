
import "../OffensiveWAR/OffensiveWAR.css"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom";


async function getPitchingWAR(setPitchingWAR: React.Dispatch<any>, year: string | undefined | null, pid: string | undefined | null) {
    let fetchURL = "http://localhost:8800/api/v1/pwar";
    if (year) {
        fetchURL += `?year=${year}`
    }
    if (pid) {
        fetchURL += `${year ? "&" : "?"}pid=${pid}`
    }
    await fetch(fetchURL).then(async (response) => {
        await response.json().then((json) => {
            setPitchingWAR(json);
        })
    })
}

export default function PitchingWAR() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const [year, pid, page] = [searchParams.get("year"), searchParams.get("pid"), searchParams.get("page")];
    const [currentIndex, setCurrentIndex] = useState(Number(page));
    const [pitchingWAR, setPitchingWAR] = useState<{
        count: number,
        rows: { WAR: number, PLAYER_ID: string, YEAR_NUM: number, CATCHER: boolean }[]
    }>();
    const baseIndex = (pitchingWAR?.count ?? 0) / 100;
    const maxIndex = baseIndex % 1 == 0 ? baseIndex : Math.trunc(baseIndex) + 1;

    useEffect(() => {
        navigate(`/Pitching_WAR?pid=${pid ?? ""}&year=${year ?? ""}&page=${currentIndex}`)
    }, [currentIndex])

    useEffect(() => {
        getPitchingWAR(setPitchingWAR, year, pid);
    }, []);

    return (
        <div className="subpage">
            Page Limit: {maxIndex}
            <br />
            <button onClick={() => {
                if (currentIndex - 1 >= 0) {
                    setCurrentIndex(prev => prev - 1)
                }
            }}>Previous Page</button>
            <button onClick={() => {
                if (currentIndex + 1 < maxIndex) {
                    setCurrentIndex(prev => prev + 1)
                }
            }}>Next Page</button>
            {
                pitchingWAR?.rows ?
                    (
                        <table>
                            <thead>
                                <tr>
                                    <th>Index</th>
                                    <th>WAR</th>
                                    <th>Player ID</th>
                                    <th>Year</th>
                                    <th>Catcher?</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    pitchingWAR.rows.map((pwar, i) => {
                                        if (i >= currentIndex * 100 && i < (currentIndex + 1) * 100)
                                            return (
                                                <tr>
                                                    <th>{i}</th>
                                                    <th>{pwar.WAR}</th>
                                                    <th>{pwar.PLAYER_ID}</th>
                                                    <th>{pwar.YEAR_NUM}</th>
                                                    <th>{pwar.CATCHER ? "TRUE" : "FALSE"}</th>
                                                </tr>
                                            );
                                    })
                                }
                            </tbody>
                        </table>
                    )
                    : "No players found."
            }
        </div>
    )
}