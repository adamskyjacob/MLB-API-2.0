
import "./Search.css";

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react"

export default function Search() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const [playerData, setPlayerData] = useState<any[]>();
    const pageCount = playerData ? Math.ceil(playerData.length / 100) : 0;
    const [first, last, debut] = [searchParams.get("first"), searchParams.get("last"), searchParams.get("debut")];

    const executeSearch = () => {
        let firstVal: string = (document.querySelector("#first_name") as HTMLInputElement).value;
        let lastVal: string = (document.querySelector("#last_name") as HTMLInputElement).value;
        let debutVal: string = (document.querySelector("#debut_year") as HTMLInputElement).value;
        navigate(`/Search?first=${firstVal}&last=${lastVal}&debut=${debutVal}`);
    }

    const getPlayerData = async () => {
        let url = `http://localhost:8800/api/v1/findplayer`;
        const params = new URLSearchParams();

        if (first) {
            params.append("first", first);
        }
        if (last) {
            params.append("last", last);
        }
        if (debut) {
            params.append("debut", debut.toString());
        }
        const raw = await fetch(`${url}?${params}`);
        const json = await raw.json();
        setPlayerData(json);
    }

    useEffect(() => {
        if (first || last || debut) {
            getPlayerData();
        }
    }, []);

    return (
        <div className="subpage">
            <div className="search">
                <input id={"first_name"} type="text" placeholder="First Name"></input>
                <input id={"last_name"} type="text" placeholder="Last Name"></input>
                <input id={"debut_year"} type="number" min={1982} max={2022} placeholder="Debut"></input>
                <button type="button" onClick={() => {
                    executeSearch();
                }}>Search</button>
            </div>
            <table style={{ marginTop: "3vw" }}>
                <thead>
                    <tr>
                        <th>Player ID</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Debut Year</th>
                        <th>International</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        playerData ? playerData.map((row) => {
                            return (
                                <tr>
                                    {
                                        Object.keys(row).map(td => {
                                            let data = row[td];
                                            return (
                                                <th>{(data == 0 || !data) ? "N/A" : data}</th>
                                            )
                                        })
                                    }
                                </tr>
                            )
                        }) : "No data found"
                    }
                </tbody>
            </table>
        </div>
    )
}