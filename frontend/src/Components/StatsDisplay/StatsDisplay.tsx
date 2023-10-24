import "./StatsDisplay.css";

import { useEffect, useState } from "react";
import { NavigateFunction, useLocation, useNavigate } from "react-router-dom";

export enum TargetType {
    OffensiveWAR = "owar", PitchingWAR = "pwar", BothWAR = "bothwar", DraftInfo = "search", Fielding = "fielding", Offensive = "hitting", Pitching = "pitching", Position = "position"
}

function WARTypeToTarget(type: TargetType) {
    switch (type) {
        case TargetType.OffensiveWAR:
            return "Offensive_WAR";
        case TargetType.PitchingWAR:
            return "Pitching_WAR";
        case TargetType.BothWAR:
            return "Both_WAR";
        case TargetType.DraftInfo:
            return "Draft_Info";
        case TargetType.Fielding:
            return "Fielding";
        case TargetType.Offensive:
            return "Offensive";
        case TargetType.Pitching:
            return "Pitching";
        case TargetType.Position:
            return "Position";
    }
}

async function fetchData(source: TargetType, year: string | null, pid: string | null) {
    let fetchURL = `http://localhost:8800/api/v1/${source}`;
    const params = new URLSearchParams();
    if (year) {
        params.append("year", year);
    }
    if (pid) {
        params.append("pid", pid);
    }
    const response = await fetch(`${fetchURL}?${params}`);
    const data = await response.json();
    return data;
}

function StatsDisplay(props: { source: TargetType }) {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const [year, pid, page] = [searchParams.get("year"), searchParams.get("pid"), searchParams.get("page")];
    const [currentIndex, setCurrentIndex] = useState<number>(Number(page || 0));
    const [tableData, setTableData] = useState<any>(null);

    useEffect(() => {
        async function fetchDataAndSetTableData() {
            const data = await fetchData(props.source, year, pid);
            setTableData(data);
            if (year && year !== "0") {
                const select = document.querySelector("select") as HTMLSelectElement;
                const option = select.querySelector(`option[value='${year}']`) as HTMLOptionElement;
                if (option) {
                    option.selected = true;
                }
            }
        }

        fetchDataAndSetTableData();
        navigateTo(navigate, pid, year, currentIndex);
    }, [year, pid, currentIndex, navigate]);

    const navigateTo = (navigate: NavigateFunction, pid: string | null, year: string | null, currentIndex: number) => {
        const queryParams = new URLSearchParams();
        queryParams.append("page", String(currentIndex));
        if (pid !== null) {
            queryParams.append("pid", pid);
        }
        if (year && year !== "0") {
            queryParams.append("year", year);
        }
        const queryString = queryParams.toString();
        const warTarget = WARTypeToTarget(props.source);
        navigate(`/${warTarget}?${queryString}`);
    };

    const generateTableRows = () => {
        if (!tableData) {
            return null;
        }
        return tableData.map((row: any, i: number) => {
            if (i >= currentIndex * 100 && i < (currentIndex + 1) * 100) {
                return (
                    <tr key={i}>
                        {Object.keys(row).map((key, index) => {
                            const val = key === "CATCHER" ? (row[key] ? "True" : "False") : row[key];
                            const className = key === "CATCHER" ? (row[key] ? "true" : "false") : key;
                            return <th className={className.toLowerCase()} key={index}>{val}</th>;
                        })}
                    </tr>
                );
            }
            return null;
        });
    };

    const generateTable = () => {
        if (!tableData || tableData.message) {
            return tableData ? tableData.message : "No players found.";
        }

        const headers = Object.keys(tableData[0]);
        return (
            <table>
                <thead>
                    <tr>{headers.map((key) => <th key={key.toLowerCase()}>{key}</th>)}</tr>
                </thead>
                <tbody>{generateTableRows()}</tbody>
            </table>
        );
    };

    const years = Array.from({ length: 41 }, (_, index) => index + 1982);

    return (
        <div className="subpage">
            <div className="buttons">
                <button
                    onClick={() => {
                        if (currentIndex - 1 >= 0) {
                            setCurrentIndex((prev) => prev - 1);
                        }
                    }}>
                    Previous Page
                </button>
                <button
                    onClick={() => {
                        if (currentIndex + 1 < Math.ceil((tableData?.length ?? 0) / 100)) {
                            setCurrentIndex((prev) => prev + 1);
                        }
                    }}>
                    Next Page
                </button>
                <br />
                <select
                    onChange={(evt) => {
                        const selectedYear = evt.target.value;
                        navigateTo(navigate, pid, selectedYear, 0);
                    }}
                    value={year || "0"}>
                    <option value="0">Select a year</option>
                    {years.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>
            {generateTable()}
        </div>
    );
}

export default StatsDisplay;