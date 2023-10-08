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

const ALL_WAR_QUERY = async () => {
    const yearlyPlayers = await getAllPlayers();
    let allPlayers: { id: number, stats: any }[] = [];
    for (var key of Object.keys(yearlyPlayers)) {
        const splitPlayers = splitArray(yearlyPlayers[key] as number[], 100);
        for (var subArray of splitPlayers) {
            const playerResult = await fetch(sabermetricsURL(subArray, key));
            const json = await playerResult.json();
            json["people"].forEach(plr => {
                allPlayers.push({
                    id: plr["id"],
                    stats: plr["stats"].filter(stat => ["hitting", "pitching", "sabermetrics", "fielding"].includes(stat.group.displayName))
                })
            });
        }
    }

    for (var playerSubarray of splitArray(allPlayers, 1000)) {
        for (var player of playerSubarray) {
            const saberHitting = player.stats.filter(group => group.type.displayName == "sabermetrics" && group.group.displayName == "hitting")[0];
            const saberPitching = player.stats.filter(group => group.type.displayName == "sabermetrics" && group.group.displayName == "pitching")[0];
            const fielding = player.stats.filter(group => group.type.displayName == "season" && group.group.displayName == "fielding")[0];
            const hitting = player.stats.filter(group => group.type.displayName == "season" && group.group.displayName == "hitting")[0];
            const year = Number(player.stats[0]["splits"][0]["season"]);

            if (fielding) {
                const fldPct = Number(fielding.splits[0].stat.fielding);
                if (!Number.isNaN(fldPct)) {
                    dbConnection.query(`INSERT INTO FIELDING (FLD_PCT, PLAYER_ID, YEAR_NUM) VALUES (${fldPct}, ${player.id}, ${year})`)
                }
            }

            if (hitting) {
                const ops = Number(hitting.splits[0].stat.ops);
                if (!Number.isNaN(ops)) {
                    dbConnection.query(`INSERT INTO HITTING (OPS, PLAYER_ID, YEAR_NUM) VALUES (${ops}, ${player.id}, ${year})`)
                }
            }

            if (saberHitting) {
                const war = Number(saberHitting.splits[0].stat.war);
                if (!Number.isNaN(war)) {
                    dbConnection.query(`INSERT INTO ALL_WAR (WAR, PLAYER_ID, YEAR_NUM, POSITIONAL) VALUES (${war}, ${player.id}, ${year}, TRUE)`)
                }
            }

            if (saberPitching) {
                const eraMinus = Number(saberPitching.splits[0].stat.eraMinus);
                const war = Number(saberPitching.splits[0].stat.war);
                if (!Number.isNaN(war)) {
                    dbConnection.query(`INSERT INTO ALL_WAR (WAR, PLAYER_ID, YEAR_NUM, POSITIONAL) VALUES (${war}, ${player.id}, ${year}, FALSE)`)
                }
                if (!Number.isNaN(eraMinus)) {
                    dbConnection.query(`INSERT INTO PITCHING (ERA_MINUS, PLAYER_ID, YEAR_NUM) VALUES (${eraMinus}, ${player.id}, ${year})`)
                }
            }
        }
    }
    console.log("Finished adding hitting, fielding, pitching, and sabermetrics data to the database!");
}

const PLAYER_POSITION_QUERY = async () => {
    for (let i = 0; i < 23; i++) {
        const yearlyPlayers = await fetch(`${baseURL}sports/1/players?season=${2000 + i}`);
        const json = await yearlyPlayers.json();
        for (var player of json["people"]) {
            const pos = player["primaryPosition"]["abbreviation"];
            const id = player["id"];
            const playerInfo = `('${pos}', ${id}, ${2000 + i})`;
            dbConnection.query(`INSERT INTO PLAYER_POSITION (POSITION, PLAYER_ID, YEAR_NUM) VALUES ${playerInfo}`);
        }
    }
    console.log("Finished adding player positional information to the database!");
}