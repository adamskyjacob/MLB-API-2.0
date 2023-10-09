import core from 'express';
import express from 'express';
import cors from 'cors';
import { baseURL, sabermetricsURL } from './api/api';
import { createTableQuery, dbConnection, tableHeaders, tables } from './api/db';
import { splitArray, getAllPlayers, getAllDraft, PlayerDraftInfo } from './api/util';

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
    await DRAFT_INFO_QUERY();
});

const DRAFT_INFO_QUERY = async () => {
    const draftPlayers = await getAllDraft();
    let playerCount = 0;
    for (var key of Object.keys(draftPlayers)) {
        const draftInfo = draftPlayers[key];
        for (var round of draftInfo) {
            for (var player of round["picks"]) {
                const debutDate: string = player.person?.mlbDebutDate ?? "";
                let pdi = {
                    PLAYER_ID: Number(player.person?.id),
                    DRAFT_YEAR: Number(key),
                    DRAFT_ROUND: String(player.pickRound),
                    DRAFT_POSITION: Number(player.roundPickNumber),
                    DEBUT_YEAR: Number(debutDate.substring(0, 4)) ?? 0,
                    INTERNATIONAL: player.person?.birthCountry ? player.person?.birthCountry != "USA" : undefined
                } as PlayerDraftInfo;
                if (!Number.isNaN(pdi.PLAYER_ID)) {
                    playerCount++;
                    dbConnection.query(`INSERT INTO DRAFT_INFO (PLAYER_ID, DRAFT_YEAR, DRAFT_ROUND, DRAFT_POSITION, DEBUT_YEAR, INTERNATIONAL) VALUES (${pdi.PLAYER_ID},${pdi.DRAFT_YEAR},"${pdi.DRAFT_ROUND}",${pdi.DRAFT_POSITION},${pdi.DEBUT_YEAR},${pdi.INTERNATIONAL ?? "NULL"})`)    
                }
            }
        }
    }
    console.log(`Player draft info table filled out for players with valid MLB ID # (${playerCount} players added)`);
}

const STATS_QUERY = async () => {
    const yearlyPlayers = await getAllPlayers();
    let allPlayers: { id: number, stats: any, positionAbbrev: string }[] = [];
    for (var key of Object.keys(yearlyPlayers)) {
        const splitPlayers = splitArray(yearlyPlayers[key] as number[], 100);
        for (var subArray of splitPlayers) {
            const playerResult = await fetch(sabermetricsURL(subArray, key));
            const json = await playerResult.json();
            json["people"].forEach(plr => {
                allPlayers.push({
                    id: plr["id"],
                    positionAbbrev: plr["primaryPosition"]["abbreviation"],
                    stats: plr["stats"].filter(stat => ["hitting", "pitching", "sabermetrics", "fielding"].includes(stat.group.displayName))
                })
            });
        }
    }

    let saberHittingCount = 0, saberPitchingCount = 0, fieldingCount = 0, hittingCount = 0;
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
                    dbConnection.query(`INSERT INTO FIELDING (FLD_PCT, PLAYER_ID, YEAR_NUM) VALUES (${fldPct}, ${player.id}, ${year})`);
                    fieldingCount++;
                }
            }

            if (hitting) {
                const ops = Number(hitting.splits[0].stat.ops);
                if (!Number.isNaN(ops)) {
                    dbConnection.query(`INSERT INTO HITTING (OPS, PLAYER_ID, YEAR_NUM) VALUES (${ops}, ${player.id}, ${year})`);
                    hittingCount++;
                }
            }

            if (saberHitting) {
                const war = Number(saberHitting.splits[0].stat.war);
                if (!Number.isNaN(war)) {
                    dbConnection.query(`INSERT INTO OFFENSIVE_WAR (WAR, PLAYER_ID, YEAR_NUM, CATCHER) VALUES (${war}, ${player.id}, ${year}, ${player.positionAbbrev == "C"})`);
                    saberHittingCount++;
                }
            }

            if (saberPitching) {
                const eraMinus = Number(saberPitching.splits[0].stat.eraMinus);
                const war = Number(saberPitching.splits[0].stat.war);
                if (!Number.isNaN(war)) {
                    dbConnection.query(`INSERT INTO PITCHING_WAR (WAR, PLAYER_ID, YEAR_NUM) VALUES (${war}, ${player.id}, ${year})`);
                }
                if (!Number.isNaN(eraMinus)) {
                    dbConnection.query(`INSERT INTO PITCHING (ERA_MINUS, PLAYER_ID, YEAR_NUM) VALUES (${eraMinus}, ${player.id}, ${year})`);
                }
                if (!Number.isNaN(war) && !Number.isNaN(eraMinus)) {
                    saberPitchingCount++;
                }
            }
        }
    }
    console.log(`Finished adding hitting (${hittingCount} entries), fielding (${fieldingCount} entries), and sabermetrics (${saberPitchingCount} pitching, ${saberHittingCount} offensive) data to the database!`);
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