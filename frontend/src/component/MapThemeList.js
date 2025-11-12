import React from 'react';
import { useMapTheme } from '../context/MapThemeContext'; 
import './SettingsPage.css'; 

const MapThemeList = ({ onBack }) => {
    const { currentThemeKey, setMapTheme, MAP_THEMES } = useMapTheme();

    return (
        <div className="settings-container" style={{ minHeight: '400px' }}>
            <h2 className="settings-title" onClick={onBack} style={{ cursor: 'pointer' }}>
                &lt; 지도 테마 설정
            </h2>
            
            <p className="user-info-status">원하는 지도 스타일을 선택하세요.</p>
            
            <div className="settings-section">
                {Object.entries(MAP_THEMES).map(([key, theme]) => (
                    <div 
                        key={key}
                        className="setting-item"
                        onClick={() => {
                            setMapTheme(key);
                        }}
                        style={key === currentThemeKey ? { 
                            backgroundColor: 'var(--accent-color)', 
                            color: 'white' 
                        } : {}}
                    >
                        <span className="item-label">{theme.name}</span>
                        <div className="item-control">
                            {key === currentThemeKey && <span className="status-text">✓ 적용됨</span>}
                        </div>
                    </div>
                ))}
            </div>

            <button className="action-button close-button" onClick={onBack}>
                뒤로 가기
            </button>
        </div>
    );
};

export default MapThemeList;