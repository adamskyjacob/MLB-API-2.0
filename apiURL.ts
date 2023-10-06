export const baseURL: string = "https://statsapi.mlb.com/api/v1/";
export const draftURL = (year: number, playerID: number): string => {
    return `https://statsapi.mlb.com/api/v1/draft`;
}