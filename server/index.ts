import core, { Request } from 'express';
import express, { Response } from 'express';
import cors from 'cors';
import { baseURL, sabermetricsURL } from './api/api';
import { dbConnection, tableHeaders, tables } from './api/db';
import { splitArray, getAllPlayers, getAllDraft, createTableQuery } from './api/util';
import { PlayerDraftInfo } from './api/types';
import Test from './testing/test';
import { MysqlError } from 'mysql';

const baseAPI: string = "/api/v1";
const app: core.Express = express();

function processRows(rows: any, res: Response, err: MysqlError) {
    if (err) {
        res.status(400).send(err);
        return
    }
    if (rows.length == 0) {
        res.status(404).json({ message: "No data found matching query." });
        return;
    }
    res.status(200).json(rows);
}

function getAndProcessData(req: Request, res: Response, query: string, bothwar: boolean) {
    const { pid, year } = req.query;
    let params = [];
    if (pid) {
        query += ` WHERE ${bothwar ? "OP_JOIN." : ""}PLAYER_ID=?`;
        params.push(pid);
    }
    if (year) {
        query += `${pid ? " AND" : " WHERE"} ${bothwar ? "OP_JOIN." : ""}YEAR_NUM=?`;
        params.push(year);
    }

    dbConnection.query(query, params, (err, rows) => {
        processRows(rows, res, err);
    });
}

function processComplexQuery(queryJSON: {}, res: Response, query: string, groupBy?: string) {
    let andParam: boolean = false;
    let params = [];

    for (var key of Object.keys(queryJSON)) {
        let value = queryJSON[key];
        if (value && !andParam) {
            query += ` WHERE ${key}=?`;
            params.push(value);
            andParam = true;
            continue;
        }
        if (value && andParam) {
            query += ` AND ${key}=?`;
            params.push(value);
        }
    }

    dbConnection.query(query, params, (err, result) => {
        processRows(result, res, err);
    });
}

app.set('json spaces', 2)
app.use(cors());

app.listen(8800, async () => {
    dbConnection.query("SHOW TABLES", (err, result) => {
        if (err) {
            throw err;
        }
        const dbTables: string[] = result.map(val => (val["Tables_in_mqp"] as string).toUpperCase()) as string[];
        for (var table of tables) {
            if (!dbTables.includes(table)) {
                const containsYear = tableHeaders[table].map(attr => attr.name).includes("YEAR_NUM");
                const query = createTableQuery(table, tableHeaders[table], containsYear);
                dbConnection.query(query);
            }
        }
        console.log(result);
        if (!result.includes("DRAFT_INFO")) {
            DRAFT_INFO_QUERY();
        }
        if (!result.includes("OFFENSIVE_WAR") || !result.includes("PITCHING_WAR") || !result.includes("HITTING") || !result.includes("PITCHING") || !result.includes("FIELDING")) {
            STATS_QUERY();
        }
        if (!result.includes("PLAYER_POSITION")) {
            PLAYER_POSITION_QUERY();
        }
    });
    Test.runAllTests();
});

app.get(`${baseAPI}/bothwar`, async (req, res) => {
    const getLeftOrRight = (lr: "LEFT" | "RIGHT") => {
        return `SELECT COALESCE(P.PLAYER_ID, O.PLAYER_ID) AS PLAYER_ID, COALESCE(P.YEAR_NUM, O.YEAR_NUM) AS YEAR_NUM, COALESCE(O.WAR, 0) AS OWAR, COALESCE(P.WAR, 0) AS PWAR FROM PITCHING_WAR P ${lr} JOIN OFFENSIVE_WAR O ON P.PLAYER_ID = O.PLAYER_ID AND P.YEAR_NUM = O.YEAR_NUM`
    }
    getAndProcessData(req, res, `SELECT * FROM (${getLeftOrRight("LEFT")} UNION ${getLeftOrRight("RIGHT")}) AS OP_JOIN`, true);
})

app.get(`${baseAPI}/owar`, async (req, res) => {
    getAndProcessData(req, res, "SELECT * FROM OFFENSIVE_WAR", false);
})

app.get(`${baseAPI}/pwar`, async (req, res) => {
    getAndProcessData(req, res, "SELECT * FROM PITCHING_WAR", false);
})

app.get(`${baseAPI}/pitching`, async (req, res) => {
    getAndProcessData(req, res, "SELECT * FROM PITCHING", false)
})

app.get(`${baseAPI}/hitting`, async (req, res) => {
    getAndProcessData(req, res, "SELECT * FROM HITTING", false)
})

app.get(`${baseAPI}/fielding`, async (req, res) => {
    getAndProcessData(req, res, "SELECT * FROM FIELDING", false)
})

app.get(`${baseAPI}/position`, async (req, res) => {
    processComplexQuery(req, res, "SELECT * FROM POSITION")
})

app.get(`${baseAPI}/search`, async (req, res) => {
    const { first, last, intl, year, pid } = req.query;
    const queryJSON = {
        FIRST_NAME: first,
        LAST_NAME: last,
        INTERNATIONAL: intl,
        DRAFT_YEAR: year,
        PLAYER_ID: pid
    };
    processComplexQuery(queryJSON, res, 'SELECT *, CASE WHEN DEBUT_YEAR=0 THEN "NO DEBUT" ELSE DEBUT_YEAR END AS DEBUT_YEAR FROM DRAFT_INFO')
})

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
                    FIRST_NAME: player.person?.firstName,
                    LAST_NAME: player.person?.lastName,
                    DRAFT_YEAR: Number(key),
                    DRAFT_ROUND: String(player.pickRound),
                    DRAFT_POSITION: Number(player.roundPickNumber),
                    DEBUT_YEAR: Number(debutDate.substring(0, 4)) ?? 0,
                    INTERNATIONAL: player.person?.birthCountry ? player.person?.birthCountry != "USA" : undefined
                } as PlayerDraftInfo;
                playerCount++;
                dbConnection.query(`INSERT INTO DRAFT_INFO (PLAYER_ID, FIRST_NAME, LAST_NAME, DRAFT_YEAR, DRAFT_ROUND, DRAFT_POSITION, DEBUT_YEAR, INTERNATIONAL) VALUES ("${pdi.PLAYER_ID ?? -playerCount}", "${pdi.FIRST_NAME}", "${pdi.LAST_NAME}",${pdi.DRAFT_YEAR},"${pdi.DRAFT_ROUND}",${pdi.DRAFT_POSITION},${pdi.DEBUT_YEAR},${pdi.INTERNATIONAL ?? "NULL"})`);
            }
        }
    }
    console.log(`Player draft info table filled out for players with valid MLB ID # (${playerCount} players added)`);
}

const STATS_QUERY = async () => {
    const yearlyPlayers = await getAllPlayers();
    let totalPlayerLength = 0;
    let allPlayers: { id: number, stats: any, positionAbbrev: string }[] = [];
    for (var key of Object.keys(yearlyPlayers)) {
        const splitPlayers = splitArray(yearlyPlayers[key] as number[], 100);
        for (var subArray of splitPlayers) {
            const playerResult = await fetch(sabermetricsURL(subArray, Number(key)));
            const json = await playerResult.json();
            json["people"].forEach(plr => {
                if (Number(plr["mlbDebutDate"].substring(0, 4)) >= 1982) {
                    totalPlayerLength++;
                    allPlayers.push({
                        id: plr["id"],
                        positionAbbrev: plr["primaryPosition"]["abbreviation"],
                        stats: plr["stats"].filter(stat => ["hitting", "pitching", "sabermetrics", "fielding"].includes(stat.group.displayName))
                    })
                }
            });
        }
    }
    console.log(`Finished collecting players (${totalPlayerLength} total)`);
    let saberHittingCount = 0, saberPitchingCount = 0, fieldingCount = 0, hittingCount = 0;
    for (var player of allPlayers) {
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
            if (!Number.isNaN(war) || !Number.isNaN(eraMinus)) {
                saberPitchingCount++;
            }
        }
    }
    console.log(`Finished adding hitting (${hittingCount} entries), fielding (${fieldingCount} entries), and sabermetrics (${saberPitchingCount} pitching, ${saberHittingCount} offensive) data to the database!`);
}

const PLAYER_POSITION_QUERY = async () => {
    let count = 0;
    for (let i = 0; i < 23; i++) {
        const yearlyPlayers = await fetch(`${baseURL}sports/1/players?season=${2000 + i}`);
        const json = await yearlyPlayers.json();
        for (var player of json["people"]) {
            count++;
            const pos = player["primaryPosition"]["abbreviation"];
            const id = player["id"];
            const playerInfo = `('${pos}', ${id}, ${2000 + i})`;
            dbConnection.query(`INSERT INTO PLAYER_POSITION (POSITION, PLAYER_ID, YEAR_NUM) VALUES ${playerInfo}`);
        }
    }
    console.log(`Finished adding player positional information to the database! (${count} players)`);
}