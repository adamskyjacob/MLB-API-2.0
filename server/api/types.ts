type BMLArray<T, N extends number, Current extends T[]> = Current['length'] extends N ? [...Current, ...T[]] : BMLArray<T, N, [...Current, T]>;
export type MLArray<T, N extends number> = BMLArray<T, N, []>;

type RoundEntry = {
    round: string,
    stats: {
        war: number,
        uzr: number,
        ops: number,
        fldPct: number,
        eraMinus: number,
        fieldingInnings: number,
        plateAppearances: number,
        inningsPitched: number
    }
};

type StatGroup = {
    sum: number,
    plr_count: number
}

class SectionalValue {
    war: StatGroup;
    uzr: StatGroup;
    ops: StatGroup;
    fldPct: StatGroup;
    eraMinus: StatGroup;
    fieldingInnings: StatGroup;
    plateAppearances: StatGroup;
    inningsPitched: StatGroup;

    constructor() {
        this.war = this.newStatGroup();
        this.uzr = this.newStatGroup();
        this.ops = this.newStatGroup();
        this.fldPct = this.newStatGroup();
        this.eraMinus = this.newStatGroup();
        this.fieldingInnings = this.newStatGroup();
        this.inningsPitched = this.newStatGroup();
        this.plateAppearances = this.newStatGroup();
    }

    private newStatGroup(): StatGroup {
        return {
            sum: 0,
            plr_count: 0
        }
    }
}

class Timer {
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
    _id: number,
    firstName: string,
    lastName: string,
    birthDate: string,
    birthCountry: string,
    height: string,
    weight: number,
    draftYear: number,
    mlbDebutDate: number,
    lastPlayedDate: number,
    batSide: "L" | "R" | "S",
    pitchHand: "L" | "R" | "S"
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
    draftPosition: number,
    isPass: boolean,
    pickValue: number,
    signingBonus: number,
    school: "HS" | "UNI" | "N/A"
}

export {
    PlayerDraftInfo, SQLBasic, SQLEnum, SQLBasicType, SQLType, SQLVarType, SQLTypeArray, PlayerInformation, StatisticsPlayer, DraftPlayer, StatGroup, SectionalValue, Timer, RoundEntry
}
