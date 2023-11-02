
import express from 'express';
import cors from 'cors';
import Test from './testing/test';
import { getAndProcessData, processComplexQuery, tryInitializeDatabase } from './api/db';

const baseAPI: string = "/api/v1";
const app: express.Express = express();

app.set('json spaces', 2)
app.use(cors());

app.listen(8800, async () => {
    Test.runAllTests();
    tryInitializeDatabase();
});

app.get(`${baseAPI}/draft_info`, async (req, res) => {
    getAndProcessData(req, res, "SELECT * FROM DRAFT_INFO", false);
})