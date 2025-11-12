// SettingsPage.js

import React, { useState } from 'react';
import './SettingsPage.css'; 
import { useAuth } from '../context/AuthContext';
import { useMapTheme } from '../context/MapThemeContext'; 
import MapThemeList from './MapThemeList';

import EditProfilePage from './EditProfilePage';
import ChangePasswordPage from './ChangePasswordPage';
import DeactivateAccountPage from './DeactivateAccountPage';
import ThresholdSettingsPage from './ThresholdSettingsPage'; 

const SettingsPage = ({ onClose, onLogout, isAuthenticated, user }) => { 
    
    const { theme, toggleTheme } = useAuth();
    const { currentTheme } = useMapTheme();
    const isDarkMode = theme === 'dark'; 
    const [currentView, setCurrentView] = useState('main'); 
    
    const handleBack = () => setCurrentView('main');

    if (currentView === 'mapThemes') {
        return <MapThemeList onBack={handleBack} />;
    } else if (currentView === 'editProfile') {
        return <EditProfilePage onBack={handleBack} user={user} />;
    } else if (currentView === 'changePassword') {
        return <ChangePasswordPage onBack={handleBack} userId={user?.id} />;
    } else if (currentView === 'deactivateAccount') {
        return <DeactivateAccountPage onBack={handleBack} userId={user?.id} onLogout={onLogout} />;
    } 
    else if (currentView === 'thresholdSettings') {
        return <ThresholdSettingsPage onBack={handleBack} user={user} />;
    }
    
    return (
        <div className="settings-container">
            <h2 className="settings-title">⚙️ 설정</h2>
            
            {isAuthenticated && (
                <div className="user-info-status">
                    <p>로그인 사용자: <strong>{user?.username}</strong> ({user?.role})</p>
                </div>
            )}
            
            <div className="settings-section">
                <h3 className="section-title">계정 및 보안</h3>
                
                <SettingItem 
                    label="프로필 정보 수정" 
                    type="link" 
                    onClick={() => setCurrentView('editProfile')} 
                />
                <SettingItem 
                    label="비밀번호 변경" 
                    type="link" 
                    onClick={() => setCurrentView('changePassword')} 
                />
                <SettingItem 
                    label="계정 비활성화/탈퇴" 
                    type="link" 
                    onClick={() => setCurrentView('deactivateAccount')} 
                />
            </div>

            <div className="settings-section">
                <h3 className="section-title">앱 설정</h3>

                <SettingItem 
                    label="테마 설정 (다크/라이트 모드)" 
                    type="toggle"
                    isChecked={isDarkMode}
                    onToggle={toggleTheme}
                    statusText={isDarkMode ? '다크 모드' : '라이트 모드'}
                />
                
                <SettingItem 
                    label="지도 테마 설정" 
                    type="link" 
                    statusText={currentTheme.name} 
                    onClick={() => setCurrentView('mapThemes')} 
                />
                <SettingItem 
                    label="결빙 지수 기준 설정" 
                    type="link" 
                    onClick={() => setCurrentView('thresholdSettings')}
                />
            </div>

            <div className="settings-section">
                <h3 className="section-title">정보 및 지원</h3>
                <SettingItem label="도움말 / FAQ" type="link" />
                <SettingItem label="서비스 이용 약관" type="link" />
                <SettingItem label="버전 정보" type="text" statusText="v1.0.2" />
            </div>

            {isAuthenticated && (
                <button className="action-button logout-button" onClick={onLogout}>
                    로그아웃
                </button>
            )}

            <button className="action-button close-button" onClick={onClose}>
                닫기
            </button>
        </div>
    );
};

const SettingItem = ({ label, type, statusText, isChecked, onToggle, onClick }) => { 
    return (
        <div 
            className="setting-item" 
            onClick={onClick || (type === 'link' ? () => console.log(`${label} 클릭됨`) : null)}
        >
            <span className="item-label">{label}</span>
            <div className="item-control">
                {type === 'toggle' && (
                    <label className="switch">
                        <input type="checkbox" checked={isChecked} onChange={onToggle} />
                        <span className="slider round"></span>
                    </label>
                )}
                {statusText && <span className="status-text">{statusText}</span>}
                {type === 'link' && (
                    <span className="link-icon">
                        {'>'} 
                    </span>
                )}
            </div>
        </div>
    );
};


export default SettingsPage;