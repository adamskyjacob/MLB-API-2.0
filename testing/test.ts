import { TestParameter, validatePlayerIDParameters, validateYearParameters, colorStringParameters, splitArrayParameters } from "./testparams";
import { validatePlayerID, validateYear } from "../api/validation";
import { colorString, splitArray } from "../api/util";

export default class Test {
    static runAllTests() {
        Test.validateFunction("validatePlayerID", validatePlayerID, validatePlayerIDParameters);
        Test.validateFunction("validateYear", validateYear, validateYearParameters);
        Test.validateFunction("colorString", colorString, colorStringParameters);
        Test.validateFunction("splitArray", splitArray, splitArrayParameters);
    }

    static validateFunction(name: string, funcToTest: Function, testParams: TestParameter[]) {
        console.log(`======= Testing function ${name} =======`);
        let testNumber = 1;
        for (var param of testParams) {
            logResult(param);
        }
        console.log();

        function logResult(param: TestParameter) {
            function log(check: boolean) {
                if (check != param.match) {
                    console.warn(colorString("R", `Test ${testNumber++} failed. Expected ${param.expected} and got ${result}`));
                } else {
                    console.log(colorString("G", `Test ${testNumber++} passed!`));
                }
            }

            let result = funcToTest(...param.value);
            if (result instanceof Array && result[0] instanceof Array) {
                log(Test.checkSplitEqual(splitArray(param.value[0], param.value[1]), param.expected));
            } else {
                log(result == param.expected);
            }
        }
    }

    static checkSplitEqual<T>(first: T[][], second: T[][]): boolean {
        if (first.length != second.length) {
            return false;
        }
        for (let i = 0; i < first.length; i++) {
            if (first[i].length != second[i].length) {
                return false;
            }
            for (let j = 0; j < first[i].length; j++) {
                if (first[i][j] != second[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }
}