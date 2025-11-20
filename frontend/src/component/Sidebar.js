import React, { useState, useEffect, useCallback } from 'react';
import './Sidebar.css';
import CriticalZones from './CriticalZones';
import FreezingIndex from './FreezingIndex';
import RouteSearch from './RouteSearch';

function Sidebar() {
  const [activeTab, setActiveTab] = useState('comprehensive');
  
  const [destination, setDestination] = useState('');
  const [finalDestination, setFinalDestination] = useState('');

  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const [currentMode, setCurrentMode] = useState('fast');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStartPlaceSelect = useCallback((place) => {
    setStartPoint(place);
    setDestination(place.name);
    setAnalysisResult(null);
    setCurrentMode('fast'); 
    window.dispatchEvent(new CustomEvent('placeSelected', { 
      detail: { type: 'start', place: place } 
    }));
  }, []);

  const handleEndPlaceSelect = useCallback((place) => {
    setEndPoint(place);
    setFinalDestination(place.name);
    setAnalysisResult(null);
    setCurrentMode('fast');
    window.dispatchEvent(new CustomEvent('placeSelected', { 
      detail: { type: 'end', place: place } 
    }));
  }, []);

  const handleSafeRouteClick = () => {
    if (!startPoint || !endPoint) {
      console.error("출발지/도착지 정보가 없습니다.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentMode('safe'); 

    const event = new CustomEvent('analyzeRequest', {
      detail: { start: startPoint, end: endPoint, mode: 'safe' }
    });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const handleMapSelection = (e) => {
      const { type, place } = e.detail;
      if (type === 'start') handleStartPlaceSelect(place); 
      else if (type === 'end') handleEndPlaceSelect(place);
    };

    const handleAnalyzeRequest = (e) => {
      const { start, end } = e.detail;
      
      if (start && end) {
        setStartPoint(start);
        setEndPoint(end);
      }

      if (!e.detail.mode || e.detail.mode === 'fast') {
        setCurrentMode('fast');
      }
      
      setIsLoading(true);
      setError(null);
      setAnalysisResult(null);
    };

    const handleAnalysisSuccess = (e) => {
      setAnalysisResult(e.detail); 
      setIsLoading(false);
    };

    window.addEventListener('setRoutePoint', handleMapSelection);
    window.addEventListener('analyzeRequest', handleAnalyzeRequest);
    window.addEventListener('analysisSuccess', handleAnalysisSuccess);

    return () => {
      window.removeEventListener('setRoutePoint', handleMapSelection);
      window.removeEventListener('analyzeRequest', handleAnalyzeRequest);
      window.removeEventListener('analysisSuccess', handleAnalysisSuccess);
    };
  }, [handleStartPlaceSelect, handleEndPlaceSelect]); 

  return (
    <div className="sidebar-container">
      <div className="tab-container">
        <span className={`tab ${activeTab === 'comprehensive' ? 'active' : ''}`} onClick={() => setActiveTab('comprehensive')}>종합 지수</span>
        <span className={`tab ${activeTab === 'detailed' ? 'active' : ''}`} onClick={() => setActiveTab('detailed')}>상세 분석</span>
      </div>

      <div className="tab-content">
        {activeTab === 'comprehensive' && (
          <> 
            <RouteSearch 
              destination={destination}
              setDestination={setDestination}
              finalDestination={finalDestination}
              setFinalDestination={setFinalDestination}
              onStartPlaceSelect={handleStartPlaceSelect} 
              onEndPlaceSelect={handleEndPlaceSelect}   
              isLoading={isLoading}
            />
            
            {error && <div className="error-message" style={{ color: 'red', marginTop: '10px', padding: '0 15px' }}>{error}</div>}

            {/* 우회 버튼 */}
            {analysisResult && !isLoading && currentMode === 'fast' && 
             (analysisResult.status === 'Warning' || analysisResult.status === 'Danger') && (
              <div style={{ padding: '0 15px 15px 15px', animation: 'fadeIn 0.5s' }}>
                <div style={{ 
                  backgroundColor: 'rgba(255, 77, 79, 0.15)', 
                  border: '1px solid #ff4d4f', 
                  borderRadius: '8px', 
                  padding: '10px',
                  marginBottom: '10px',
                  color: '#ffccc7',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}>
                  ⚠️ 현재 경로에 위험 구간이 감지되었습니다.
                </div>
                <button 
                  onClick={handleSafeRouteClick}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(90deg, #2ecc71, #27ae60)', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(46, 204, 113, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'transform 0.1s'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span>🛡️</span> 안전 경로로 우회하기
                </button>
              </div>
            )}

            {/* 안전 경로 완료 메시지 */}
            {analysisResult && currentMode === 'safe' && (
               <div style={{ padding: '0 15px 10px 15px', textAlign: 'center' }}>
                  <span style={{ color: '#52c41a', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    ✅ 안전한 우회 경로가 적용되었습니다.
                  </span>
               </div>
            )}

            <hr className="divider" style={{ margin: '10px 0', borderColor: 'rgba(255,255,255,0.1)' }}/>

            <FreezingIndex result={analysisResult} isLoading={isLoading} />
            <CriticalZones sections={analysisResult?.sections} isLoading={isLoading} />
          </>
        )}

        {activeTab === 'detailed' && (
          <div className="detailed-view" style={{ color: 'white', padding: '10px' }}>
             {analysisResult ? (
               <div className="detail-grid">
                 <h4 style={{ marginBottom: '15px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                   경로 환경 상세 분석
                 </h4>
                 
                 {/* 경사도 */}
                 <div className="detail-item" style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
                   <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '5px' }}>경사 위험도 (Slope)</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#ff6b6b' }}>
                        {analysisResult.details?.avgSlope || 0}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: '#ccc' }}>/ 100점</span>
                   </div>
                   <div style={{ fontSize: '0.8rem', color: '#faad14', marginTop: '5px' }}>
                     최대 위험: {analysisResult.details?.maxSlope || 0}점
                   </div>
                 </div>

                 {/* 결빙취약도로(서울공공데이터에서 제공중인 결빙취약도로 데이터 바탕으로 점수 부여) */}
                 <div className="detail-item" style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
                   <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '5px' }}>결빙 취약성 (Freezing)</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#40a9ff' }}>
                        {analysisResult.details?.avgFreeze || 0}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: '#ccc' }}>/ 100점</span>
                   </div>
                 </div>

                 {/* 결빙 사고 지점 */}
                 <div className="detail-item" style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
                   <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '5px' }}>사고 이력 위험도</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#feca57' }}>
                        {analysisResult.details?.avgAccident || 0}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: '#ccc' }}>/ 100점</span>
                   </div>
                 </div>

                 {/* 인구 밀집도 */}
                 <div className="detail-item" style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
                   <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '5px' }}>인구 밀집 위험도 (Population)</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#9b59b6' }}>
                        {analysisResult.details?.avgPopulation || 0}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: '#ccc' }}>/ 100점</span>
                   </div>
                   <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '8px', margin: 0 }}>
                     * 유동 인구가 많아 제설 우선순위가 높은 지역입니다.
                   </p>
                 </div>

                 {/* 기본 점수(도로 재질 및 도로 유형) */}
                 <div className="detail-item" style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
                   <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '5px' }}>도로 기본 상태 위험도 (Base)</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#1abc9c' }}>
                        {analysisResult.details?.avgRaw || 0}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: '#ccc' }}>/ 100점</span>
                   </div>
                   <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '8px', margin: 0 }}>
                     * 도로 재질 및 기본 환경 요인에 따른 위험도입니다.
                   </p>
                 </div>

               </div>
             ) : (
               <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
                 <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🛣️</div>
                 {isLoading ? '분석 중...' : '경로를 먼저 분석해주세요.'}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;