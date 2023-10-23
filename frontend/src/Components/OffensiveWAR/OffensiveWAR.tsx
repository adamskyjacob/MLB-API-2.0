
import "./OffensiveWAR.css"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom";


async function getData(setOffensiveWAR: React.Dispatch<any>, source: string, year: string | undefined | null, pid: string | undefined | null) {
    let fetchURL = `http://localhost:8800/api/v1/${source}`;
    if (year) {
        fetchURL += `?year=${year}`
    }
    if (pid) {
        fetchURL += `${year ? "&" : "?"}pid=${pid}`
    }
    await fetch(fetchURL).then(async (response) => {
        await response.json().then((json) => {
            setOffensiveWAR(json);
        })
    })
}

export default function OffensiveWAR() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const [year, pid, page] = [searchParams.get("year"), searchParams.get("pid"), searchParams.get("page")];
    const [currentIndex, setCurrentIndex] = useState(Number(page));
    const [tableData, setTableData] = useState<{
        count: number,
        rows: any[]
    }>({ count: 0, rows: [0] });
    const baseIndex = (tableData?.count ?? 0) / 100;
    const maxIndex = baseIndex % 1 == 0 ? baseIndex : Math.trunc(baseIndex) + 1;

    useEffect(() => {
        navigate(`/Offensive_WAR?pid=${pid ?? ""}&year=${year ?? ""}&page=${currentIndex}`)
    }, [currentIndex])

    useEffect(() => {
        getData(setTableData, "owar", year, pid);
    }, []);

    const generateTableRows = () => {
        return tableData.rows.map((row, i) => {
            if (i >= currentIndex * 100 && i < (currentIndex + 1) * 100)
                return (
                    <tr>
                        <th>{i}</th>
                        {
                            Object.keys(row).map((key) => {
                                const val = key == "CATCHER" ? (row[key] ? "True" : "False") : row[key];
                                const className = (key == "CATCHER") ? (row[key] ? "true" : "false") : key;
                                return (
                                    <th className={className.toLowerCase()}>{val}</th>
                                )
                            })
                        }
                    </tr>
                );
        })
    }

    const generateTableData = () => {
        return (
            <table>
                <thead>
                    <tr>
                        <th key={-1}>INDEX</th>
                        {
                            Object.keys(tableData.rows[0]).map((key, index) => {
                                return (
                                    <th key={key.toLowerCase()}>{key}</th>
                                )
                            })
                        }
                    </tr>
                </thead>
                <tbody>
                    {generateTableRows()}
                </tbody>
            </table>
        )
    }

    return (
        <div className="subpage">
            <div className="buttons">
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
            </div>
            {tableData?.rows ? (
                <>
                    <div className="table_container" />
                    {generateTableData()}
                </>
            ) : "No players found."}
        </div>
    )
}