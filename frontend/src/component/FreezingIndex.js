import React from 'react';
import './FreezingIndex.css';
import { freezingIndexData } from '../data/mockData.js';

function FreezingIndex() {
  const { score, status } = freezingIndexData;

  const getStatusClass = (status) => {
    if (status === 'DANGER') return 'status-danger';
    if (status === 'CAUTION') return 'status-caution';
    if (status === 'SAFE') return 'status-safe';
    return '';
  };

  return (
    <div className="freezing-index-container">
      <h3>결빙지수</h3>
      <div className="score-circle">
        <span className="score">{score}</span>
        <span className="total">/ 100</span>
      </div>
      <div className={`status-badge ${getStatusClass(status)}`}>
        {status}
      </div>
    </div>
  );
}

export default FreezingIndex;