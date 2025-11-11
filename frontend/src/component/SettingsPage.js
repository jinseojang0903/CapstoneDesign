import React from 'react';
import './SettingsPage.css'; 
import { useAuth } from '../context/AuthContext';
const SettingsPage = ({ onClose, onLogout, isAuthenticated, user }) => { 
    
    const { theme, toggleTheme } = useAuth();
    const isDarkMode = theme === 'dark'; 

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
                
                <SettingItem label="프로필 정보 수정" type="link" />
                <SettingItem label="비밀번호 변경" type="link" />
                <SettingItem label="계정 비활성화/탈퇴" type="link" />
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
                
                <SettingItem label="지도 테마 설정" type="link" />
                <SettingItem label="알림 설정" type="link" />
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

const SettingItem = ({ label, type, statusText, isChecked, onToggle }) => {
    return (
        <div 
            className="setting-item" 
            onClick={type === 'link' ? () => console.log(`${label} 클릭됨`) : null}
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