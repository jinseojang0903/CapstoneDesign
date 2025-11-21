import React from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';

import TopNav from './component/TopNav';
import Sidebar from './component/Sidebar';
import MainDashboard from './component/MainMap';

import ScoringCriteria from './pages/ScoringCriteria';
import MyRoutes from './pages/MyRoutes';
import AdminPage from './pages/AdminPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfessionalPage from './pages/ProfessionalPage';

function App() {
  return (
    <div className="App">
      <TopNav />
      <Routes>
        
        <Route path="/" element={
          <div className="main-content" style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
            <Sidebar />
            <MainDashboard />
          </div>
        } />

        <Route path="/professional" element={<ProfessionalPage />} />

        <Route path="/scoring" element={<ScoringCriteria />} />
        <Route path="/my-routes" element={<MyRoutes />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} /> 
        
      </Routes>
    </div>
  );
}

export default App;