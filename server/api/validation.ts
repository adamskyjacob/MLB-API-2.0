
export function validatePlayerID(pid: string) {
    const reg = /^[0-9]*$/;
    if (reg.test(pid) && pid.length > 0) {
        return true;
    }
    return false;
}

export function validateYear(year: string) {
    const reg = /^[0-9]*$/;
    if (reg.test(year) && year.length > 0) {
        let yearNum = Number(year);
        return (yearNum < 2023 && yearNum > 2000);
    }
    return false;
}