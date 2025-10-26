import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './TopNav.css';
import appLogo from '../assets/logo.png'

function TopNav() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
          <NavLink to="/admin">Admin</NavLink>
          
          <span onClick={openModal}>Settings</span>
        </div>
      </nav>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}> 
          <div className="modal-content" onClick={(e) => e.stopPropagation()}> 
            <h2>Settings</h2>
            <p>여기에 비밀번호 변경, 로그아웃 등의 내용이 들어갑니다.</p>
            <button onClick={closeModal}>닫기</button>
          </div>
        </div>
      )}
    </>
  );
}

export default TopNav;