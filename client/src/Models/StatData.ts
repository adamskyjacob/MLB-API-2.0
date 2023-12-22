export default class StatData {
    statName: string;
    rounds: RoundValue[];

    constructor(statName: string, rounds: RoundValue[]) {
        this.statName = statName;
        this.rounds = rounds;
    }
}

class RoundValue {
    round: string;
    percent: number;

    constructor(round: string, percent: number) {
        this.round = round;
        this.percent = percent;
    }
}