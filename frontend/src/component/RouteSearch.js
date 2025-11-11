import React from 'react';
import './RouteSearch.css';

function RouteSearch({ 
  destination, 
  setDestination,
  finalDestination,
  setFinalDestination,
  onAnalyzeClick,
  isLoading
}) {
  
  // 폼 제출(Form Submission)을 처리하는 함수
  const handleSubmit = (e) => {
    // 폼 제출 시 발생하는 기본 동작(페이지 새로고침)을 방지
    e.preventDefault(); 
    
    // 부모 컴포넌트로부터 전달받은 분석 실행 함수를 호출
    if (onAnalyzeClick) {
      onAnalyzeClick();
    }
  };

  return (
    <div className="route-search-container">
      <h4>Route Search</h4>
      
      {/* <form> 태그를 사용하여 입력 필드들을 감쌉니다. */}
      <form onSubmit={handleSubmit}>
        
        <div className="input-group">
          <label htmlFor="destination">Destination</label>
          <input 
            type="text" 
            id="destination" 
            placeholder="Enter destination..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="finalDestination">Final destination</label>
          <input 
            type="text" 
            id="finalDestination"
            placeholder="Enter final destination..."
            value={finalDestination}
            onChange={(e) => setFinalDestination(e.target.value)}
          />
        </div>

        {/* 버튼의 type은 "submit"으로 유지하여 폼 제출을 담당하게 합니다. */}
        <button 
          className="analyze-button"
          type="submit"
          // destination 또는 finalDestination이 비어있으면 버튼 비활성화
          disabled={isLoading || !destination || !finalDestination} 
        >
          {isLoading ? '분석 중...' : 'Analyze Route'}
        </button>
        
      </form>
    </div>
  );
}

export default RouteSearch;