export const baseURL: string = "https://statsapi.mlb.com/api/v1/";

export const draftURL = (year: number, playerID?: number): string => {
    const bisPlayerID = playerID ? `?bisPlayerID=${playerID}` : "";
    return `${baseURL}draft/${year}${bisPlayerID}`;
}

export const sabermetricsURL = (playerID: number[], year: (string | number)) => {
    const url = `${baseURL}people?personIds=${playerID.join(",")}&hydrate=stats(group=[pitching,hitting,fielding],type=[season,sabermetrics],season=${year})`;
    return url;
}