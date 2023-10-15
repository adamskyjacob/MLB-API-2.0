
import { createConnection } from 'mysql';
import { SQLBasicType, SQLEnum, SQLType, SQLTypeArray, SQLVarType } from './types';

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
    ] as SQLTypeArray,
    DRAFT_INFO: [
        {
            name: "PLAYER_ID",
            type: "VARCHAR",
            size: 100,
            nullable: "NOT NULL"
        } as SQLVarType,
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
    ] as SQLTypeArray,
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
    ] as SQLTypeArray,
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
    ] as SQLTypeArray,
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
    ] as SQLTypeArray,
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
    ] as SQLTypeArray,
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
    ] as SQLTypeArray,
} as const;

export const dbConnection = createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    port: 3306,
    database: "mqp"
});