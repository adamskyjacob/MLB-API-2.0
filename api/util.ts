import { draftURL } from "./api";

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
    async function getFromYear(year:number) {
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

export type PlayerDraftInfo = {
    PLAYER_ID: number,
    FIRST_NAME: string,
    LAST_NAME: string,
    DRAFT_YEAR: number,
    DRAFT_ROUND: string,
    DRAFT_POSITION: number,
    DEBUT_YEAR: number,
    INTERNATIONAL: boolean
}