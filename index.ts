import core from 'express';
import express from 'express';
import cors from 'cors';

const app: core.Express = express();

app.use(express.json());
app.use(cors());

app.listen(8800, () => {

    `https://statsapi.mlb.com/api/v1/people?personIds=678394&hydrate=stats${encodeURI("(group=[pitching],type=[byDateRange,sabermetrics],startDate=2023-07-26,endDate=2023-08-28)")}`
})
