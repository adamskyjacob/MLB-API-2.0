
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import BothWAR from './Components/BothWAR/BothWAR';
import DraftInfo from './Components/DraftInfo/DraftInfo';
import Fielding from './Components/Fielding/Fielding';
import Home from './Components/Home/Home';
import NavigationBar from './Components/NavigationBar/NavigationBar';
import Offensive from './Components/Offensive/Offensive';
import OffensiveWAR from './Components/OffensiveWAR/OffensiveWAR';
import Pitching from './Components/Pitching/Pitching';
import PitchingWAR from './Components/PitchingWAR/PitchingWAR';

function App() {
    return (
        <BrowserRouter>
            <NavigationBar />
            <Routes>
                <Route path="/Offensive_WAR" element={<OffensiveWAR />} />
                <Route path="/Pitching_WAR" element={<PitchingWAR />} />
                <Route path="Offensive" element={<Offensive />} />
                <Route path="/Pitching" element={<Pitching />} />
                <Route path="/Fielding" element={<Fielding />} />
                <Route path="/Both_WAR" element={<BothWAR />} />
                <Route path="/Draft_Info" element={<DraftInfo />} />
                <Route element={<Home />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
