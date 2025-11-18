import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';
import CriticalZones from './CriticalZones';
import FreezingIndex from './FreezingIndex';
import RouteSearch from './RouteSearch';

const API_BASE_URL = 'http://localhost:5000/api'; 

// [수정] props를 제거하고 독립적인 컴포넌트로 변경
function Sidebar() {
  const [activeTab, setActiveTab] = useState('comprehensive');
  
  // 1. 텍스트 상태 (UI 표시용)
  const [destination, setDestination] = useState('');
  const [finalDestination, setFinalDestination] = useState('');

  // 2. [신규] 좌표 및 결과 상태 (Sidebar가 직접 관리)
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 3. [수정] 출발지 선택 처리 (useCallback 사용)
  const handleStartPlaceSelect = useCallback((place) => {
    // 에러 원인 코드 삭제: onStartPlaceSelect(place); 
    
    setStartPoint(place);       // 내 상태 업데이트
    setDestination(place.name); // 텍스트 업데이트
    
    // 지도에 마커 표시하라고 방송
    window.dispatchEvent(new CustomEvent('placeSelected', { 
      detail: { type: 'start', place: place } 
    }));
  }, []);

  // 4. [수정] 도착지 선택 처리 (useCallback 사용)
  const handleEndPlaceSelect = useCallback((place) => {
    // 에러 원인 코드 삭제: onEndPlaceSelect(place);

    setEndPoint(place);         // 내 상태 업데이트
    setFinalDestination(place.name); // 텍스트 업데이트
    
    // 지도에 마커 표시하라고 방송
    window.dispatchEvent(new CustomEvent('placeSelected', { 
      detail: { type: 'end', place: place } 
    }));
  }, []);

  // 5. [신규] 지도에서 온 "역방향 방송(setRoutePoint)" 듣기
  useEffect(() => {
    const handleMapSelection = (e) => {
      const { type, place } = e.detail;
      
      // 지도 팝업에서 버튼을 눌렀을 때 여기로 신호가 옴
      if (type === 'start') {
        handleStartPlaceSelect(place); 
      } 
      else if (type === 'end') {
        handleEndPlaceSelect(place);
      }
    };

    window.addEventListener('setRoutePoint', handleMapSelection);
    // 컴포넌트가 사라질 때 리스너 정리
    return () => window.removeEventListener('setRoutePoint', handleMapSelection);
  }, [handleStartPlaceSelect, handleEndPlaceSelect]); 

  // 6. 경로 분석 요청
  const handleAnalyzeClick = async () => {
      setIsLoading(true);
      setAnalysisResult(null);
      setError(null);

      // 내부 상태인 startPoint, endPoint를 사용
      if (!startPoint || !endPoint) {
          setError('경로 분석을 위해 출발지와 도착지를 모두 선택해주세요.');
          setIsLoading(false);
          return;
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
          setError('로그인이 필요합니다.');
          setIsLoading(false);
          return;
      }

      try {
          const response = await axios.post(
              `${API_BASE_URL}/analyze-route`,
              {
                  start: { name: startPoint.name, lat: startPoint.lat, lng: startPoint.lng },
                  end: { name: endPoint.name, lat: endPoint.lat, lng: endPoint.lng }
              },
              { headers: { 'Authorization': `Bearer ${token}` } }
          );
          setAnalysisResult(response.data);
          if (response.data.error) setError(response.data.error);
      } catch (err) {
          setError('경로 분석 중 오류가 발생했습니다.');
      } finally {
          setIsLoading(false);
      }
  };

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
              
              onAnalyzeClick={handleAnalyzeClick} 
              isLoading={isLoading}
            />
            
            {error && <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
            
            {/* 내부 상태인 analysisResult를 전달 */}
            <FreezingIndex result={analysisResult} isLoading={isLoading} />
            <CriticalZones result={analysisResult} isLoading={isLoading} />
          </>
        )}
        {activeTab === 'detailed' && (
           <div><h2>상세 분석 내용</h2></div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;