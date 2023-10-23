
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
    const [tableData, setTableData] = useState<any[]>([]);

    const [filterInfo, setFilterInfo] = useState<{ year: number }>({ year: 0 });
    const filteredTableData = tableData.filter(row => {
        if ((row.YEAR_NUM == filterInfo.year) || (filterInfo.year == 0)) {
            return row;
        }
    });

    const baseIndex = (filteredTableData?.length ?? 0) / 100;
    const maxIndex = baseIndex % 1 == 0 ? baseIndex : Math.trunc(baseIndex) + 1;

    useEffect(() => {
        navigate(`/Offensive_WAR?pid=${pid ?? ""}&year=${year ?? ""}&page=${currentIndex}`)
    }, [currentIndex])

    useEffect(() => {
        getData(setTableData, "owar", year, pid);
    }, []);

    const generateTableRows = () => {
        return filteredTableData.map((row, i) => {
            if (i >= currentIndex * 100 && i < (currentIndex + 1) * 100)
                return (
                    <tr key={i}>
                        <th>{i}</th>
                        {
                            Object.keys(row).map((key, index) => {
                                const val = key == "CATCHER" ? (row[key] ? "True" : "False") : row[key];
                                const className = (key == "CATCHER") ? (row[key] ? "true" : "false") : key;
                                return (
                                    <th className={className.toLowerCase()} key={index}>{val}</th>
                                )
                            })
                        }
                    </tr>
                );
        })
    }

    const generateTable = () => {
        return (
            <table>
                <thead>
                    <tr>
                        <th key={-1}>INDEX</th>
                        {
                            filteredTableData.length > 0 ? Object.keys(filteredTableData[0]).map((key) => {
                                return (
                                    <th key={key.toLowerCase()}>{key}</th>
                                )
                            }) : null
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
                <br />
                <select onChange={
                    (evt) => {
                        let select = evt.target as HTMLSelectElement;
                        let option = select[select.selectedIndex] as HTMLOptionElement;
                        setFilterInfo({ ...filterInfo, year: Number(option.value) });
                    }
                }>
                    <option value={0}>Select a year</option>
                    {
                        Array.from(Array(41)).map((_, index) => {
                            let year = index + 1982;
                            return (
                                <option key={year} value={year}>{year}</option>
                            )
                        })
                    }
                </select>
            </div>
            {filteredTableData ? generateTable() : "No players found."}
        </div >
    )
}