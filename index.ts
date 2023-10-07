import core from 'express';
import express from 'express';
import cors from 'cors';
import { baseURL, sabermetricsURL } from './api/apiURL';
import { SQLBasicType, SQLType, SQLVarType, createTableQuery, dbConnection } from './api/db';

const baseAPI: string = "/api/v1";
const tables: string[] = ["HITTING", "PITCHING", "FIELDING", "ALL_WAR", "DRAFT_INFO"];
const tableHeaders = {
    DRAFT_INFO: [
        {
            name: "DRAFT_YEAR",
            type: "INT",
            nullable: "NULL"
        },
        {
            name: "DRAFT_ROUND",
            type: "INT",
            nullable: "NULL"
        },
        {
            name: "DRAFT_POSITION",
            type: "INT",
            nullable: "NULL"
        },
        {
            name: "DEBUT_YEAR",
            type: "INT",
            nullable: "NULL"
        },
        {
            name: "INTERNATIONAL",
            type: "BOOLEAN",
            nullable: "NOT NULL"
        }
    ] as (SQLType | SQLVarType | SQLBasicType)[],
    ALL_WAR: [
        {
            name: "WAR",
            type: "FLOAT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "PLAYER_ID",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "YEAR_NUM",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "POSITION",
            type: "BOOLEAN",
            nullable: "NOT NULL"
        } as SQLBasicType,
    ] as (SQLType | SQLVarType | SQLBasicType)[],
    HITTING: [
        {
            name: "OPS",
            type: "FLOAT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "PLAYER_ID",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "YEAR_NUM",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType
    ] as (SQLType | SQLVarType | SQLBasicType)[],
    PITCHING: [
        {
            name: "ERA",
            type: "FLOAT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "PLAYER_ID",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "YEAR_NUM",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType
    ] as (SQLType | SQLVarType | SQLBasicType)[],
    FIELDING: [
        {
            name: "FLD_PCT",
            type: "FLOAT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "PLAYER_ID",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "YEAR_NUM",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType
    ] as (SQLType | SQLVarType | SQLBasicType)[],
} as const;

const app: core.Express = express();
app.use(express.json());
app.use(cors());

app.listen(8800, () => {
    dbConnection.query("SHOW TABLES", (err, res) => {
        const dbTables: string[] = res.map(val => val["Tables_in_mqp"]) as string[];
        for (var table of tables) {
            if (!dbTables.includes(table)) {
                const query = createTableQuery(table, tableHeaders[table], []);
                dbConnection.query(query);
            }
        }
    })
});

app.get(`${baseAPI}/sabermetrics/:pid?`, async (req, _res) => {
    await fetch(sabermetricsURL(Number(req.params.pid))).then(res => {
        res.json().then(json => {
            _res.send(json["people"][0]["stats"] ?? { error: "FAIL" });
        })
    })
});

app.get("", async (req, res) => {
    const yearlyPlayers = await fetch(`${baseURL}sports/1/players`);
    yearlyPlayers.json().then((json) => {
        for (var player of json["people"]) {
            const pos = player["primaryPosition"]
            if (pos == "TWP") {

            } else if (pos == "P") {

            } else {

            }
        }
    });
});