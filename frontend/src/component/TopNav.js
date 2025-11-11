import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './TopNav.css';
import appLogo from '../assets/logo.png'
import { useAuth } from '../context/AuthContext';
import SettingsPage from './SettingsPage';

function TopNav() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth(); 

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const handleLogout = () => {
      logout();
      closeModal();
  };

  return (
    <>
      <nav className="top-nav-container">
        <div className="logo">
          <img src={appLogo} alt="서비스 로고" className="app-logo" />
        </div>
        <div className="menu-links">
          <NavLink 
            to="/" 
            className={({ isActive }) => (isActive ? 'active' : '')}
            end 
          >
            DASHBOARD
          </NavLink>
          <NavLink 
            to="/scoring" 
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Scoring Criteria
          </NavLink>
          <NavLink 
            to="/my-routes" 
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            My Routes
          </NavLink>
          <NavLink 
            to="/professional" 
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Professional
          </NavLink>
        </div>
        
        <div className="user-menu">
          {isAuthenticated ? (
            <>
              <span className="user-greeting">
                {user?.username} 님
              </span>
              <span onClick={handleLogout} className="logout-btn">
                로그아웃
              </span>
              
              <NavLink to="/AdminPage">Admin</NavLink>
              
              <span onClick={openModal}>Settings</span>
            </>
          ) : (
            <>
              <NavLink to="/login">로그인</NavLink>
              <NavLink to="/register">회원가입</NavLink>
              <NavLink to="/AdminPage">Admin</NavLink>
              
              <span onClick={openModal}>Settings</span>
            </>
          )}
        </div>
      </nav>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}> 
          <div className="modal-content" onClick={(e) => e.stopPropagation()}> 
            <SettingsPage
              onClose={closeModal}
              onLogout={handleLogout}
              isAuthenticated={isAuthenticated}
              user={user}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default TopNav;