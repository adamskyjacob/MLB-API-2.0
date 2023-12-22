
import express from 'express';
import cors from 'cors';
import { retrievePercentagesPerRound, retrievePercentagesPerStat, tryInitializeDatabase } from './api/db';

//const baseAPI: string = "/api/v1";
const app: express.Express = express();

app.set('json spaces', 2)
app.use(cors());

app.listen(8800, async () => {
    //await Test.runAllTests();
    await tryInitializeDatabase();
});

app.get("/yearly_normalized_per_round", async (req, res) => {
    const data = await retrievePercentagesPerRound();
    res.json(data);
})

app.get("/yearly_normalized_per_stat", async (req, res) => {
    const data = await retrievePercentagesPerStat();
    res.json(data);
})