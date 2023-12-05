
/**
 *   Start off cumulative instead of per year and get percentages of yearly performance
*/

import { DraftPlayer, PlayerInformation, SectionalValue, Timer } from './types';
import { colorString, draftPlayers, onlyUnique, sabermetricsURL, splitArray, yearMax, yearlyPlayers } from './util';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { connectionUrl } from './credentials';

export const client = new MongoClient(connectionUrl, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

export const mongodb = client.db("MLB");
const playerInfoCollection = mongodb.collection("Player_Info");
const fieldingCollection = mongodb.collection("Fielding");
const hittingCollection = mongodb.collection("Hitting");
const pitchingCollection = mongodb.collection("Pitching");
const draftColletion = mongodb.collection("Draft_Info");
const yearlyTotalsCollection = mongodb.collection("Yearly_Totals");
const yearlyPctsCollection = mongodb.collection("Yearly_Percentages");

export async function tryInitializeDatabase() {
    const timer = new Timer();
    await client.connect();
    await getDraftInfo();
    await getPlayerInformation();
    await getPlayerStatistics();
    await getSectionalValue();
    await calculateYearlyPercentages();
    console.log(`======== FINISHED IN ${timer.getElapsedTime(true)} ========`);
}

async function calculateYearlyPercentages(): Promise<void> {
    const yearlyPctsCount = await yearlyPctsCollection.countDocuments();
    if (yearlyPctsCount > 0) {
        console.log(colorString("R", "There are already data entries in this collection. Clear collection to re-enter data"));
        return;
    }

    let statTotals = { uzr: 0, war: 0, ops: 0, fldPct: 0, eraMinus: 0 }

    let rounds: Map<string, {
        war: number,
        uzr: number,
        ops: number,
        fldPct: number,
        eraMinus: number
    }> = new Map();

    for (let i = 2019; i < 2020; i++) {
        console.log(`+ Calculating yearly total percentages from ${i}`);
        const yearlyTotals = await yearlyTotalsCollection.find({ year: i }).toArray();
        for (let year of yearlyTotals) {
            for (let entry of Object.entries(year)) {
                if (["_id", "year"].includes(entry[0])) {
                    continue;
                }

                const [round, yearStats] = [...entry];
                console.log(round, yearStats);
                if (rounds.has(round)) {
                    const stats = rounds.get(round);
                    rounds.set(round, {
                        uzr: stats.uzr + yearStats.uzr,
                        ops: stats.ops + yearStats.ops,
                        war: stats.war + yearStats.war,
                        fldPct: stats.fldPct + yearStats.fldPct,
                        eraMinus: stats.eraMinus + yearStats.eraMinus,
                    })
                } else {
                    rounds.set(round, yearStats);
                }
            }
        }
    }
    console.log(rounds);
}

async function getSectionalValue(): Promise<void> {
    const yearlyTotalsCount = await yearlyTotalsCollection.countDocuments();
    if (yearlyTotalsCount > 0) {
        console.log(colorString("R", "There are already data entries in this collection. Clear collection to re-enter data"));
        return;
    }

    let result: any[] = [];
    for (let i = 2000; i < yearMax; i++) {
        console.log(`+ Accumulating per-round statistics from ${i}`);
        const draftInfo = await (await draftColletion.find()).toArray();
        let yearly = {
            year: i,
            intl: new SectionalValue()
        };

        const [yearlyFielding, yearlyPitching, yearlyHitting] = await Promise.all([
            fieldingCollection.find({ seasonYear: i }).toArray(),
            pitchingCollection.find({ seasonYear: i }).toArray(),
            hittingCollection.find({ seasonYear: i }).toArray(),
        ]);

        for (var doc of yearlyFielding) {
            const draftPlayer = draftInfo.find(draft => draft.id === doc.id);
            const key = draftPlayer?.draftRound || "intl";

            yearly[key] = yearly[draftPlayer?.draftRound] ?? new SectionalValue();
            yearly[key].fldPct.plr_count++;
            yearly[key].fldPct.sum += Number(doc.fldPct ?? 0);
            yearly[key].uzr.sum += Number(doc.uzr ?? 0);
            yearly[key].uzr.plr_count++;
        }

        for (var doc of yearlyHitting) {
            const draftPlayer = draftInfo.find(draft => draft.id === doc.id);
            const key = draftPlayer?.draftRound || "intl";

            yearly[key] = yearly[draftPlayer?.draftRound] ?? new SectionalValue();
            yearly[key].ops.plr_count++;
            yearly[key].ops.sum += Number(doc.ops ?? 0);
            yearly[key].war.sum += Number(doc.war ?? 0);
            yearly[key].war.plr_count++;
        }

        for (var doc of yearlyPitching) {
            const draftPlayer = draftInfo.find(draft => draft.id === doc.id);
            const key = draftPlayer?.draftRound || "intl";

            yearly[key] = yearly[draftPlayer?.draftRound] ?? new SectionalValue();
            yearly[key].eraMinus.plr_count++;
            yearly[key].eraMinus.sum += Number(doc.eraMinus ?? 0);
        }
        result.push(yearly);
    }

    await yearlyTotalsCollection.insertMany(result);
    console.log(colorString("G", "Inserted yearly totals from 1982 to 2024"));
}

async function getDraftInfo(): Promise<void> {
    const draftInfoCount = await draftColletion.countDocuments();
    let draftInfoTable = [];
    if (draftInfoCount > 0) {
        console.log(colorString("R", "There are already data entries in this collection. Clear collection to re-enter data"));
        return;
    }

    console.log(colorString("G", "=== Getting draft information from MLB API ==="));
    for (let year = 1980; year < yearMax; year++) {
        console.log(`+ Getting draft information from ${year}`);
        let raw = await fetch(draftPlayers(year));
        let draftinfo = await raw.json();
        for (var round of draftinfo['drafts']['rounds']) {
            let picks = round["picks"];
            for (var player of picks) {
                if (player['person'] && player['isPass'] === "false") {
                    let info: DraftPlayer = {
                        id: player['person']['id'],
                        draftYear: Number(player['year']),
                        draftRound: player['pickRound'],
                        draftPosition: player['pickNumber'],
                        isPass: player['isPass'],
                        signingBonus: player['signingBonus'],
                        school: player['school'].substring(0, 2) === "HS" ? "HS" : "UNI"
                    }
                    draftInfoTable.push(info);
                }
            }
        }
    }

    await draftColletion.insertMany(draftInfoTable);
    console.log(`Added ${draftInfoTable.length} players to DRAFT_INFO table.`);
}

async function getPlayerInformation(): Promise<void> {
    const playerInfoCount = await playerInfoCollection.countDocuments();
    let playerInfoTable = [], includedIds = [];

    if (playerInfoCount > 0) {
        console.log(colorString("R", "There are already data entries in this collection. Clear collection to re-enter data."));
        return;
    }

    console.log(colorString("G", "=== Getting player information from MLB API ==="));
    for (let year = 1980; year < yearMax; year++) {
        console.log(`+ Getting player information from ${year}`);
        let res = await fetch(yearlyPlayers(year));
        let json = await res.json();

        for (var player of json['people']) {
            if (Number.isNaN(Number(player['mlbDebutDate']?.substring(0, 4))) || includedIds.includes(player['id'])) {
                continue;
            }

            includedIds.push(player['id'])
            playerInfoTable.push({
                _id: player['id'],
                firstName: player['firstName'],
                lastName: player['lastName'],
                birthDate: player['birthDate'],
                birthCountry: player['birthCountry'],
                height: player['height'],
                weight: player['weight'],
                draftYear: player['draftYear'] ?? 0,
                mlbDebutDate: Number(player['mlbDebutDate']?.substring(0, 4)),
                lastPlayedDate: Number(player['lastPlayedDate']?.substring(0, 4)),
                batSide: player['batSide']['code'],
                pitchHand: player['pitchHand']['code']
            } as PlayerInformation);
        }
    }

    await playerInfoCollection.insertMany(playerInfoTable);
    console.log(`Finished adding ${playerInfoTable.length} players into PLAYER_INFO table.`);
}

async function getPlayerStatistics(): Promise<void> {
    let hittingTable = [], pitchingTable = [], fieldingTable = [];
    const [fieldingCount, hittingCount, pitchingCount] = await Promise.all([
        fieldingCollection.countDocuments(),
        hittingCollection.countDocuments(),
        pitchingCollection.countDocuments()
    ]);

    if (fieldingCount != 0 && pitchingCount != 0 && hittingCount != 0) {
        console.log(colorString("R", "There are already documents in all of the statistics collections. Clear the collections to re-enter data."));
        return;
    }

    console.log(colorString("G", "=== Getting player statistics from MLB API ==="));
    for (let year = 1980; year < yearMax; year++) {
        console.log(`+ Getting player statistics from ${year}`);
        const rows = await playerInfoCollection.find({
            "mlbDebutDate": {
                $lte: year
            },
            "lastPlayedDate": {
                $gte: year
            }
        }).toArray();
        const filtered = rows.map(doc => Number(doc._id));
        const splitArr = splitArray(filtered, 640);

        for (let split of splitArr) {
            const json = await (await fetch(sabermetricsURL(split, year))).json();
            if (!json['people']) {
                continue;
            }

            for (let player of json['people']) {
                const stats = player['stats'];
                const statTypes = stats?.map(stat => stat.type.displayName + stat.group.displayName);
                let fielding = stats?.filter(stat => stat.type.displayName == "season" && stat.group.displayName == "fielding"), positions;

                if (!stats || !fielding) {
                    continue;
                }

                if (fielding.length > 0) {
                    positions = fielding[0].splits.map(split => split.position.abbreviation).filter(onlyUnique);
                }

                const saberhitting = stats.filter(stat => stat.type.displayName == "sabermetrics" && stat.group.displayName == "hitting");
                const seasonhitting = stats.filter(stat => stat.group.displayName == "hitting");
                const saberfielding = stats.filter(stat => stat.type.displayName == "sabermetrics" && stat.group.displayName == "fielding");
                const seasonfielding = stats.filter(stat => stat.group.displayName == "fielding");
                const saberpitching = stats.filter(stat => stat.type.displayName == "sabermetrics" && stat.group.displayName == "pitching");

                if ((statTypes.includes("seasonhitting") || statTypes.includes("sabermetricshitting")) && hittingCount == 0) {
                    hittingTable.push({
                        _id: `${player.id}-${year}`,
                        id: player.id,
                        seasonYear: year,
                        war: saberhitting[0]?.splits[0]?.stat?.war ?? 0,
                        ops: seasonhitting[0]?.splits[0]?.stat?.ops ?? 0
                    });
                }

                if ((statTypes.includes("seasonfielding") || statTypes.includes("sabermetricsfielding")) && positions && fieldingCount == 0) {
                    for (var position of positions) {
                        fieldingTable.push({
                            _id: `${player.id}-${year}-${position}`,
                            id: player.id,
                            seasonYear: year,
                            position: position,
                            uzr: saberfielding[0]?.splits[0]?.stat?.uzr ?? 0,
                            fldPct: seasonfielding[0]?.splits[0]?.stat?.fielding ?? 0
                        })
                    }
                }

                if (statTypes.includes("sabermetricspitching") && pitchingCount == 0) {
                    pitchingTable.push({
                        _id: `${player.id}-${year}`,
                        id: player.id,
                        seasonYear: year,
                        eraMinus: saberpitching[0]?.splits[0]?.stat?.eraMinus ?? 0
                    });
                }
            }
        }
    }

    if (hittingCount == 0) {
        await hittingCollection.insertMany(hittingTable);
        console.log(colorString("G", `Added ${hittingTable.length} entries to Hitting collection.`));
    }
    if (pitchingCount == 0) {
        await pitchingCollection.insertMany(pitchingTable);
        console.log(colorString("G", `Added ${pitchingTable.length} entries to Pitching collection.`));
    }
    if (fieldingCount == 0) {
        await fieldingCollection.insertMany(fieldingTable);
        console.log(colorString("G", `Added ${fieldingTable.length} entries to Fielding collection.`));
    }
}
