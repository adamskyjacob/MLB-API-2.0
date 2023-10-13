import { draftURL } from "./api";
import { SQLTypeArray } from "./types";

export function colorString(color: ("R" | "Y" | "G" | "B" | "P"), val: any) {
    function getString() {
        return (val instanceof Array) ? JSON.stringify(val) : val;
    }
    switch (color) {
        case "R": {
            return `\x1b[31m${getString()}\x1b[0m`;
        }
        case "Y": {
            return `\x1b[33m${getString()}\x1b[0m`;
        }
        case "G": {
            return `\x1b[32m${getString()}\x1b[0m`;
        }
        case "B": {
            return `\x1b[34m${getString()}\x1b[0m`;
        }
        case "P": {
            return `\x1b[35m${getString()}\x1b[0m`;
        }
    }
}

export function splitArray<T>(array: T[], size: number): T[][] {
    if (array.length <= size) {
        return [array];
    }
    let result: T[][] = [];
    for (let i = 0; i < Math.ceil(array.length / size); i++) {
        let subArr = [];
        for (let j = 0; j < size; j++) {
            const val = array[i * size + j]
            if (val == undefined) {
                break;
            }
            subArr.push(val);
        }
        result.push(subArr);
    }
    return result;
}

export const getAllPlayers = async (): Promise<{}> => {
    async function getFromYear(year: number) {
        const url = `https://statsapi.mlb.com/api/v1/sports/1/players?season=${year}`;
        const raw = await fetch(url);
        const json = await raw.json();
        return await json["people"].map(player => { return player.id ?? 0 });
    }
    let res = {};
    for (let i = 0; i < 23; i++) {
        const gfy = await getFromYear(2000 + i);
        res[2000 + i] = gfy;
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
    for (let i = 0; i < 43; i++) {
        const gdy = await getDraftYear(1980 + i);
        res[1980 + i] = gdy;
    }
    return res;
}

export function createTableQuery(name: string, attrs: SQLTypeArray, year: boolean) {
    let pkString = year ? `, PRIMARY KEY (\`YEAR_NUM\`, \`PLAYER_ID\`)` : `, PRIMARY KEY (\`PLAYER_ID\`)`;
    if (name == "ALL_WAR") {
        pkString = pkString.replace(")", "") + `, \`POSITION\`)`;
    }
    if (name == "DRAFT_INFO") {
        pkString = pkString.replace(")", "") + `, \`DRAFT_YEAR\`, \`DRAFT_ROUND\`)`;
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