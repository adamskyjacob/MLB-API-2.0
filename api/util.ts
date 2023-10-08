
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

export async function getSabermetrics(ids: number[]) {

}

export const getAllPlayers = async (): Promise<{}> => {
    async function getFromYear(year) {
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