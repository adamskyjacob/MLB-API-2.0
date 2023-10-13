import { MLArray } from "../api/types";

export interface TestParameter {
    value: any,
    expected: any,
    match: boolean
}

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