
import { MLArray, SQLBasicType, SQLEnum, SQLTypeArray, SQLVarType } from "../api/types";

export interface TestParameter {
    value: any,
    expected: any,
    match: boolean
}

/*const createTableQueryGenerated: TestParameter[] = Object.keys(tableHeaders).map(header => {
    function getQueryFromName(name: string) {
        switch (name) {
            case 'PLAYER_INFO': {
                return 'CREATE TABLE `MQP`.`PLAYER_INFO` (`ID` INT NOT NULL, `FIRST_NAME` VARCHAR(100) NOT NULL, `LAST_NAME` VARCHAR(100) NOT NULL, `BIRTH_DATE` VARCHAR(100) NOT NULL, `BIRTH_COUNTRY` VARCHAR(100) NOT NULL, `HEIGHT` VARCHAR(100) NULL, `WEIGHT` INT NULL, `DRAFT_YEAR` INT NULL, `MLB_DEBUT_DATE` VARCHAR(100) NULL, `LAST_PLAYED_DATE` VARCHAR(100) NULL, `BAT_SIDE` ENUM("L","R","S") NOT NULL, `THROW_SIDE` ENUM("L","R","S") NOT NULL, `STRIKE_ZONE_TOP` FLOAT NULL, `STRIKE_ZONE_BOTTOM` FLOAT NULL, PRIMARY KEY (`ID`))';
            }
            case 'HITTING_STATS': {
                return 'CREATE TABLE `MQP`.`HITTING_STATS` (`ID` INT NOT NULL, `SEASON_YEAR` INT NOT NULL, `OPS` FLOAT NULL, `WAR` FLOAT NULL, PRIMARY KEY (`ID`))';
            }
            case 'PITCHING_STATS': {
                return 'CREATE TABLE `MQP`.`PITCHING_STATS` (`ID` INT NOT NULL, `SEASON_YEAR` INT NOT NULL, `ERA_MINUS` FLOAT NULL, `WAR` FLOAT NULL, PRIMARY KEY (`ID`))';
            }
            case 'FIELDING_STATS': {
                return 'CREATE TABLE `MQP`.`FIELDING_STATS` (`ID` INT NOT NULL, `SEASON_YEAR` INT NOT NULL, `POSITION` VARCHAR(100) NOT NULL, `FIELDING_PCT` FLOAT NULL, `UZR` FLOAT NULL, PRIMARY KEY (`ID`, `POSITION`))';
            }
            case 'DRAFT_INFO': {
                return 'CREATE TABLE `MQP`.`DRAFT_INFO` (`ID` INT NOT NULL, `DRAFT_YEAR` INT NOT NULL, `DRAFT_ROUND` VARCHAR(20) NULL, `DRAFT_POSITION` INT NULL, PRIMARY KEY (`ID`, `DRAFT_YEAR`))';
            }
            default: {
                return 'This case isn\'t being handled.';
            }
        }
    }
    let body = tableHeaders[header] as SQLTypeArray;
    const paramMapping: TestParameter = {
        value: [header, body, body.filter(val => val["name"] == "YEAR_NUM").length == 1],
        expected: getQueryFromName(header),
        match: true
    }
    return paramMapping;
});

export const createTableQueryParameters: TestParameter[] = createTableQueryGenerated.concat(
    [
        {
            value: [
                "TEST",
                [
                    {
                        name: "BLAH",
                        nullable: "NOT NULL",
                        type: "BOOLEAN"
                    } as SQLBasicType,
                    {
                        name: "BLAH",
                        nullable: "NOT NULL",
                        type: "VARCHAR",
                        size: 50
                    } as SQLVarType,
                    {
                        name: "BLAH",
                        nullable: "NOT NULL",
                        type: "ENUM",
                        vals: ["TEST", "TEST2", "TEST3"]
                    } as SQLEnum
                ] as SQLTypeArray,
                true
            ],
            expected: "OP$Y@()( @()YJ$ EJWG(G() GW",
            match: false
        } as TestParameter,
        {
            value: [
                "WEIRD",
                [
                    {
                        name: "WORD",
                        nullable: "NOT NULL",
                        type: "TINYTEXT"
                    } as SQLBasicType,
                    {
                        name: "BLAH",
                        nullable: "NOT NULL",
                        type: "VARCHAR",
                        size: 100
                    } as SQLVarType,
                    {
                        name: "BLAH",
                        nullable: "NOT NULL",
                        type: "ENUM",
                        vals: ["ABC", "DEF", "GHI", "JKL", "MNO", "PQR", "STU", "VWX", "YZ"]
                    } as SQLEnum
                ] as SQLTypeArray,
                true
            ],
            expected: 'CREATE TABLE `MQP`.`WEIRD` (`WORD` TINYTEXT NOT NULL, `BLAH` VARCHAR(100) NOT NULL, `BLAH` ENUM("ABC","DEF","GHI","JKL","MNO","PQR","STU","VWX","YZ") NOT NULL, PRIMARY KEY (`SEASON_YEAR`, `ID`))',
            match: true
        } as TestParameter,
        {
            value: [
                "WEIRD",
                [
                    {
                        name: "WORD",
                        nullable: "NOT NULL",
                        type: "TINYTEXT"
                    } as SQLBasicType,
                    {
                        name: "BLAH",
                        nullable: "NOT NULL",
                        type: "VARCHAR",
                        size: 100
                    } as SQLVarType,
                    {
                        name: "SFHSH",
                        nullable: "NOT NULL",
                        type: "ENUM",
                        vals: ["ABC", "DEF", "GHI", "JKL", "MNO", "PQR", "STU", "VWX", "YZ"]
                    } as SQLEnum,
                    {
                        name: "REEAGEAG",
                        nullable: "NOT NULL",
                        type: "ENUM",
                        vals: [",452qee", "46413tqd", "6234rgsd", "0asfh9"]
                    } as SQLEnum
                ] as SQLTypeArray,
                true
            ],
            expected: "opjerh joqhj-0 yh24hfdj- hwj-35h20erdf s",
            match: false
        } as TestParameter
    ] as TestParameter[]
)*/

export const colorStringParameters: MLArray<TestParameter, 8> = [
    {
        value: ["R", "Test String"],
        expected: "\x1b[31mTest String\x1b[0m",
        match: true
    }, {
        value: ["G", "Test String"],
        expected: "\x1b[32mTest String\x1b[0m",
        match: true
    }, {
        value: ["B", "Test String"],
        expected: "\x1b[34mTest String\x1b[0m",
        match: true
    }, {
        value: ["Y", "Test String"],
        expected: "\x1b[33mTest String\x1b[0m",
        match: true
    }, {
        value: ["P", "Test String"],
        expected: "\x1b[35mTest String\x1b[0m",
        match: true
    }, {
        value: ["\x1b[31m${val}\x1b[0m"],
        expected: "abc123",
        match: false
    }, {
        value: ["\x1b[31m${val}\x1b[0m"],
        expected: "It would be bad if this matched",
        match: false
    }, {
        value: ["\x1b[31m${val}\x1b[0m"],
        expected: "Alakazam",
        match: false
    }
];

export const validateYearParameters: MLArray<TestParameter, 8> = [
    {
        value: ["12345"],
        expected: false,
        match: true
    }, {
        value: ["2004"],
        expected: true,
        match: true
    }, {
        value: ["2008"],
        expected: true,
        match: true
    }, {
        value: ["asfgafsg"],
        expected: false,
        match: true
    }, {
        value: ["$@$%@EAFDF"],
        expected: false,
        match: true
    }, {
        value: ["@#%@#%"],
        expected: false,
        match: true
    }, {
        value: ["awsgasdh"],
        expected: true,
        match: false
    }, {
        value: [""],
        expected: false,
        match: true
    }
];

export const validatePlayerIDParameters: MLArray<TestParameter, 8> = [
    {
        value: ["192jwg"],
        expected: false,
        match: true
    }, {
        value: ["()$JT@$T134"],
        expected: false,
        match: true
    }, {
        value: ["124"],
        expected: true,
        match: true
    }, {
        value: ["2123"],
        expected: true,
        match: true
    }, {
        value: [""],
        expected: false,
        match: true
    }, {
        value: ["abc"],
        expected: false,
        match: true
    }, {
        value: ["!@#"],
        expected: false,
        match: true
    }, {
        value: ["-1234"],
        expected: true,
        match: false
    }
];

export const splitArrayParameters: MLArray<TestParameter, 8> = [
    {
        value: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], 5],
        expected: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20]],
        match: true
    }, {
        value: [[44, 64, 37, 7, 868, 9, 368, 65, 34, 346, 86, 9457, 25], 3],
        expected: [[44, 64, 37], [7, 868, 9], [368, 65, 34], [346, 86, 9457], [25]],
        match: true
    }, {
        value: [["1345", "Gasrg", "egasrh", "^42346gw", "14y3rwhsvs", "61246wgashj", "rasgsajt46", "rhah2t"], 2],
        expected: [["1345", "Gasrg"], ["egasrh", "^42346gw"], ["14y3rwhsvs", "61246wgashj"], ["rasgsajt46", "rhah2t"]],
        match: true
    }, {
        value: [[44, 64, 37, 7, 868, 9, 368, 65, 34, 346, 86, 9457, 25], 3],
        expected: [[44, 64, 37, 7, 868, 9], [368, 65, 34, 346, 86, 9457], [25]],
        match: false
    }, {
        value: [["313h", "24t124t", "14wgss", "12t1wega", "141241sdg", "4614trsdfA", "146t123", "13jrgs", "rh90fs9db", "opjqgwbd9", "9sf09qg"], 7],
        expected: [["313h", "24t124t", "14wgss", "12t1wega", "141241sdg", "4614trsdfA", "146t123"], ["13jrgs", "rh90fs9db", "opjqgwbd9", "9sf09qg"]],
        match: true
    }, {
        value: [["313h", "24t124t", "14wgss", "12t1wega", "141241sdg", "4614trsdfA", "146t123", "13jrgs", "rh90fs9db", "opjqgwbd9", "9sf09qg"], 7],
        expected: [["jf", "wyfh", "rjw4w6", "wkrfg"], ["25trjg", "5kwyrsmhf", "64wsetjd"], ["13jrgs", "rh90fs9db", "opjqgwbd9", "9sf09qg"]],
        match: false
    }, {
        value: [["313h", "24t124t", "14wgss", "12t1wega", "141241sdg", "4614trsdfA", "146t123", "13jrgs", "rh90fs9db", "opjqgwbd9", "9sf09qg"], 7],
        expected: [["jf", "wyfh", "rjw4w6", "wkrfg", "25trjg", "5kwyrsmhf", "64wsetjd"], ["13jrgs", "T4Wesgd", "erjfgn", "9sf09qg"]],
        match: false
    },
    {
        value: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], 5],
        expected: [[1, 2, 3], [4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20]],
        match: false
    },
];