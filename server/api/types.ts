type BMLArray<T, N extends number, Current extends T[] > = Current['length'] extends N ? [...Current, ...T[]] : BMLArray<T, N, [...Current, T]>;
export type MLArray<T, N extends number> = BMLArray<T, N, []>;

type PlayerDraftInfo = {
    PLAYER_ID: number,
    FIRST_NAME: string,
    LAST_NAME: string,
    DRAFT_YEAR: number,
    DRAFT_ROUND: string,
    DRAFT_POSITION: number,
    DEBUT_YEAR: number,
    INTERNATIONAL: boolean
}

type SQLBasic = "TINYBLOB" | "TINYTEXT" | "MEDIUMTEXT" | "MEDIUMBLOB" | "LONGTEXT" | "LONGBLOB" | "BOOL" | "BOOLEAN" | "DATE" | "YEAR";

type SQLEnum = SQLType & {
    vals: string[],
    type: "ENUM"
}

type SQLBasicType = {
    name: string,
    type: SQLBasic,
    nullable: "NULL" | "NOT NULL"
}

type SQLType = {
    name: string,
    type: string,
    nullable: "NULL" | "NOT NULL"
}

type SQLVarType = SQLType & {
    size: number
}

type SQLTypeArray = (SQLType | SQLVarType | SQLBasicType | SQLEnum)[];

type PlayerInformation = {
    id: number,
    firstName: string,
    lastName: string,
    birthDate: string,
    birthCountry: string,
    height: string,
    weight: number,
    draftYear: number,
    mlbDebutDate: string,
    lastPlayedDate: string,
    batSide: "L" | "R" | "S",
    pitchHand: "L" | "R" | "S",
    pass: boolean
}

type StatisticsPlayer = {
    id: number,
    year: number,
    position: string,
    stats: any[]
}

type DraftPlayer = {
    id: number,
    draftYear: number,
    draftRound: string,
    draftPosition: number
}

export {
    PlayerDraftInfo, SQLBasic, SQLEnum, SQLBasicType, SQLType, SQLVarType, SQLTypeArray, PlayerInformation, StatisticsPlayer, DraftPlayer
}
