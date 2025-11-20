import React from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';

// 컴포넌트
import TopNav from './component/TopNav';
import Sidebar from './component/Sidebar';
import MapDisplay from './component/MapDisplay';
import MainDashboard from './component/MainMap';

// 페이지
import ScoringCriteria from './pages/ScoringCriteria';
import MyRoutes from './pages/MyRoutes';
import AdminPage from './pages/AdminPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <div className="App">
      <TopNav />
      <Routes>
        
        {/* 1. 일반 사용자 메인: 사이드바 O + 경로 찾기 지도 */}
        <Route path="/" element={
          <div className="main-content" style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
            <Sidebar />        {/* 사이드바 존재 */}
            <MainDashboard />  {/* 지도 (flex: 1로 남은 공간 채움) */}
          </div>
        } />

        {/* 2. 전문가용 메인: 사이드바 X (지도를 넓게 사용) */}
        <Route path="/professional" element={
          <div className="main-content" style={{ height: 'calc(100vh - 65px)' }}>
            <MapDisplay />     {/* 사이드바 없이 지도만 꽉 채움 */}
          </div>
        } />

        {/* 3. 기타 페이지 */}
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