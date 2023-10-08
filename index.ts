import core from 'express';
import express from 'express';
import cors from 'cors';
import { baseURL, sabermetricsURL } from './api/apiURL';
import { SQLBasicType, SQLEnum, SQLType, SQLVarType, createTableQuery, dbConnection, tableHeaders, tables } from './api/db';
import { splitArray, getAllPlayers } from './api/util';

const baseAPI: string = "/api/v1";

const app: core.Express = express();
app.use(express.json());
app.use(cors());

app.listen(8800, async () => {
    await ALL_WAR_QUERY();
    dbConnection.query("SHOW TABLES", (err, res) => {
        const dbTables: string[] = res.map(val => val["Tables_in_mqp"]) as string[];
        for (var table of tables) {
            if (!dbTables.includes(table)) {
                const containsYear = tableHeaders[table].map(attr => attr.name).includes("YEAR_NUM");
                const query = createTableQuery(table, tableHeaders[table], containsYear);
                dbConnection.query(query);
            }
        }
    })
});

/*app.get(`${baseAPI}/sabermetrics/:pid?`, async (req, _res) => {
    await fetch(sabermetricsURL(req.params.pid.split(",").map(id => Number(id)))).then(res => {
        res.json().then(json => {
            const stats = json["people"].map(player => {
                return {
                    id: player["id"],
                    name: player["fullName"],
                    splits: player["stats"]
                }
            })
            _res.type('json').send(JSON.stringify(stats, null, 2) + "\n");
        })
    })
});*/

const ALL_WAR_QUERY = async () => {
    const yearlyPlayers = await getAllPlayers();
    for (var key of Object.keys(yearlyPlayers)) {
        const splitPlayers = splitArray(yearlyPlayers[key] as number[], 100);
        for (var subArray of splitPlayers) {
            const playerResult = await fetch(sabermetricsURL(subArray, key));
            const json = await playerResult.json();
            json["people"].forEach(plr => console.log(JSON.stringify({
                id: plr["id"],
                stats: plr["stats"].filter(stat => ["hitting", "pitching", "sabermetrics"].includes(stat.group.displayName))
                // FIRST SPLIT IN EACH STAT GROUP (i.e SABERMETRICS, SEASON, PITCHING, HITTING) IS THE SEASONAL TOTAL, OTHERS ARE SPLITS FOR IF PLAYER WAS ON MULTIPLE TEAMS

            }, null, 2)))
        }
    }
/*

    let result = [];
    let allPlayers = await getAllPlayers(2022);
    if (typeof allPlayers[0]['2022'][0] == "number") {
        const splitPlayers = splitArray(allPlayers as number[], 100);
        for (var subArray of splitPlayers) {
            console.log(subArray);
            const playerResult = await fetch(sabermetricsURL(subArray));
            const json = await playerResult.json();
            result.push(json["people"].map(player => {
                const playerInfo = {
                    id: player["id"],
                    name: player["fullName"],
                    splits: player["stats"]
                }
                return playerInfo;
            }))
        }
    }*/
}

const PLAYER_POSITION_QUERY = async () => {
    for (let i = 0; i < 23; i++) {
        const yearlyPlayers = await fetch(`${baseURL}sports/1/players?season=${2000 + i}`);
        const json = await yearlyPlayers.json();
        for (var player of json["people"]) {
            console.log(player)
            const pos = player["primaryPosition"]["abbreviation"];
            const id = player["id"];
            const playerInfo = `('${pos}', ${id}, ${2000 + i})`;
            dbConnection.query(`INSERT INTO PLAYER_POSITION (POSITION, PLAYER_ID, YEAR_NUM) VALUES ${playerInfo}`);
        }
    }
}