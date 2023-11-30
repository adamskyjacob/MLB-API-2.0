export function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}

export class Timer {
    start: number;

    constructor() {
        this.start = Date.now();
    }

    public getElapsedTime(stringFormat: boolean): string | number {
        const elapsed = Date.now() - this.start;
        if (stringFormat) {
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            return formattedTime;
        } else {
            return elapsed;
        }
    }
}


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

export const baseURL: string = "https://statsapi.mlb.com/api/v1/";

export const yearMax = 2024;

export function sabermetricsURL(playerID: number[], year: number) {
    return `${baseURL}people?personIds=${playerID.join(",")}&hydrate=stats(group=[pitching,hitting,fielding],type=[season,sabermetrics],season=${year})`;
}

export function yearlyPlayers(year: number) {
    return `${baseURL}sports/1/players?season=${year}`;
}

export function draftPlayers(year: number) {
    return `${baseURL}draft/${year}`;
}
