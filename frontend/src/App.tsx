
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './Components/Home/Home';
import NavigationBar from './Components/NavigationBar/NavigationBar';
import StatsDisplay, { TargetType } from './Components/StatsDisplay/StatsDisplay';

function App() {
    return (
        <BrowserRouter>
            <NavigationBar />
            <Routes>
                <Route path="/Offensive_WAR" element={<StatsDisplay source={TargetType.OffensiveWAR} />} />
                <Route path="/Pitching_WAR" element={<StatsDisplay source={TargetType.PitchingWAR} />} />
                <Route path="/Offensive" element={<StatsDisplay source={TargetType.Offensive} />} />
                <Route path="/Pitching" element={<StatsDisplay source={TargetType.Pitching} />} />
                <Route path="/Fielding" element={<StatsDisplay source={TargetType.Fielding} />} />
                <Route path="/Both_WAR" element={<StatsDisplay source={TargetType.BothWAR} />} />
                <Route path="/Draft_Info" element={<StatsDisplay source={TargetType.DraftInfo} />} />
                <Route element={<Home />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
