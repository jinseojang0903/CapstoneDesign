import React from 'react';
import './FreezingIndex.css';

function FreezingIndex({ result, isLoading }) {
  if (isLoading) {
    return (
      <div className="freezing-index-container">
        <div className="loading-spinner"></div>
        <span>분석 중...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="freezing-index-container">
        <span>경로를 검색하세요.</span>
      </div>
    );
  }
  return (
    <div className="freezing-index-container">
      <h4>결빙지수</h4>
      <div className="score-circle">
        <span className="score-number">{result.score}</span>
      </div>
      <div className={`status-badge ${result.status.toLowerCase()}`}>
        {result.status}
      </div>
    </div>
  );
}

export default FreezingIndex;