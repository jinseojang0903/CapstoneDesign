import './App.css';
import TopNav from './component/TopNav';
import Sidebar from './component/Sidebar';
import MapDisplay from './component/MapDisplay';
import { Routes, Route } from 'react-router-dom';
import ScoringCriteria from './pages/ScoringCriteria';
import MyRoutes from './pages/MyRoutes';
import Professional from './pages/Professional';
import AdminPage from './pages/AdminPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';


function App() {
  return (
    <div className="App">
      <TopNav />
      <Routes>
        
        {/* 1. 메인 경로: 지도 및 검색 기능이 있는 기본 레이아웃 */}
        <Route path="/" element={
          <div className="main-content">
            <Sidebar />
            <MapDisplay />
          </div>
        } />

        {/* 2. 일반 페이지: TopNav만 유지하고 나머지 레이아웃 요소는 제거 */}
        <Route path="/scoring" element={<ScoringCriteria />} />
        <Route path="/my-routes" element={<MyRoutes />} />
        <Route path="/professional" element={<Professional />} />
        
        {/* 3. 회원가입 및 관리자 페이지 경로 수정 및 연결 */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} /> 
        
      </Routes>
    </div>
  );
}

export default App;