import { TestParameter, validatePlayerIDParameters, validateYearParameters, colorStringParameters, splitArrayParameters, createTableQueryParameters } from "./testparams";
import { validatePlayerID, validateYear } from "../api/validation";
import { colorString, splitArray } from "../api/util";
import lodash from "lodash";
import { createTableQuery } from "../api/db";

export default class Test {
    static async runAllTests() {
        await new Promise<void>(() => {
            Test.validateFunction("validatePlayerID", validatePlayerID, validatePlayerIDParameters);
            Test.validateFunction("validateYear", validateYear, validateYearParameters);
            Test.validateFunction("colorString", colorString, colorStringParameters);
            Test.validateFunction("splitArray", splitArray, splitArrayParameters);
            Test.validateFunction("createTableQuery", createTableQuery, createTableQueryParameters);
        })
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
                log(lodash.isEqual(splitArray(param.value[0], param.value[1]), param.expected));
            } else {
                log(result == param.expected);
            }
        }
    }
}