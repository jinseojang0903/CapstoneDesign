import React from 'react';
import './CriticalZones.css';

function CriticalZones({ sections, isLoading }) {
  if (isLoading) {
    return (
      <div className="zones-container">
        <h4>위험 구간 분석 중...</h4>
      </div>
    );
  }
  if (!sections || sections.length === 0) {
    return (
      <div className="zones-container">
        <h4>위험 구간 리스트</h4>
        <div className="no-data">
          탐지된 위험 구간이 없습니다. <br/>
          <span style={{ fontSize: '0.8em', color: '#52c41a' }}>안전한 경로입니다! 🟢</span>
        </div>
      </div>
    );
  }

  return (
    <div className="zones-container">
      <h4>
        위험 구간 리스트 
        <span className="zone-count">({sections.length}건)</span>
      </h4>
      
      <div className="zones-list">
        {sections.map((zone, index) => (
          <div className="zone-item" key={zone.id || index}>
            <div className="zone-header">
              <span className="zone-name">{zone.name}</span>
              <span 
                className="zone-score-text"
                style={{ color: getScoreColor(zone.score) }}
              >
                {Math.round(zone.score)}점
              </span>
            </div>
            <div className="zone-bar-bg">
              <div 
                className="zone-bar-fill" 
                style={{ 
                  width: `${zone.score}%`, 
                  backgroundColor: getScoreColor(zone.score) 
                }}
              ></div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

// 점수에 따라 색상 부여
const getScoreColor = (score) => {
  if (score >= 80) return '#ff4d4f';
  if (score >= 60) return '#faad14';
  return '#52c41a';
};

export default CriticalZones;