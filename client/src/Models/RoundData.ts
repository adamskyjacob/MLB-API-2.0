export default class RoundData {
    round: string;
    stats: {
        [key: string]: number
    }
    constructor(round: string, stats: { [key: string]: number }) {
        this.round = round;
        this.stats = stats;
    }

    static findOverallMaxValue(dataArray: RoundData[]) {
        let overallMaxValue = Number.NEGATIVE_INFINITY;

        dataArray.forEach(obj => {
            const stats = obj.stats;
            Object.values(stats).forEach(value => {
                if (value > overallMaxValue) {
                    overallMaxValue = value;
                }
            });
        });

        return overallMaxValue;
    }
}