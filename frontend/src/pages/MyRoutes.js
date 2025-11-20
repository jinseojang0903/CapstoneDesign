import React, { useState } from 'react';
import './MyRoutes.css';

const MyRoutes = () => {
  const [savedRoutes, setSavedRoutes] = useState([
    { id: 1, name: '출근길 (집 → 회사)', start: '사당역', end: '판교테크노밸리', risk: 'Safe' },
    { id: 2, name: '본가 가는 길', start: '강남역', end: '일산 호수공원', risk: 'Warning' }
  ]);

  const [recentHistory, setRecentHistory] = useState([
    { id: 101, date: '2023.11.20', start: '서울시청', end: '광화문', score: 12 },
    { id: 102, date: '2023.11.19', start: '이태원', end: '한남동', score: 82 }, // Danger
    { id: 103, date: '2023.11.18', start: '홍대입구', end: '합정역', score: 45 }
  ]);

  const handleRouteClick = (route) => {
    alert(`'${route.start} -> ${route.end}' 경로 분석을 시작합니다. (기능 준비중)`);
  };

  return (
    <div className="my-routes-container">
      <div className="header-section">
        <h2>📂 내 경로 관리</h2>
        <p>자주 가는 경로를 저장하고 위험도를 미리 확인하세요.</p>
      </div>

      {/* 빠른 실행 버튼 */}
      <div className="quick-actions">
        <button className="action-card home">
          <span className="icon">🏠</span>
          <span className="label">집으로</span>
        </button>
        <button className="action-card work">
          <span className="icon">🏢</span>
          <span className="label">회사로</span>
        </button>
        <button className="action-card add">
          <span className="icon">➕</span>
          <span className="label">경로 추가</span>
        </button>
      </div>

      <hr className="divider" />

      {/* 즐겨찾기 목록 */}
      <section className="route-section">
        <h3>⭐ 즐겨찾기</h3>
        <div className="route-list">
          {savedRoutes.map(route => (
            <div className="route-card" key={route.id} onClick={() => handleRouteClick(route)}>
              <div className="route-info">
                <h4>{route.name}</h4>
                <p>{route.start} ➝ {route.end}</p>
              </div>
              <div className={`risk-tag ${route.risk.toLowerCase()}`}>
                {route.risk}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 최근 검색 기록 */}
      <section className="route-section">
        <h3>🕒 최근 검색 기록</h3>
        <div className="history-list">
          {recentHistory.map(history => (
            <div className="history-item" key={history.id}>
              <span className="date">{history.date}</span>
              <span className="path">{history.start} ➝ {history.end}</span>
              <span 
                className="score" 
                style={{ color: history.score >= 80 ? '#ff4d4f' : (history.score >= 60 ? '#faad14' : '#52c41a') }}
              >
                {history.score}점
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MyRoutes;