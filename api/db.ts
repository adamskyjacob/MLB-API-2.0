
import { createConnection } from 'mysql';

export const tables: string[] = ["HITTING", "PITCHING", "FIELDING", "PITCHING_WAR", "OFFENSIVE_WAR", "DRAFT_INFO", "PLAYER_POSITION"];
export const tableHeaders = {
    PLAYER_POSITION: [
        {
            name: "POSITION",
            nullable: "NOT NULL",
            type: "ENUM",
            vals: [
                "TWP", "P", "1B", "2B", "3B", "SS", "CF", "LF", "RF", "C", "DH", "OF", "IF", "PH"
            ]
        } as SQLEnum,
        {
            name: "PLAYER_ID",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "YEAR_NUM",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
    ],
    DRAFT_INFO: [
        {
            name: "PLAYER_ID",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "FIRST_NAME",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "LAST_NAME",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "DRAFT_YEAR",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "DRAFT_ROUND",
            type: "VARCHAR",
            size: 20,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "DRAFT_POSITION",
            type: "INT",
            nullable: "NULL"
        } as SQLType,
        {
            name: "DEBUT_YEAR",
            type: "INT",
            nullable: "NULL"
        } as SQLType,
        {
            name: "INTERNATIONAL",
            type: "BOOLEAN",
            nullable: "NULL"
        } as SQLBasicType,
    ] as (SQLType | SQLVarType | SQLBasicType)[],
    PITCHING_WAR: [
        {
            name: "WAR",
            type: "FLOAT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "PLAYER_ID",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "YEAR_NUM",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
    ] as (SQLType | SQLVarType | SQLBasicType)[],
    OFFENSIVE_WAR: [
        {
            name: "WAR",
            type: "FLOAT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "PLAYER_ID",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "YEAR_NUM",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "CATCHER",
            type: "BOOLEAN",
            nullable: "NOT NULL"
        } as SQLBasicType,
    ] as (SQLType | SQLVarType | SQLBasicType)[],
    HITTING: [
        {
            name: "OPS",
            type: "FLOAT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "PLAYER_ID",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "YEAR_NUM",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType
    ] as (SQLType | SQLVarType | SQLBasicType)[],
    PITCHING: [
        {
            name: "ERA_MINUS",
            type: "FLOAT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "PLAYER_ID",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "YEAR_NUM",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType
    ] as (SQLType | SQLVarType | SQLBasicType)[],
    FIELDING: [
        {
            name: "FLD_PCT",
            type: "FLOAT",
            nullable: "NOT NULL"
        } as SQLType,
        {
            name: "PLAYER_ID",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
        {
            name: "YEAR_NUM",
            type: "INT",
            nullable: "NOT NULL"
        } as SQLType
    ] as (SQLType | SQLVarType | SQLBasicType)[],
} as const;

export const dbConnection = createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    port: 3306,
    database: "mqp"
})

export type SQLBasic = "TINYBLOB" | "TINYTEXT" | "MEDIUMTEXT" | "MEDIUMBLOB" | "LONGTEXT" | "LONGBLOB" | "BOOL" | "BOOLEAN" | "DATE" | "YEAR";

export type SQLEnum = SQLType & {
    vals: string[],
    type: "ENUM"
}

export type SQLBasicType = {
    name: string,
    type: SQLBasic,
    nullable: "NULL" | "NOT NULL"
}

export type SQLType = {
    name: string,
    type: string,
    nullable: "NULL" | "NOT NULL"
}

export type SQLVarType = SQLType & {
    size: number
}

export function createTableQuery(name: string, attrs: (SQLType | SQLVarType | SQLBasicType | SQLEnum)[], year: boolean) {
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