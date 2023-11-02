
import './App.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavigationBar from './Components/NavigationBar/NavigationBar';
import StatsDisplay, { TargetType } from './Components/StatsDisplay/StatsDisplay';
import Search from './Components/Search/Search';

function App() {
    return (
        <BrowserRouter>
            <NavigationBar />
            <Routes>
                <Route path="/Draft_Info" element={<StatsDisplay source={TargetType.DraftInfo} />} />
                <Route path="/Fielding_Stats" element={<StatsDisplay source={TargetType.FieldingStats} />} />
                <Route path="/Pitching_Stats" element={<StatsDisplay source={TargetType.PitchingStats} />} />
                <Route path="/Hitting_Stats" element={<StatsDisplay source={TargetType.HittingStats} />} />
                <Route path="/Player_Information" element={<StatsDisplay source={TargetType.PlayerInfo} />} />
                <Route path="*" element={<Search />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
