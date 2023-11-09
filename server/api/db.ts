
import { MysqlError, createConnection } from 'mysql';
import { DraftPlayer, PlayerInformation, SQLBasicType, SQLEnum, SQLType, SQLTypeArray, SQLVarType } from './types';
import { Response, Request } from 'express';
import { colorString, convertMillisecondsToTime, onlyUnique, splitArray } from './util';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { password } from './credentials';

const baseURL: string = "https://statsapi.mlb.com/api/v1/";

function sabermetricsURL(playerID: number[], year: number) {
    return `${baseURL}people?personIds=${playerID.join(",")}&hydrate=stats(group=[pitching,hitting,fielding],type=[season,sabermetrics],season=${year})`;
}

function yearlyPlayers(year: number) {
    return `${baseURL}sports/1/players?season=${year}`;
}

function draftPlayers(year: number) {
    return `${baseURL}draft/${year}`;
}

const uri = `mongodb+srv://admin:${password}@mqp-database.3yyl9tm.mongodb.net/?retryWrites=true&w=majority`;
export const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

export const mongodb = client.db("MLB");

export async function tryInitializeDatabase() {
    const startTime = Date.now();
    await client.connect();
    await getDraftInfo();
    await getPlayerInformation();
    await getPlayerStatistics();
    console.log(`======== FINISHED IN ${convertMillisecondsToTime(Date.now() - startTime)} ========`);
}

async function getDraftInfo(): Promise<void> {
    const draftColletion = mongodb.collection("Draft_Info");
    const draftInfoCount = await draftColletion.countDocuments();
    if (draftInfoCount > 0) {
        console.log(colorString("R", "There are already data entries in this collection. Clear collection to re-enter data"));
        return;
    }
    await getDraftInfoHelper();

    async function getDraftInfoHelper() {
        console.log(colorString("G", "=== Getting draft information from MLB API ==="));
        let count = 0;
        for (let year = 1982; year < 2023; year++) {
            console.log(`+ Getting draft information from ${year}`);
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
                            isPass: player['isPass']
                        }
                        count++;
                        await draftColletion.insertOne(info);
                    }
                }
            }
        }
        console.log(`Added ${count} players to DRAFT_INFO table`);
    }
}

async function getPlayerInformation(): Promise<void> {
    const playerInfoCollection = mongodb.collection("Player_Info");
    const playerInfoCount = await playerInfoCollection.countDocuments();
    if (playerInfoCount > 0) {
        console.log(colorString("R", "There are already data entries in this collection. Clear collection to re-enter data"));
        return;
    }
    await getPlayerInformationHelper();

    async function getPlayerInformationHelper() {
        console.log(colorString("G", "=== Getting player information from MLB API ==="));
        let count = 0;
        for (let year = 1982; year < 2023; year++) {
            console.log(`+ Getting player information from ${year}`);
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
                    pitchHand: player['pitchHand']['code']
                } as const;

                count++;
                await playerInfoCollection.insertOne(info);
            }
        }
        console.log(`Finished adding ${count} players into PLAYER_INFO table`);
    }
}

async function getPlayerStatistics(): Promise<void> {
    const playerInfoCollection = mongodb.collection("Player_Info");

    const fieldingCollection = mongodb.collection("Fielding");
    const hittingCollection = mongodb.collection("Hitting");
    const pitchingCollection = mongodb.collection("Pitching");

    const fieldingCount = await fieldingCollection.countDocuments();
    const hittingCount = await hittingCollection.countDocuments();
    const pitchingCount = await pitchingCollection.countDocuments();

    if (Math.max(fieldingCount, pitchingCount, hittingCount) != 0) {
        console.log(colorString("R", "There are already documents in one of the statistic collections. Clear the collections to re-enter data"));
        return;
    }

    const rowsRaw = playerInfoCollection.find();
    const rows = await rowsRaw.toArray();

    let hittingTable = [], pitchingTable = [], fieldingTable = [];

    console.log(colorString("G", "=== Getting player statistics from MLB API ==="));
    for (let year = 1982; year < 2023; year++) {
        console.log(`+ Getting player statistics from ${year}`);
        let filtered = rows.filter(pinfo => {
            let debut = pinfo.mlbDebutDate ? Number(pinfo.mlbDebutDate?.substring(0, 4)) : -1;
            let last = pinfo.lastPlayedDate != "N/A" ? Number(pinfo.lastPlayedDate?.substring(0, 4)) : 5000;
            if (debut == -1) {
                return false;
            }
            return debut <= year && year <= last;
        }).map(pinfo => pinfo.id as number) as any[];
        const splitArr = splitArray(filtered, 640);
        console.log("SPLIT: ", splitArr.length, "ROWS: ", filtered.length);
        for (var split of splitArr) {
            const json = await (await fetch(sabermetricsURL(split, year))).json();

            for (var player of json['people']) {
                const stats = player['stats'];
                if (!stats || stats.length == 0) {
                    continue;
                }

                const statTypes = stats.map(stat => stat.type.displayName + stat.group.displayName);
                let fielding = stats.filter(stat => stat.type.displayName == "season" && stat.group.displayName == "fielding"), positions;
                if (fielding.length > 0) {
                    positions = fielding[0].splits.map(split => split.position.abbreviation).filter(onlyUnique);
                }

                const saberhitting = stats.filter(stat => stat.type.displayName == "sabermetrics" && stat.group.displayName == "hitting");
                const seasonhitting = stats.filter(stat => stat.group.displayName == "hitting");
                const saberfielding = stats.filter(stat => stat.type.displayName == "sabermetrics" && stat.group.displayName == "fielding");
                const seasonfielding = stats.filter(stat => stat.group.displayName == "fielding");
                const saberpitching = stats.filter(stat => stat.type.displayName == "sabermetrics" && stat.group.displayName == "pitching");

                if ((statTypes.includes("seasonhitting") || statTypes.includes("sabermetricshitting"))) {
                    hittingTable.push({
                        id: player.id,
                        seasonYear: year,
                        war: saberhitting[0]?.splits[0]?.stat?.war ?? 0,
                        ops: seasonhitting[0]?.splits[0]?.stat?.ops ?? 0
                    });
                }

                if ((statTypes.includes("seasonfieling") || statTypes.includes("sabermetricsfielding")) && positions) {
                    for (var position of positions) {
                        fieldingTable.push({
                            id: player.id,
                            seasonYear: year,
                            position: position,
                            uzr: saberfielding[0]?.splits[0]?.stat?.uzr ?? 0,
                            fldPct: seasonfielding[0]?.splits[0]?.stat?.fielding ?? 0
                        })
                    }
                }

                if (statTypes.includes("sabermetricspitching")) {
                    pitchingTable.push({
                        id: player.id,
                        seasonYear: year,
                        eraMinus: saberpitching[0]?.splits[0]?.stat?.eraMinus ?? 0 
                    });
                }
            }
        }
    }
    console.log(hittingTable.length, pitchingTable.length, fieldingTable.length);

    await fieldingCollection.insertMany(fieldingTable);
    await pitchingCollection.insertMany(pitchingTable);
    await hittingCollection.insertMany(hittingTable);
}
