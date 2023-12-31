
import { DraftPlayer, PlayerInformation, RoundEntry, SectionalValue, StatGroup, Timer } from './types';
import { calculateNumericInning, colorString, draftPlayers, onlyUnique, sabermetricsURL, splitArray, yearMax, yearlyPlayers } from './util';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { connectionUrl } from './credentials';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function getInput(): Promise<string> {
    return new Promise((resolve) => {
        rl.question('Do you want to clear all collections before data entry?\n', (answer) => {
            resolve(answer.trim().toLowerCase());
        });
    });
}

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
const yearlyTotalsNormalizedCollection = mongodb.collection("Yearly_Totals_Normalized");
const yearlyPercentagesCollection = mongodb.collection("Yearly_Percentages");
const yearlyPercentagesNormalizedCollection = mongodb.collection("Yearly_Percentages_Normalized");

export async function retrievePercentagesPerRound() {
    return await yearlyPercentagesNormalizedCollection.find().toArray();
}

export async function retrievePercentagesPerStat() {
    const data = await yearlyPercentagesNormalizedCollection.find().toArray();

    return [
        { statName: "war", rounds: data.map(d => { return { round: d.round, percent: d.stats.war } }) },
        { statName: "uzr", rounds: data.map(d => { return { round: d.round, percent: d.stats.uzr } }) },
        { statName: "ops", rounds: data.map(d => { return { round: d.round, percent: d.stats.ops } }) },
        { statName: "fldPct", rounds: data.map(d => { return { round: d.round, percent: d.stats.fldPct } }) },
        { statName: "eraMinus", rounds: data.map(d => { return { round: d.round, percent: d.stats.eraMinus } }) },
        { statName: "inningsPitched", rounds: data.map(d => { return { round: d.round, percent: d.stats.inningsPitched } }) },
        { statName: "fieldingInnings", rounds: data.map(d => { return { round: d.round, percent: d.stats.fieldingInnings } }) },
        { statName: "plateAppearances", rounds: data.map(d => { return { round: d.round, percent: d.stats.plateAppearances } }) }
    ]
}

export async function tryInitializeDatabase() {
    let clearDB;
    while (clearDB === undefined || clearDB === null) {
        const input = await getInput();
        if (!["yes", "no"].includes(input)) {
            console.log('Invalid response.');
            continue;
        }

        clearDB = input === "yes" ? true : false;
    }
    rl.close();

    const timer = new Timer();
    await client.connect();
    if (clearDB) {
        await yearlyTotalsCollection.deleteMany({});
        await yearlyTotalsNormalizedCollection.deleteMany({});
        await yearlyPercentagesCollection.deleteMany({});
        await yearlyPercentagesNormalizedCollection.deleteMany({});
    }

    await getDraftInfo();
    await getPlayerInformation();
    await getPlayerStatistics();
    await getYearlyTotals();
    await getYearlyPercentages();
    await getNormalizedYearlyTotals();
    await getNormalizedYearlyPercentages();

    const normalized = await yearlyPercentagesNormalizedCollection.aggregate([
        {
            $group: {
                _id: null,
                totalWar: { $sum: "$stats.war" },
                totalUZR: { $sum: "$stats.uzr" },
                totalOps: { $sum: "$stats.ops" },
                totalFldPct: { $sum: "$stats.fldPct" },
                totalEraMinus: { $sum: "$stats.eraMinus" },
                totalInningsPitched: { $sum: "$stats.inningsPitched" },
                totalPlateAppearances: { $sum: "$stats.plateAppearances" },
                totalFieldingInnings: { $sum: "$stats.fieldingInnings" }
            }
        }
    ]).toArray();

    const standard = await yearlyPercentagesCollection.aggregate([
        {
            $group: {
                _id: null,
                totalWar: { $sum: "$stats.war" },
                totalUZR: { $sum: "$stats.uzr" },
                totalOps: { $sum: "$stats.ops" },
                totalFldPct: { $sum: "$stats.fldPct" },
                totalEraMinus: { $sum: "$stats.eraMinus" },
                totalInningsPitched: { $sum: "$stats.inningsPitched" },
                totalPlateAppearances: { $sum: "$stats.plateAppearances" },
                totalFieldingInnings: { $sum: "$stats.fieldingInnings" }
            }
        }
    ]).toArray();

    console.log(JSON.stringify(await yearlyPercentagesNormalizedCollection.find().toArray(), null, 2));

    console.log(normalized, standard);
    console.log(`======== FINISHED IN ${timer.getElapsedTime(true)} ========`);
}

async function getNormalizedYearlyPercentages(): Promise<void> {
    const yearlyPercentagesNormalizedCount = await yearlyPercentagesNormalizedCollection.countDocuments();
    if (yearlyPercentagesNormalizedCount > 0) {
        console.log(colorString("R", "There are already data entries in this collection. Clear collection to re-enter data"));
        return;
    }

    let map: Map<string, {
        war: StatGroup,
        uzr: StatGroup,
        ops: StatGroup,
        fldPct: StatGroup,
        eraMinus: StatGroup,
        inningsPitched: StatGroup,
        plateAppearances: StatGroup,
        fieldingInnings: StatGroup
    }> = new Map();

    let [warTotal, uzrTotal, opsTotal, fldPctTotal, eraMinusTotal, inningsPitchedTotal, plateAppearancesTotal, fieldingInningsTotal] = [0, 0, 0, 0, 0, 0, 0, 0];

    for (let i = 2000; i < yearMax; i++) {
        console.log(`+ Calculating normalized yearly total percentages from ${i}`);
        const yearlyTotals = (await yearlyTotalsNormalizedCollection.find({ year: i }).toArray())[0];
        for (let entry of Object.entries(yearlyTotals)) {
            if (["_id", "year"].includes(entry[0])) {
                continue;
            }

            warTotal += Number(entry[1]['war']['sum']);
            uzrTotal += Number(entry[1]['uzr']['sum']);
            opsTotal += Number(entry[1]['ops']['sum']);
            fldPctTotal += Number(entry[1]['fldPct']['sum']);
            eraMinusTotal += Number(entry[1]['eraMinus']['sum']);
            inningsPitchedTotal += Number(entry[1]['inningsPitched']['sum']);
            plateAppearancesTotal += Number(entry[1]['plateAppearances']['sum']);
            fieldingInningsTotal += Number(entry[1]['fieldingInnings']['sum']);

            if (map.has(entry[0])) {
                const prev = map.get(entry[0]);
                map.set(entry[0], {
                    war: {
                        sum: prev.war.sum + entry[1]['war']['sum'],
                        plr_count: prev.war.plr_count + entry[1]['war']['plr_count'],
                    },
                    uzr: {
                        sum: prev.uzr.sum + entry[1]['uzr']['sum'],
                        plr_count: prev.uzr.plr_count + entry[1]['uzr']['plr_count'],
                    },
                    ops: {
                        sum: prev.ops.sum + entry[1]['ops']['sum'],
                        plr_count: prev.ops.plr_count + entry[1]['ops']['plr_count'],
                    },
                    fldPct: {
                        sum: prev.fldPct.sum + entry[1]['fldPct']['sum'],
                        plr_count: prev.fldPct.plr_count + entry[1]['fldPct']['plr_count'],
                    },
                    eraMinus: {
                        sum: prev.eraMinus.sum + entry[1]['eraMinus']['sum'],
                        plr_count: prev.eraMinus.plr_count + entry[1]['eraMinus']['plr_count'],
                    },
                    inningsPitched: {
                        sum: prev.inningsPitched.sum + entry[1]['inningsPitched']['sum'],
                        plr_count: prev.inningsPitched.plr_count + entry[1]['inningsPitched']['plr_count'],
                    },
                    plateAppearances: {
                        sum: prev.plateAppearances.sum + entry[1]['plateAppearances']['sum'],
                        plr_count: prev.plateAppearances.plr_count + entry[1]['plateAppearances']['plr_count'],
                    },
                    fieldingInnings: {
                        sum: prev.fieldingInnings.sum + entry[1]['fieldingInnings']['sum'],
                        plr_count: prev.fieldingInnings.plr_count + entry[1]['fieldingInnings']['plr_count'],
                    },
                });
            } else {
                map.set(entry[0], entry[1]);
            }
        }
    }

    let percentByRoundTable: RoundEntry[] = [];
    for (let [key, value] of map.entries()) {
        let round: RoundEntry = {
            round: key,
            stats: {
                war: value.war.sum / warTotal,
                uzr: value.uzr.sum / uzrTotal,
                ops: value.ops.sum / opsTotal,
                fldPct: value.fldPct.sum / fldPctTotal,
                eraMinus: value.eraMinus.sum / eraMinusTotal,
                inningsPitched: value.inningsPitched.sum / inningsPitchedTotal,
                plateAppearances: value.plateAppearances.sum / plateAppearancesTotal,
                fieldingInnings: value.fieldingInnings.sum / fieldingInningsTotal
            }
        }
        percentByRoundTable.push(round);
    }

    await yearlyPercentagesNormalizedCollection.insertMany(percentByRoundTable);
    console.log(colorString("G", "Inserted normalized per-round stat percentages (includes all stats from 2000 to 2023)"));
}

async function getNormalizedYearlyTotals(): Promise<void> {
    const normalizedYearlyTotalsCount = await yearlyTotalsNormalizedCollection.countDocuments();
    if (normalizedYearlyTotalsCount > 0) {
        console.log(colorString("R", "There are already data entries in this collection. Clear collection to re-enter data"));
        return;
    }

    let result: any[] = [];
    const [uzrMin, opsMin, warMin, fldPctMin, eraMinusMin]: number[] = await Promise.all([
        Math.abs((await fieldingCollection.find().toArray()).sort((a, b) => a.uzr - b.uzr)[0]['uzr']),
        Math.abs((await hittingCollection.find().toArray()).sort((a, b) => a.ops - b.ops)[0]['ops']),
        Math.abs((await hittingCollection.find().toArray()).sort((a, b) => a.war - b.war)[0]['war']),
        Math.abs((await fieldingCollection.find().toArray()).sort((a, b) => a.fldPct - b.fldPct)[0]['fldPct']),
        Math.abs((await pitchingCollection.find().toArray()).sort((a, b) => a.eraMinus - b.eraMinus)[0]['eraMinus'])
    ])

    for (let i = 2000; i < yearMax; i++) {
        console.log(`+ Accumulating per-round statistics from ${i}`);
        const draftInfo = await (await draftColletion.find()).toArray();
        let yearly = {
            year: i
        };

        const [yearlyFielding, yearlyPitching, yearlyHitting] = await Promise.all([
            fieldingCollection.find({ seasonYear: i }).toArray(),
            pitchingCollection.find({ seasonYear: i }).toArray(),
            hittingCollection.find({ seasonYear: i }).toArray(),
        ]);

        for (var doc of yearlyFielding) {
            const draftPlayer = draftInfo.find(draft => draft.id === doc.id);
            const key = draftPlayer?.draftRound || "intl";
            const fieldingInnings = calculateNumericInning(doc.innings ?? 0);

            yearly[key] = yearly[key] ?? new SectionalValue();
            yearly[key].fldPct.plr_count++;
            yearly[key].fldPct.sum += Number(doc.fldPct ?? 0) + (fldPctMin ?? 0);
            yearly[key].uzr.plr_count++;
            yearly[key].uzr.sum += Number(doc.uzr ?? 0) + (uzrMin ?? 0);
            yearly[key].fieldingInnings.plr_count++;
            yearly[key].fieldingInnings.sum += Number(fieldingInnings);
        }

        for (var doc of yearlyHitting) {
            const draftPlayer = draftInfo.find(draft => draft.id === doc.id);
            const key = draftPlayer?.draftRound || "intl";

            yearly[key] = yearly[key] ?? new SectionalValue();
            yearly[key].ops.plr_count++;
            yearly[key].ops.sum += Number(doc.ops ?? 0) + (opsMin ?? 0);
            yearly[key].war.plr_count++;
            yearly[key].war.sum += Number(doc.war ?? 0) + (warMin ?? 0);
            yearly[key].plateAppearances.plr_count++;
            yearly[key].plateAppearances.sum += Number(doc.plateAppearances ?? 0);
        }

        for (var doc of yearlyPitching) {
            const draftPlayer = draftInfo.find(draft => draft.id === doc.id);
            const key = draftPlayer?.draftRound || "intl";
            const inningsPitched = calculateNumericInning(doc.inningsPitched ?? 0);

            yearly[key] = yearly[key] ?? new SectionalValue();
            yearly[key].eraMinus.plr_count++;
            yearly[key].eraMinus.sum += Number(doc.eraMinus ?? 0) + (eraMinusMin ?? 0);
            yearly[key].inningsPitched.plr_count++;
            yearly[key].inningsPitched.sum += Number(inningsPitched);
        }
        result.push(yearly);
    }

    await yearlyTotalsNormalizedCollection.insertMany(result);
    console.log(colorString("G", "Inserted normalized yearly totals from 2000 to 2023"));
}

async function getYearlyPercentages(): Promise<void> {
    const yearlyPercentagesCount = await yearlyPercentagesCollection.countDocuments();
    if (yearlyPercentagesCount > 0) {
        console.log(colorString("R", "There are already data entries in this collection. Clear collection to re-enter data"));
        return;
    }

    let map: Map<string, {
        war: StatGroup,
        uzr: StatGroup,
        ops: StatGroup,
        fldPct: StatGroup,
        eraMinus: StatGroup,
        inningsPitched: StatGroup,
        plateAppearances: StatGroup,
        fieldingInnings: StatGroup
    }> = new Map();

    let [warTotal, uzrTotal, opsTotal, fldPctTotal, eraMinusTotal, inningsPitchedTotal, plateAppearancesTotal, fieldingInningsTotal] = [0, 0, 0, 0, 0, 0, 0, 0];

    for (let i = 2000; i < yearMax; i++) {
        console.log(`+ Calculating yearly total percentages from ${i}`);
        const yearlyTotals = (await yearlyTotalsCollection.find({ year: i }).toArray())[0];
        for (let entry of Object.entries(yearlyTotals)) {
            if (["_id", "year"].includes(entry[0])) {
                continue;
            }

            warTotal += Number(entry[1]['war']['sum']);
            uzrTotal += Number(entry[1]['uzr']['sum']);
            opsTotal += Number(entry[1]['ops']['sum']);
            fldPctTotal += Number(entry[1]['fldPct']['sum']);
            eraMinusTotal += Number(entry[1]['eraMinus']['sum']);
            inningsPitchedTotal += Number(entry[1]['inningsPitched']['sum']);
            plateAppearancesTotal += Number(entry[1]['plateAppearances']['sum']);
            fieldingInningsTotal += Number(entry[1]['fieldingInnings']['sum']);

            if (map.has(entry[0])) {
                const prev = map.get(entry[0]);
                map.set(entry[0], {
                    war: {
                        sum: prev.war.sum + entry[1]['war']['sum'],
                        plr_count: prev.war.plr_count + entry[1]['war']['plr_count'],
                    },
                    uzr: {
                        sum: prev.uzr.sum + entry[1]['uzr']['sum'],
                        plr_count: prev.uzr.plr_count + entry[1]['uzr']['plr_count'],
                    },
                    ops: {
                        sum: prev.ops.sum + entry[1]['ops']['sum'],
                        plr_count: prev.ops.plr_count + entry[1]['ops']['plr_count'],
                    },
                    fldPct: {
                        sum: prev.fldPct.sum + entry[1]['fldPct']['sum'],
                        plr_count: prev.fldPct.plr_count + entry[1]['fldPct']['plr_count'],
                    },
                    eraMinus: {
                        sum: prev.eraMinus.sum + entry[1]['eraMinus']['sum'],
                        plr_count: prev.eraMinus.plr_count + entry[1]['eraMinus']['plr_count'],
                    },
                    inningsPitched: {
                        sum: prev.inningsPitched.sum + entry[1]['inningsPitched']['sum'],
                        plr_count: prev.inningsPitched.plr_count + entry[1]['inningsPitched']['plr_count'],
                    },
                    plateAppearances: {
                        sum: prev.plateAppearances.sum + entry[1]['plateAppearances']['sum'],
                        plr_count: prev.plateAppearances.plr_count + entry[1]['plateAppearances']['plr_count'],
                    },
                    fieldingInnings: {
                        sum: prev.fieldingInnings.sum + entry[1]['fieldingInnings']['sum'],
                        plr_count: prev.fieldingInnings.plr_count + entry[1]['fieldingInnings']['plr_count'],
                    },
                });
            } else {
                map.set(entry[0], entry[1]);
            }
        }
    }

    let percentByRoundTable: RoundEntry[] = [];
    for (let [key, value] of map.entries()) {
        let round: RoundEntry = {
            round: key,
            stats: {
                war: value.war.sum / warTotal,
                uzr: value.uzr.sum / uzrTotal,
                ops: value.ops.sum / opsTotal,
                fldPct: value.fldPct.sum / fldPctTotal,
                eraMinus: value.eraMinus.sum / eraMinusTotal,
                inningsPitched: value.inningsPitched.sum / inningsPitchedTotal,
                plateAppearances: value.plateAppearances.sum / plateAppearancesTotal,
                fieldingInnings: value.fieldingInnings.sum / fieldingInningsTotal
            }
        }
        percentByRoundTable.push(round);
    }

    let warpercent = 0;
    for (var obj of percentByRoundTable) {
        warpercent += obj.stats.eraMinus;
    }
    await yearlyPercentagesCollection.insertMany(percentByRoundTable);
    console.log(colorString("G", "Inserted per-round stat percentages (includes all stats from 2000 to 2023)"));
}

async function getYearlyTotals(): Promise<void> {
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
            year: i
        };

        const [yearlyFielding, yearlyPitching, yearlyHitting] = await Promise.all([
            fieldingCollection.find({ seasonYear: i }).toArray(),
            pitchingCollection.find({ seasonYear: i }).toArray(),
            hittingCollection.find({ seasonYear: i }).toArray(),
        ]);

        for (var doc of yearlyFielding) {
            const draftPlayer = draftInfo.find(draft => draft.id === doc.id);
            const key = draftPlayer?.draftRound || "intl";
            const fieldingInnings = calculateNumericInning(doc.innings ?? 0);

            yearly[key] = yearly[key] ?? new SectionalValue();
            yearly[key].fldPct.plr_count++;
            yearly[key].fldPct.sum += Number(doc.fldPct ?? 0);
            yearly[key].uzr.plr_count++;
            yearly[key].uzr.sum += Number(doc.uzr ?? 0);
            yearly[key].fieldingInnings.plr_count++;
            yearly[key].fieldingInnings.sum += Number(fieldingInnings);
        }

        for (var doc of yearlyHitting) {
            const draftPlayer = draftInfo.find(draft => draft.id === doc.id);
            const key = draftPlayer?.draftRound || "intl";

            yearly[key] = yearly[key] ?? new SectionalValue();
            yearly[key].ops.plr_count++;
            yearly[key].ops.sum += Number(doc.ops ?? 0);
            yearly[key].war.plr_count++;
            yearly[key].war.sum += Number(doc.war ?? 0);
            yearly[key].plateAppearances.plr_count++;
            yearly[key].plateAppearances.sum += Number(doc.plateAppearances ?? 0);
        }

        for (var doc of yearlyPitching) {
            const draftPlayer = draftInfo.find(draft => draft.id === doc.id);
            const key = draftPlayer?.draftRound || "intl";
            const inningsPitched = calculateNumericInning(doc.inningsPitched ?? 0);

            yearly[key] = yearly[key] ?? new SectionalValue();
            yearly[key].eraMinus.plr_count++;
            yearly[key].eraMinus.sum += Number(doc.eraMinus ?? 0);
            yearly[key].inningsPitched.plr_count++;
            yearly[key].inningsPitched.sum += Number(inningsPitched);
        }
        result.push(yearly);
    }

    await yearlyTotalsCollection.insertMany(result);
    console.log(colorString("G", "Inserted yearly totals from 2000 to 2023"));
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
                if (player['person']) {
                    let school: "UNI" | "HS" | "N/A";
                    const schoolName = player['school']['name'];
                    const schoolClass = player['school']['schoolClass'];

                    if (schoolClass) {
                        school = schoolClass.substring(0, 2) === "HS" ? "HS" : "UNI";
                    } else if (schoolName) {
                        if (schoolName.split(" ").includes("HS")) {
                            school = "HS";
                        } else {
                            school = "UNI";
                        }
                    } else {
                        school = "N/A";
                    }

                    let info: DraftPlayer = {
                        id: player['person']['id'] ?? 0,
                        draftYear: year,
                        draftRound: player['pickRound'] ?? 0,
                        draftPosition: player['pickNumber'] ?? 0,
                        isPass: player['isPass'] ?? false,
                        signingBonus: player['signingBonus'] ?? 0,
                        pickValue: player['pickValue'] ?? 0,
                        school: school
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
                lastPlayedDate: Number(player['lastPlayedDate']?.substring(0, 4) ?? 10000),
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
                const seasonhitting = stats.filter(stat => stat.type.displayName == "season" && stat.group.displayName == "hitting");
                const saberfielding = stats.filter(stat => stat.type.displayName == "sabermetrics" && stat.group.displayName == "fielding");
                const seasonfielding = stats.filter(stat => stat.type.displayName == "season" && stat.group.displayName == "fielding");
                const saberpitching = stats.filter(stat => stat.type.displayName == "sabermetrics" && stat.group.displayName == "pitching");
                const seasonpitching = stats.filter(stat => stat.type.displayName == "season" && stat.group.displayName == "pitching");

                if ((statTypes.includes("seasonhitting") || statTypes.includes("sabermetricshitting")) && hittingCount == 0) {
                    hittingTable.push({
                        _id: `${player.id}-${year}`,
                        id: player.id,
                        seasonYear: year,
                        war: saberhitting[0]?.splits[0]?.stat?.war ?? 0,
                        ops: seasonhitting[0]?.splits[0]?.stat?.ops ?? 0,
                        plateAppearances: seasonhitting[0]?.splits[0]?.stat?.plateAppearances ?? 0
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
                            fldPct: seasonfielding[0]?.splits[0]?.stat?.fielding ?? 0,
                            innings: seasonfielding[0]?.splits[0].stat?.innings ?? 0
                        })
                    }
                }

                if (statTypes.includes("sabermetricspitching") && pitchingCount == 0) {
                    pitchingTable.push({
                        _id: `${player.id}-${year}`,
                        id: player.id,
                        seasonYear: year,
                        eraMinus: saberpitching[0]?.splits[0]?.stat?.eraMinus ?? 0,
                        inningsPitched: seasonpitching[0]?.splits[0].stat?.inningsPitched ?? 0
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
