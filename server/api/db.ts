
import { DraftPlayer, PlayerInformation, SectionalValue } from './types';
import { Timer, colorString, draftPlayers, onlyUnique, sabermetricsURL, splitArray, yearMax, yearlyPlayers } from './util';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { password } from './credentials';

export const client = new MongoClient(`mongodb+srv://admin:${password}@mqp-database.3yyl9tm.mongodb.net/?retryWrites=true&w=majority`, {
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
const yearlyTotals = mongodb.collection("Yearly_Totals");

export async function tryInitializeDatabase() {
    const timer = new Timer();
    await client.connect();
    await getDraftInfo();
    await getPlayerInformation();
    await getPlayerStatistics();
    await getSectionalValue();
    console.log(`======== FINISHED IN ${timer.getElapsedTime(true)} ========`);
}

async function getSectionalValue(): Promise<void> {
    const yearlyTotalsCount = await yearlyTotals.countDocuments()
    if (yearlyTotalsCount > 0) {
        console.log(colorString("R", "There are already data entries in this collection. Clear collection to re-enter data"));
        return;
    }

    let result: any[] = [];
    for (let i = 1982; i < 2024; i++) {
        console.log(`Accumulating per-round statistics for ${i}`);
        const draftInfo = await (await draftColletion.find()).toArray();
        let yearly = {
            year: i,
            intl: new SectionalValue()
        };

        const yearlyFielding = await (await fieldingCollection.find({
            seasonYear: i
        })).toArray();

        const yearlyPitching = await (await pitchingCollection.find({
            seasonYear: i
        })).toArray();

        const yearlyHitting = await (await hittingCollection.find({
            seasonYear: i
        })).toArray();

        for (var doc of yearlyFielding) {
            const draftPlayer = draftInfo.find(draft => draft.id === doc.id);
            if (draftPlayer?.draftRound) {
                yearly[draftPlayer?.draftRound] = yearly[draftPlayer?.draftRound] ?? new SectionalValue();
                yearly[draftPlayer?.draftRound].fldPct.plr_count++;
                yearly[draftPlayer?.draftRound].fldPct.sum += Number(doc.fldPct ?? 0);
                yearly[draftPlayer?.draftRound].uzr.sum += Number(doc.uzr ?? 0);
                yearly[draftPlayer?.draftRound].uzr.plr_count++;
            } else {
                yearly['intl'] = yearly['intl'] ?? new SectionalValue();
                yearly['intl'].fldPct.plr_count++;
                yearly['intl'].fldPct.sum += Number(doc.fldPct ?? 0);
                yearly['intl'].uzr.sum += Number(doc.uzr ?? 0);
                yearly['intl'].uzr.plr_count++;
            }
        }

        for (var doc of yearlyHitting) {
            const draftPlayer = draftInfo.find(draft => draft.id === doc.id);
            if (draftPlayer?.draftRound) {
                yearly[draftPlayer?.draftRound] = yearly[draftPlayer?.draftRound] ?? new SectionalValue();
                yearly[draftPlayer?.draftRound].ops.plr_count++;
                yearly[draftPlayer?.draftRound].ops.sum += Number(doc.ops ?? 0);
                yearly[draftPlayer?.draftRound].war.sum += Number(doc.war ?? 0);
                yearly[draftPlayer?.draftRound].war.plr_count++;
            } else {
                yearly['intl'] = yearly['intl'] ?? new SectionalValue();
                yearly['intl'].ops.plr_count++;
                yearly['intl'].ops.sum += Number(doc.ops ?? 0);
                yearly['intl'].war.sum += Number(doc.war ?? 0);
                yearly['intl'].war.plr_count++;
            }
        }

        for (var doc of yearlyPitching) {
            const draftPlayer = draftInfo.find(draft => draft.id === doc.id);
            if (draftPlayer?.draftRound) {
                yearly[draftPlayer?.draftRound] = yearly[draftPlayer?.draftRound] ?? new SectionalValue();
                yearly[draftPlayer?.draftRound].eraMinus.plr_count++;
                yearly[draftPlayer?.draftRound].eraMinus.sum += Number(doc.eraMinus ?? 0);
            } else {
                yearly['intl'] = yearly['intl'] ?? new SectionalValue();
                yearly['intl'].eraMinus.plr_count++;
                yearly['intl'].eraMinus.sum += Number(doc.eraMinus ?? 0);
            }
        }
        result.push(yearly);
    }

    await yearlyTotals.insertMany(result);
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
    let count = 0;
    for (let year = 1950; year < yearMax; year++) {
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
                    draftInfoTable.push(info);
                }
            }
        }
    }
    await draftColletion.insertMany(draftInfoTable);
    console.log(`Added ${count} players to DRAFT_INFO table.`);
}

async function getPlayerInformation(): Promise<void> {
    const playerInfoCollection = mongodb.collection("Player_Info");
    const playerInfoCount = await playerInfoCollection.countDocuments();
    let playerInfoTable = [], includedIds = [];

    if (playerInfoCount > 0) {
        console.log(colorString("R", "There are already data entries in this collection. Clear collection to re-enter data."));
        return;
    }
    await getPlayerInformationHelper();

    async function getPlayerInformationHelper() {
        console.log(colorString("G", "=== Getting player information from MLB API ==="));
        let count = 0;
        for (let year = 1982; year < yearMax; year++) {
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
                count++;
            }
        }
        await playerInfoCollection.insertMany(playerInfoTable);
        console.log(`Finished adding ${count} players into PLAYER_INFO table.`);
    }
}

async function getPlayerStatistics(): Promise<void> {
    const fieldingCount = await fieldingCollection.countDocuments();
    const hittingCount = await hittingCollection.countDocuments();
    const pitchingCount = await pitchingCollection.countDocuments();

    if (fieldingCount != 0 && pitchingCount != 0 && hittingCount != 0) {
        console.log(colorString("R", "There are already documents in all of the statistics collections. Clear the collections to re-enter data."));
        return;
    }

    let hittingTable = [], pitchingTable = [], fieldingTable = [];

    console.log(colorString("G", "=== Getting player statistics from MLB API ==="));
    for (let year = 1982; year < yearMax; year++) {
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

        for (var split of splitArr) {
            const json = await (await fetch(sabermetricsURL(split, year))).json();
            if (!json['people']) {
                continue;
            }
            for (var player of json['people']) {
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
    console.log("\n")
}
