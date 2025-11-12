// ThresholdSettingsPage.js

import React, { useState, useEffect } from 'react';
import './ThresholdSettingsPage.css';

const mockDistribution = {
    30: 80, 40: 65, 50: 50, 60: 35, 70: 25, 80: 15, 90: 5,
    1: 99, 10: 95, 20: 90, 100: 1,
};
const getPercentile = (score, distribution) => {
    const closestScore = Object.keys(distribution)
        .map(Number)
        .filter(key => key <= score)
        .sort((a, b) => b - a)[0]; 
    return closestScore ? distribution[closestScore] : 100;
};

const FIXED_CAUTION_THRESHOLD = 40;

const ThresholdSettingsPage = ({ onBack, user }) => {
    const [dangerValue, setDangerValue] = useState(
        user?.danger_threshold > FIXED_CAUTION_THRESHOLD 
        ? user.danger_threshold 
        : 70 
    );
    
    const [distribution, setDistribution] = useState(mockDistribution);
    const handleDangerChange = (e) => {
        setDangerValue(parseInt(e.target.value, 10));
    };
    
    const handleSave = () => {
        console.log("저장:", { caution: FIXED_CAUTION_THRESHOLD, danger: dangerValue });
        alert("설정이 저장되었습니다.");
    };

    return (
        <div className="threshold-settings-container">
            <button className="back-button" onClick={onBack}>{'<'} 뒤로가기</button>
            <h2 className="settings-title">🌡️ 결빙 지수 기준 설정</h2>
            <p className="description">
                결빙 지수 점수에 따라 '주의' 및 '위험'으로 표시될 기준을 설정합니다.
            </p>
            <div className="static-threshold-group">
                <label className="slider-label caution-label">
                    🟡 주의 시작 점수: <strong>{FIXED_CAUTION_THRESHOLD}점</strong>
                </label>
                <p className="percentile-info">
                    (이 점수는 약 **상위 {getPercentile(FIXED_CAUTION_THRESHOLD, distribution)}%**에 해당합니다)
                </p>
            </div>
            <div className="slider-group">
                <div className="slider-label-row">
                    <label htmlFor="danger-slider" className="slider-label danger-label">
                        🔴 위험 시작 점수:
                    </label>
                    <span className="slider-value">
                        <strong>{dangerValue}점</strong>
                    </span>
                </div>

                <p className="percentile-info">
                    (이 점수는 약 **상위 {getPercentile(dangerValue, distribution)}%**에 해당합니다)
                </p>
                <input
                    type="range"
                    id="danger-slider"
                    className="slider danger-slider"
                    min={FIXED_CAUTION_THRESHOLD + 1}
                    max="100"
                    value={dangerValue}
                    onChange={handleDangerChange}
                />
            </div>
            <button className="action-button save-button" onClick={handleSave}>
                저장하기
            </button>
        </div>
    );
};

export default ThresholdSettingsPage;