import React, { useState } from 'react';
import './Sidebar.css';
import CriticalZones from './CriticalZones';
import FreezingIndex from './FreezingIndex';
import RouteSearch from './RouteSearch';

function Sidebar() {
  const [activeTab, setActiveTab] = useState('comprehensive');

  return (
    <div className="sidebar-container">
      <div className="tab-container">
        <span 
          className={`tab ${activeTab === 'comprehensive' ? 'active' : ''}`}
          onClick={() => setActiveTab('comprehensive')}
        >
          종합 지수
        </span>
        <span
          className={`tab ${activeTab === 'detailed' ? 'active' : ''}`}
          onClick={() => setActiveTab('detailed')}
        >
          상세 분석
        </span>
      </div>

      <div className="tab-content">
        {activeTab === 'comprehensive' && (
          <> 
            <RouteSearch />
            <FreezingIndex />
            <CriticalZones />
          </>
        )}

        {activeTab === 'detailed' && (
          <div>
            <h2>상세 분석 내용 (임시)</h2>
            <p>여기는 상세 분석 탭을 눌렀을 때 보이는 내용입니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;