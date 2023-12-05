
import express from 'express';
import cors from 'cors';
import {  tryInitializeDatabase } from './api/db';

//const baseAPI: string = "/api/v1";
const app: express.Express = express();

app.set('json spaces', 2)
app.use(cors());

app.listen(8800, async () => {
    //await Test.runAllTests();
    await tryInitializeDatabase();
});

/*app.get(`${baseAPI}/draft`, async (req, res) => {
    getAndProcessData(req, res, "SELECT * FROM DRAFT_INFO", false);
})

app.get(`${baseAPI}/fielding`, async (req, res) => {
    getAndProcessData(req, res, "SELECT * FROM FIELDING_STATS", false);
})

app.get(`${baseAPI}/pitching`, async (req, res) => {
    getAndProcessData(req, res, "SELECT * FROM PITCHING_STATS", false);
})

app.get(`${baseAPI}/hitting`, async (req, res) => {
    getAndProcessData(req, res, "SELECT * FROM HITTING_STATS", false);
})

app.get(`${baseAPI}/info`, async (req, res) => {
    getAndProcessData(req, res, "SELECT * FROM PLAYER_INFORMATION", false);
})*/