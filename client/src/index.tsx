import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import BarGraphRoundDistributor from './component/BarGraphRoundDistributor';
import BarGraphStatsDistributor from './component/BarGraphStatsDistributor';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/Rounds" element={<BarGraphRoundDistributor />} />
                <Route path="/Stats" element={<BarGraphStatsDistributor />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);