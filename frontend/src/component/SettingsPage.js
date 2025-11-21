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
    
    // 화면 전환 상태 관리
    const [currentView, setCurrentView] = useState('main'); 
    
    const handleBack = () => setCurrentView('main');

    // --- 화면 렌더링 분기 ---
    if (currentView === 'mapThemes') {
        return <MapThemeList onBack={handleBack} />;
    } else if (currentView === 'editProfile') {
        return <EditProfilePage onBack={handleBack} user={user} />;
    } else if (currentView === 'changePassword') {
        return <ChangePasswordPage onBack={handleBack} userId={user?.id} />;
    } else if (currentView === 'deactivateAccount') {
        return <DeactivateAccountPage onBack={handleBack} userId={user?.id} onLogout={onLogout} />;
    } else if (currentView === 'thresholdSettings') {
        return <ThresholdSettingsPage onBack={handleBack} user={user} />;
    } else if (currentView === 'developerInfo') {
        return <DeveloperInfoPage onBack={handleBack} />;
    } else if (currentView === 'dataSources') {
        return <DataSourcesPage onBack={handleBack} />;
    } else if (currentView === 'techStack') {
        return <TechStackPage onBack={handleBack} />;
    }
    
    // --- 메인 설정 화면 ---
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
                <SettingItem label="프로필 정보 수정" type="link" onClick={() => setCurrentView('editProfile')} />
                <SettingItem label="비밀번호 변경" type="link" onClick={() => setCurrentView('changePassword')} />
                <SettingItem label="계정 비활성화/탈퇴" type="link" onClick={() => setCurrentView('deactivateAccount')} />
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
                <SettingItem label="지도 테마 설정" type="link" statusText={currentTheme.name} onClick={() => setCurrentView('mapThemes')} />
                <SettingItem label="결빙 지수 기준 설정" type="link" onClick={() => setCurrentView('thresholdSettings')} />
            </div>

            <div className="settings-section">
                <h3 className="section-title">정보 및 지원</h3>
                
                {/* [수정] 클릭 시 페이지 이동 */}
                <SettingItem label="데이터 출처" type="link" onClick={() => setCurrentView('dataSources')} />
                <SettingItem label="기술 스택" type="link" onClick={() => setCurrentView('techStack')} />
                <SettingItem label="개발자 소개" type="link" statusText="Jang Inseo" onClick={() => setCurrentView('developerInfo')} />
                
                <SettingItem label="버전 정보" type="text" statusText="v0.0.1" />
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

/* ---------------------------------------------
   [신규 컴포넌트 1] 데이터 출처 상세 페이지
   --------------------------------------------- */
const DataSourcesPage = ({ onBack }) => {
    return (
        <div className="settings-container">
            <h2 className="settings-title">📊 데이터 출처</h2>
            
            <div className="settings-section">
                <h3 className="section-title">지도 및 위치</h3>
                <ul style={{paddingLeft: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '0.9rem'}}>
                    <li><strong>OpenStreetMap (OSM):</strong> 기본 지도 데이터</li>
                    <li><strong>Nominatim:</strong> 주소 검색 및 지오코딩 API</li>
                </ul>
            </div>

            <div className="settings-section">
                <h3 className="section-title">기상 및 환경</h3>
                <ul style={{paddingLeft: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '0.9rem'}}>
                    <li><strong>기상청 공공데이터포털:</strong> 실시간 기온, 강수량 데이터</li>
                    <li><strong>자체 수집 데이터:</strong> 과거 도로 결빙 이력</li>
                </ul>
            </div>

            <div className="settings-section">
                <h3 className="section-title">리소스</h3>
                <ul style={{paddingLeft: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '0.9rem'}}>
                    <li><strong>아이콘:</strong> React Icons, FontAwesome</li>
                    <li><strong>폰트:</strong> Noto Sans KR</li>
                </ul>
            </div>

            <button className="action-button close-button" onClick={onBack}>
                뒤로 가기
            </button>
        </div>
    );
};

/* ---------------------------------------------
   [신규 컴포넌트 2] 기술 스택 상세 페이지
   --------------------------------------------- */
const TechStackPage = ({ onBack }) => {
    return (
        <div className="settings-container">
            <h2 className="settings-title">🛠️ 기술 스택</h2>

            <div className="settings-section">
                <h3 className="section-title">Frontend</h3>
                <ul style={{paddingLeft: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '0.9rem'}}>
                    <li>React.js (v18)</li>
                    <li>React Router Dom</li>
                    <li>CSS3 (Custom Styling)</li>
                    <li>Leaflet.js (Map Rendering)</li>
                </ul>
            </div>

            <div className="settings-section">
                <h3 className="section-title">Backend</h3>
                <ul style={{paddingLeft: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '0.9rem'}}>
                    <li>Python Flask</li>
                    <li>SQLAlchemy (ORM)</li>
                    <li>JWT (Authentication)</li>
                    <li>Pandas (Data Processing)</li>
                </ul>
            </div>

            <div className="settings-section">
                <h3 className="section-title">Database & Infra</h3>
                <ul style={{paddingLeft: '20px', color: '#ccc', lineHeight: '1.8', fontSize: '0.9rem'}}>
                    <li>PostgreSQL (with PostGIS)</li>
                    <li>Vercel (Frontend Hosting)</li>
                    <li>AWS EC2 (Backend Server)</li>
                </ul>
            </div>

            <button className="action-button close-button" onClick={onBack}>
                뒤로 가기
            </button>
        </div>
    );
};

/* ---------------------------------------------
   [신규 컴포넌트 3] 개발자 정보 상세 페이지
   --------------------------------------------- */
const DeveloperInfoPage = ({ onBack }) => {
    const developers = [
        {
            name: "Jang Inseo",
            role: "Full Stack Developer",
            icon: "🧑‍💻",
            desc: "백엔드 API 설계 및 프론트엔드 연동, DB 구축, 데이터 분석",
            github: "@jinseojang0903",
            email: "jinseojang@naver.com"
        },
        {
            name: "Jo Hyunju",
            role: "AI / Data Scientist",
            icon: "👩‍💻", 
            desc: "결빙 위험도 예측 모델 개발 및 데이터 분석",
            github: "@jodang1",
            email: "jodang1@naver.com"
        }
    ];

    return (
        <div className="settings-container">
            <h2 className="settings-title">👨‍💻 개발자 소개</h2>

            {developers.map((dev, index) => (
                <div key={index} className="settings-section" style={{ paddingBottom: '20px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '5px' }}>{dev.icon}</div>
                        <h3 style={{ margin: '5px 0', color: '#4dabf7' }}>{dev.name}</h3>
                        <p style={{ color: '#888', fontSize: '0.85rem', fontWeight: 'bold' }}>{dev.role}</p>
                        <p style={{ color: '#ccc', fontSize: '0.9rem', marginTop: '5px' }}>
                            {dev.desc}
                        </p>
                    </div>

                    <SettingItem label="GitHub" type="text" statusText={dev.github} />
                    <SettingItem label="Email" type="text" statusText={dev.email} />
                </div>
            ))}

            <div className="settings-section">
                <h3 className="section-title">Team SnowRoute</h3>
                <div style={{ padding: '10px', color: '#ccc', lineHeight: '1.6', fontSize: '0.95rem' }}>
                    저희 팀은 안전한 겨울철 도로 환경을 만들기 위해<br />
                    최선을 다해 연구하고 개발하고 있습니다.<br />
                    피드백은 언제나 환영입니다! ☃️
                </div>
            </div>

            <button className="action-button close-button" onClick={onBack}>
                뒤로 가기
            </button>
        </div>
    );
};

/* SettingItem 컴포넌트 */
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