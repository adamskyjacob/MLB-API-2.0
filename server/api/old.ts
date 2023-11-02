/*
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

export const getAllPlayers = async (): Promise<{}> => {
    async function getFromYear(year: number) {
        const url = `https://statsapi.mlb.com/api/v1/sports/1/players?season=${year}`;
        const raw = await fetch(url);
        const json = await raw.json();
        return await json["people"].map(player => { return player.id ?? 0 });
    }
    let res = {};
    for (let i = 0; i < 41; i++) {
        const gfy = await getFromYear(1982 + i);
        res[1982 + i] = gfy;
    }
    return res;
}

export const getAllDraft = async () => {
    async function getDraftYear(year: number) {
        const url = draftURL(year);
        const raw = await fetch(url);
        const json = await raw.json();
        return await json["drafts"]["rounds"];
    }
    let res = {};
    for (let i = 0; i < 41; i++) {
        //Draft info starts at 1982. I checked a SELECT statement on all players present in the league in 2000, and the earliest debut year for all players was 1982, so I wanted to include all stats for players who were present.
        const gdy = await getDraftYear(1982 + i);
        res[1982 + i] = gdy;
    }
    return res;
}


//OLD TABLES
let tables = {
    PLAYER_POSITION: [
        {
            name: "POSITION",
            nullable: "NOT NULL",
            type: "ENUM",
            vals: [
                "TWP", "P", "1B", "2B", "3B", "SS", "CF", "LF", "RF", "C", "DH", "OF", "IF", "PH"
            ]
        } as SQLEnum,
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
    ] as SQLTypeArray,
    DRAFT_INFO: [
        {
            name: "PLAYER_ID",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
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
            name: "DRAFT_YEAR",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "DRAFT_ROUND",
            type: "VARCHAR",
            size: 20,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "DRAFT_POSITION",
            type: "INT",
            nullable: "NULL"
        } as SQLType,
        {
            name: "DEBUT_YEAR",
            type: "INT",
            nullable: "NULL"
        } as SQLType,
        {
            name: "INTERNATIONAL",
            type: "BOOLEAN",
            nullable: "NULL"
        } as SQLBasicType,
    ] as SQLTypeArray,
    PITCHING_WAR: [
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
    ] as SQLTypeArray,
    OFFENSIVE_WAR: [
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
            name: "CATCHER",
            type: "BOOLEAN",
            nullable: "NOT NULL"
        } as SQLBasicType,
    ] as SQLTypeArray,
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
    ] as SQLTypeArray,
    PITCHING: [
        {
            name: "ERA_MINUS",
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
    ] as SQLTypeArray,
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
    ] as SQLTypeArray
}


//OLD EXPRESS ROUTES

app.get(`${baseAPI}/findplayer`, async (req, res) => {
    findPlayerData(req, res);
})

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








dbConnection.query("INSERT INTO POSITION_STATS")
for (var statSection of stats) {
    const statType = statSection.type.displayName + statSection.group.displayName;
    for (var split of statSection.splits) {
        const query = [year, split.position.abbreviation]
        switch (statType) {
            case "seasonfielding": {
                dbConnection.query("UPDATE POSITION_STATS SET FIELDING_PCT=? WHERE ID=? AND SEASON_YEAR=? AND POSITION=?", [split.stat.fielding, ...query]);
                return;
            }
            case "sabermetricsfielding": {
                dbConnection.query("UPDATE POSITION_STATS SET UZR=? WHERE ID=? AND SEASON_YEAR=? AND POSITION=?", [split.stat.fielding, ...query]);
                return;
            }
            case "sabermetricshitting": {
                dbConnection.query("UPDATE POSITION_STATS SET WAR=? WHERE ID=? AND SEASON_YEAR=? AND POSITION=?", [split.stat.fielding, ...query]);
                return;
            }
            case "seasonhitting": {
                dbConnection.query("UPDATE POSITION_STATS SET WAR=? WHERE ID=? AND SEASON_YEAR=? AND POSITION=?", [split.stat.fielding, ...query]);
                return;
            }
        }
    }
}
*/