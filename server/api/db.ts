
import { MysqlError, createConnection } from 'mysql';
import { DraftPlayer, PlayerInformation, SQLBasicType, SQLEnum, SQLType, SQLTypeArray, SQLVarType } from './types';
import { Response, Request } from 'express';
import { convertMillisecondsToTime, onlyUnique, splitArray } from './util';

export const dbConnection = createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    port: 3306,
    database: "mqp"
});

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

export function findPlayerData(req: Request, res: Response) {
    const { first, last, debut } = req.query;
    let query = "SELECT DISTINCT PLAYER_ID, FIRST_NAME, LAST_NAME, DEBUT_YEAR, INTERNATIONAL FROM DRAFT_INFO";
    if (first) {
        query += ` WHERE FIRST_NAME LIKE '%${first}%'`;
    }
    if (last) {
        query += `${first ? " AND" : " WHERE"} LAST_NAME LIKE '%${last}%'`
    }
    if (debut) {
        query += `${(first || last) ? " AND" : " WHERE"} DEBUT_YEAR=${debut}`
    }

    dbConnection.query(query, (err, rows) => {
        processRows(rows, res, err);
    })
}

export function getAndProcessData(req: Request, res: Response, query: string, bothwar: boolean) {
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

export function processComplexQuery(queryJSON: {}, res: Response, query: string, groupBy?: string) {
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

export async function tryInitializeDatabase() {
    await new Promise<void>((resolve, reject) => {
        dbConnection.query("SHOW TABLES", (err, result) => {
            if (err) {
                reject(err);
            } else {
                const dbTables: string[] = result.map(val => (val["Tables_in_mqp"] as string).toUpperCase()) as string[];
                for (var table of tables) {
                    if (!dbTables.includes(table)) {
                        const containsYear = tableHeaders[table].map(attr => attr.name).includes("SEASON_YEAR");
                        const query = createTableQuery(table, tableHeaders[table], containsYear);
                        dbConnection.query(query);
                    }
                }
                resolve();
            }
        });
    })

    await getDraftInfo();
    await getPlayerInformation();
    await getPlayerStatistics();
    console.log("======== DONE ========");
}

const tables: string[] = ["FIELDING_STATS", "PITCHING_STATS", "PLAYER_INFO", "DRAFT_INFO", "HITTING_STATS"];

export const tableHeaders = {
    PLAYER_INFO: [
        {
            name: "ID",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "FIRST_NAME",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "LAST_NAME",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "BIRTH_DATE",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "BIRTH_COUNTRY",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "HEIGHT",
            type: "VARCHAR",
            size: 100,
            nullable: "NULL"
        } as SQLVarType,
        {
            name: "WEIGHT",
            type: "INT",
            nullable: "NULL"
        } as SQLType,
        {
            name: "DRAFT_YEAR",
            type: "INT",
            nullable: "NULL"
        } as SQLType,
        {
            name: "MLB_DEBUT_DATE",
            type: "VARCHAR",
            size: 100,
            nullable: "NULL"
        } as SQLVarType,
        {
            name: "LAST_PLAYED_DATE",
            type: "VARCHAR",
            size: 100,
            nullable: "NULL"
        } as SQLVarType,
        {
            name: "BAT_SIDE",
            nullable: "NOT NULL",
            type: "ENUM",
            vals: ["L", "R", "S"]
        } as SQLEnum,
        {
            name: "THROW_SIDE",
            nullable: "NOT NULL",
            type: "ENUM",
            vals: ["L", "R", "S"]
        } as SQLEnum,
        {
            name: "STRIKE_ZONE_TOP",
            type: "FLOAT",
            nullable: "NULL"
        } as SQLType,
        {
            name: "STRIKE_ZONE_BOTTOM",
            type: "FLOAT",
            nullable: "NULL"
        } as SQLType,
    ],
    FIELDING_STATS: [
        {
            name: "ID",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "SEASON_YEAR",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "POSITION",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "FIELDING_PCT",
            type: "FLOAT",
            nullable: "NULL"
        } as SQLType,
        {
            name: "UZR",
            type: "FLOAT",
            nullable: "NULL"
        } as SQLType,
    ],
    HITTING_STATS: [
        {
            name: "ID",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "SEASON_YEAR",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "OPS",
            type: "FLOAT",
            nullable: "NULL"
        } as SQLType,
        {
            name: "WAR",
            type: "FLOAT",
            nullable: "NULL"
        } as SQLType,
    ],
    PITCHING_STATS: [
        {
            name: "ID",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "SEASON_YEAR",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "ERA_MINUS",
            type: "FLOAT",
            nullable: "NULL"
        } as SQLType,
        {
            name: "WAR",
            type: "FLOAT",
            nullable: "NULL"
        } as SQLType,
    ],
    DRAFT_INFO: [
        {
            name: "ID",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "DRAFT_YEAR",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "DRAFT_ROUND",
            type: "VARCHAR",
            size: 20,
            nullable: "NULL"
        } as SQLVarType,
        {
            name: "DRAFT_POSITION",
            type: "INT",
            nullable: "NULL"
        } as SQLType
    ]
} as const;

export const baseURL: string = "https://statsapi.mlb.com/api/v1/";

export function draftURL(year: number, playerID?: number): string {
    return `${baseURL}draft/${year}${playerID ? `?bisPlayerID=${playerID}` : ""}`;
}

export function sabermetricsURL(playerID: number[], year: number) {
    return `${baseURL}people?personIds=${playerID.join(",")}&hydrate=stats(group=[pitching,hitting,fielding],type=[season,sabermetrics],season=${year})`;
}

export function yearlyPlayers(year: number) {
    return `${baseURL}sports/1/players?season=${year}`;
}

export function draftPlayers(year: number) {
    return `${baseURL}draft/${year}`;
}

export function createTableQuery(name: string, attrs: SQLTypeArray, year: boolean) {
    let pkString = year ? `, PRIMARY KEY (\`SEASON_YEAR\`, \`ID\`)` : `, PRIMARY KEY (\`ID\`)`;
    if (name == "DRAFT_INFO") {
        pkString = pkString.replace(")", "") + `, \`DRAFT_YEAR\`)`;
    }
    if (name == "FIELDING_STATS") {
        pkString = pkString.replace(")", "") + `, \`POSITION\`)`;
    }

    const attrString = attrs.map(attr => {
        if (attr["vals"]) {
            const valJoin = attr["vals"].map(val => `"${val}"`).join(",");
            return `\`${attr.name}\` ${attr.type}(${valJoin}) ${attr.nullable}`;
        }
        if (attr["size"]) {
            return `\`${attr.name}\` ${attr.type}(${attr["size"]}) ${attr.nullable}`;
        }
        return `\`${attr.name}\` ${attr.type} ${attr.nullable}`;
    }).join(", ");
    return `CREATE TABLE \`MQP\`.\`${name}\` (${attrString}${pkString})`;

}

async function getDraftInfo(): Promise<void> {
    await new Promise<void>((resolve, _) => {
        dbConnection.query("SELECT COUNT(*) as LENGTH FROM DRAFT_INFO", (err, rows) => {
            if (rows[0].LENGTH > 0) {
                console.log(`There are already ${rows[0].LENGTH} entries in the DRAFT_INFO table. Truncate table if you want to re-enter information.`);
                resolve();
            } else {
                getInfoHelper().finally(() => {
                    resolve();
                });
            }
        })
    })

    async function getInfoHelper() {
        let count = 0;
        for (let year = 1982; year < 2023; year++) {
            console.log(`Adding players to DRAFT_INFO from year ${year}`);
            let raw = await fetch(draftPlayers(year));
            let draftinfo = await raw.json();
            for (var round of draftinfo['drafts']['rounds']) {
                let picks = round["picks"];
                for (var player of picks) {
                    if (player['person']) {
                        let info: DraftPlayer = {
                            id: player['person']['id'],
                            draftYear: year,
                            draftRound: player['pickRound'],
                            draftPosition: player['pickNumber'],
                        }

                        await new Promise<void>((resolve, _) => {
                            dbConnection.query("INSERT INTO DRAFT_INFO VALUES (?, ?, ?, ?)", [...Object.values(info)], (err, _) => {
                                if (!err) {
                                    count++;
                                }
                                resolve();
                            });
                        })
                    }
                }
            }
        }
        console.log(`Added ${count} players to DRAFT_INFO table`);
    }
}

async function getPlayerInformation(): Promise<void> {
    await new Promise<void>((resolve, _) => {
        dbConnection.query("SELECT COUNT(*) as LENGTH FROM PLAYER_INFO", (err, rows) => {
            if (rows[0].LENGTH > 0) {
                console.log(`There are already ${rows[0].LENGTH} entries in the PLAYER_INFO table. Truncate table if you want to re-enter information.`);
                resolve();
            } else {
                getInfoHelper().finally(() => {
                    resolve();
                });
            }
        })
    })

    async function getInfoHelper() {
        console.log("Getting player information from MLB API...");

        let count = 0;
        for (let year = 1982; year < 2023; year++) {
            console.log(`Current Year: ${year}`);

            let res = await fetch(yearlyPlayers(year));
            let json = await res.json();

            for (var player of json['people']) {
                let info: PlayerInformation = {
                    id: player['id'],
                    firstName: player['firstName'],
                    lastName: player['lastName'],
                    birthDate: player['birthDate'],
                    birthCountry: player['birthCountry'],
                    height: player['height'],
                    weight: player['weight'],
                    draftYear: player['draftYear'] ?? 0,
                    mlbDebutDate: player['mlbDebutDate'] ?? "N/A",
                    lastPlayedDate: player['lastPlayedDate'] ?? "N/A",
                    batSide: player['batSide']['code'],
                    pitchHand: player['pitchHand']['code'],
                    strikeZoneTop: player['strikeZoneTop'],
                    strikeZoneBottom: player['strikeZoneBottom'],
                } as const;

                await new Promise<void>((resolve, _) => {
                    dbConnection.query("INSERT INTO PLAYER_INFO VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [...Object.values(info)], (err, _) => {
                        if (!err) {
                            count++;
                        }
                        resolve();
                    });
                })
            }
        }

        console.log(`Finished adding ${count} players into PLAYER_INFO table`);
    }
}

const positions = ["1B", "2B", "3B", "SS", "LF", "RF", "CF",]

async function getPlayerStatistics(): Promise<void> {
    const startTime = Date.now();
    const rows = await new Promise<any>((resolve, reject) => {
        dbConnection.query("SELECT * FROM PLAYER_INFO", (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    })

    const count = await new Promise<any>((resolve, reject) => {
        dbConnection.query("SELECT COUNT(*) as COUNT FROM HITTING_STATS", (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        })
    })
/*
    if (count[0].COUNT > 0) {
        console.log("There are already entries in a STATS table. Truncate table if you want to re-enter information.")
        return;
    }*/

    for (let year = 1982; year < 2023; year++) {
        let filtered = rows.filter(pinfo => {
            let debut = pinfo.MLB_DEBUT_DATE ? Number(pinfo.MLB_DEBUT_DATE?.substring(0, 4)) : -1;
            let last = pinfo.LAST_PLAYED_DATE != "N/A" ? Number(pinfo.LAST_PLAYED_DATE?.substring(0, 4)) : 5000;
            if (debut == -1) {
                return false;
            }
            return debut <= year && year <= last;
        }).map(pinfo => pinfo.ID as number);

        for (var split of splitArray(filtered as any[], 640)) {
            const json = await (await fetch(sabermetricsURL(split, year))).json();
            const players = json['people'];
            for (var player of players) {
                const stats = player['stats'];
                if (!stats || stats.length == 0) {
                    continue;
                }

                const statTypes = stats.map(stat => stat.type.displayName + stat.group.displayName);
                let fielding = stats.filter(stat => stat.type.displayName == "season" && stat.group.displayName == "fielding"), positions;
                if (fielding.length > 0) {
                    positions = fielding[0].splits.map(split => split.position.abbreviation).filter(onlyUnique);
                }

                if ((statTypes.includes("seasonhitting") || statTypes.includes("sabermetricshitting"))) {
                    dbConnection.query("INSERT INTO HITTING_STATS (ID, SEASON_YEAR) VALUES (?, ?)", [player.id, year], (err, res) => {
                        if (err) { }
                    });
                }

                if ((statTypes.includes("seasonfieling") || statTypes.includes("sabermetricsfielding")) && positions) {
                    for (var position of positions) {
                        dbConnection.query("INSERT INTO FIELDING_STATS (ID, SEASON_YEAR, POSITION) VALUES (?, ?, ?)", [player.id, year, position], (err, res) => {
                            if (err) { }
                        });
                    }
                }

                if (statTypes.includes("seasonpitching") || statTypes.includes("sabermetricspitching")) {
                    dbConnection.query("INSERT INTO PITCHING_STATS (ID, SEASON_YEAR) VALUES (?, ?)", [player.id, year], (err, res) => {
                        if (err) { }
                    });
                }

                for (var statSection of stats) {
                    switch (statSection.type.displayName + statSection.group.displayName) {
                        case "sabermetricshitting": {
                            let statSplit = statSection.splits[0];
                            const query = [statSplit.stat.war, player.id, year];
                            dbConnection.query("UPDATE HITTING_STATS SET WAR=? WHERE ID=? AND SEASON_YEAR=?", query)
                            break;
                        }
                        case "seasonhitting": {
                            let statSplit = statSection.splits[0];
                            dbConnection.query("UPDATE HITTING_STATS SET OPS=? WHERE ID=? AND SEASON_YEAR=?", [statSplit.stat.ops, player.id, year])
                            break;
                        }
                        case "sabermetricsfielding": {
                            for (var pos of statSection.splits) {
                                const query = [pos.stat.uzr, player.id, year, pos.stat.position.abbreviation];
                                dbConnection.query("UPDATE FIELDING_STATS SET UZR=? WHERE ID=? AND SEASON_YEAR=? AND POSITION=?", query)
                            }
                            break;
                        }
                        case "seasonfielding": {
                            for (var pos of statSection.splits) {
                                const query = [pos.stat.fielding, player.id, year, pos.stat.position.abbreviation];
                                dbConnection.query("UPDATE FIELDING_STATS SET FIELDING_PCT=? WHERE ID=? AND SEASON_YEAR=? AND POSITION=?", query)
                            }
                            break;
                        }
                        case "sabermetricspitching": {
                            let statSplit = statSection.splits[0];
                            dbConnection.query("UPDATE PITCHING_STATS SET ERA_MINUS=?, WAR=? WHERE ID=? AND SEASON_YEAR=?", [statSplit.stat.eraMinus, statSplit.stat.war, player.id, year])
                            break;
                        }
                    }
                }
            }
        }
    }
    console.log("Time elapsed: " + convertMillisecondsToTime(Date.now() - startTime));
}