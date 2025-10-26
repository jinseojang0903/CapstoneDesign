import './App.css';
import TopNav from './component/TopNav';
import Sidebar from './component/Sidebar';
import MapDisplay from './component/MapDisplay';
import { Routes, Route } from 'react-router-dom';

import ScoringCriteria from './pages/ScoringCriteria';
import MyRoutes from './pages/MyRoutes';
import Professional from './pages/Professional';
import AdminPage from './pages/AdminPage';


function App() {
  return (
    <div className="App">
      <TopNav />
      <Routes>
        <Route path="/" element={
          <div className="main-content">
            <Sidebar />
            <MapDisplay />
          </div>
        } />

        <Route path="/scoring" element={<ScoringCriteria />} />
        <Route path="/my-routes" element={<MyRoutes />} />
        <Route path="/professional" element={<Professional />} />
        <Route path="/AdminPage" element={<AdminPage />} />
      </Routes>
    </div>
  );
}

export default App;