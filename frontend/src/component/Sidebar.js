import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';
import CriticalZones from './CriticalZones';
import FreezingIndex from './FreezingIndex';
import RouteSearch from './RouteSearch';

// Define the base URL for the API
const API_BASE_URL = 'http://localhost:5000/api'; 

function Sidebar() {
  const [activeTab, setActiveTab] = useState('comprehensive');
  const [destination, setDestination] = useState('');
  const [finalDestination, setFinalDestination] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAnalyzeClick = async () => {
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);
    
    if (!destination || !finalDestination) {
        setError('경로 분석을 위해 출발지와 도착지를 모두 입력해주세요.');
        setIsLoading(false);
        return; 
    }
    
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setError('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
      setIsLoading(false);
      setTimeout(() => {
        navigate('/login');
      }, 2000); 
      return; 
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/analyze-route`,
        { 
          start: destination,
          end: finalDestination
        }, 
        {
          headers: {
            'Authorization': `Bearer ${token}` 
          }
        }
      );
      
      setAnalysisResult(response.data); 
      console.log("백엔드 응답:", response.data);

    } catch (err) {
      console.error("경로 분석 중 오류 발생:", err);
      
      if (err.response) {
        if (err.response.status === 401) {
          setError('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
          localStorage.removeItem('accessToken');
          setTimeout(() => {
             navigate('/login');
          }, 2000);
        } else if (err.response.status === 422) {
          // 422 오류 발생 시, 백엔드에서 받은 상세 오류 메시지를 표시하는 것이 더 좋습니다.
          setError(err.response.data?.error || '입력 정보가 유효하지 않습니다.');
        } else {
          setError(err.response.data?.error || `경로 분석 중 오류가 발생했습니다. (Status: ${err.response.status})`);
        }
      } else {
        setError('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
            <RouteSearch 
              destination={destination}
              setDestination={setDestination}
              finalDestination={finalDestination}
              setFinalDestination={setFinalDestination}
              onAnalyzeClick={handleAnalyzeClick} 
              isLoading={isLoading}
            />
            {/* 9. Display error message */}
            {error && <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
            <FreezingIndex result={analysisResult} isLoading={isLoading} />
            <CriticalZones result={analysisResult} isLoading={isLoading} />
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