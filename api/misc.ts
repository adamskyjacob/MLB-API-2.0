import { SQLBasicType, SQLType, SQLVarType } from "./db";

function between(val: number, lower: number, upper: number) {
    return ((val >= lower) && (val <= upper));
}

const VARSQLTYPE = (name: string, size: number, type: string, nullable: boolean): (SQLVarType | SQLType | SQLBasicType) => {
    const nullStr = nullable ? "NULL" : "NOT NULL";
    switch (name) {
        case "BIT": {
            if (between(size, 1, 64)) {
                return {
                    name: name,
                    type: type,
                    size: size,
                    nullable: nullStr
                }
            }
            throw Error(`Invalid size for type BIT. Size of ${size} is too ${size > 64 ? "big" : "small"}.`);
        }
        case "SMALLINT":
        case "MEDIUMINT":
        case "BIGINT":
        case "INT":
            if (between(size, 0, 255)) {
                return {
                    name: name,
                    type: type,
                    size: size,
                    nullable: nullStr
                }
            }
            throw Error(`Invalid size for type ${name}. Size of ${size} is too ${size > 255 ? "big" : "small"}.`);
        case "BINARY":
        case "CHAR": {
            if (between(size, 0, 255)) {
                return {
                    name: name,
                    type: type,
                    size: size,
                    nullable: nullStr
                }
            }
            throw Error(`Invalid size for type ${name}. Size of ${size} is too ${size > 255 ? "big" : "small"}.`);
        }
        case "BLOB":
        case "TEXT":
        case "VARCHAR": {
            if (between(size, 0, 65535)) {
                return {
                    name: name,
                    type: type,
                    size: size,
                    nullable: nullStr
                }
            } else {
                throw Error(`Invalid size for type ${name}. Size of ${size} is too ${size > 255 ? "big" : "small"}.`);
            }
        }
        case "VARBINRAY": {
            return {
                name: name,
                type: type,
                size: size,
                nullable: nullStr
            }
        }
        case "FLOAT":
        case "DOUBLE":
        case "DOUBLE_PRECISION":
        case "DEC":
        case "DECIMAL":
        case "DATETIME":
        case "TIMESTAMP":
        case "TIME": {
            return {
                name: name,
                type: type,
                nullable: nullStr
            }
        }
        default: {
            throw Error(`Invalid MySQL column type. ${name} is not a valid type.`);
        }
    }
}