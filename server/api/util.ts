export function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}

export function convertMillisecondsToTime(milliseconds) {
    // Calculate hours, minutes, seconds, and milliseconds
    let hours = Math.floor(milliseconds / 3600000);
    milliseconds %= 3600000;
    let minutes = Math.floor(milliseconds / 60000);
    milliseconds %= 60000;
    let seconds = Math.floor(milliseconds / 1000);

    let timeString = '';

    if (hours > 0) {
        timeString += hours + 'h ';
    }

    if (minutes > 0 || hours > 0) {
        timeString += minutes + 'm ';
    }

    if (seconds > 0 || minutes > 0 || hours > 0) {
        timeString += seconds + 's ';
    }

    timeString += milliseconds + 'ms';

    return timeString.trim();
}

export function colorString(color: ("R" | "Y" | "G" | "B" | "P"), val: any) {
    function getString() {
        return (val instanceof Array) ? JSON.stringify(val) : val;
    }
    switch (color) {
        case "R": {
            return `\x1b[31m${getString()}\x1b[0m`;
        }
        case "Y": {
            return `\x1b[33m${getString()}\x1b[0m`;
        }
        case "G": {
            return `\x1b[32m${getString()}\x1b[0m`;
        }
        case "B": {
            return `\x1b[34m${getString()}\x1b[0m`;
        }
        case "P": {
            return `\x1b[35m${getString()}\x1b[0m`;
        }
    }
}

export function splitArray<T>(array: T[], size: number): T[][] {
    if (array.length <= size) {
        return [array];
    }
    let result: T[][] = [];
    for (let i = 0; i < Math.ceil(array.length / size); i++) {
        let subArr = [];
        for (let j = 0; j < size; j++) {
            const val = array[i * size + j]
            if (val == undefined) {
                break;
            }
            subArr.push(val);
        }
        result.push(subArr);
    }
    return result;
}