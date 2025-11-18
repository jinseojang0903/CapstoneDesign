import React, { useState, useEffect } from 'react'; // useState, useEffect 임포트
import './RouteSearch.css';
// LocationSearchInput 임포트 삭제

function RouteSearch({ 
  destination, 
  setDestination,
  finalDestination,
  setFinalDestination,
  
  onStartPlaceSelect, // {name, lat, lng} 객체를 받는 함수
  onEndPlaceSelect,   // {name, lat, lng} 객체를 받는 함수
  
  onAnalyzeClick,
  isLoading
}) {
  
  // --- [추가] 자동완성 및 검색 로직 ---
  
  // 1. 자동완성 목록 상태
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  
  // 2. 일반 검색 로딩 상태
  const [isStartSearching, setIsStartSearching] = useState(false);
  const [isEndSearching, setIsEndSearching] = useState(false);

  // 3. 출발지(Destination) 자동완성 API 호출
  useEffect(() => {
    if (destination.length < 2) {
      setStartSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/bases/search?q=${destination}`);
        setStartSuggestions(await response.json());
      } catch (err) { console.error("출발지 기지 검색 실패:", err); }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [destination]);

  // 4. 도착지(Final Destination) 자동완성 API 호출
  useEffect(() => {
    if (finalDestination.length < 2) {
      setEndSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/bases/search?q=${finalDestination}`);
        setEndSuggestions(await response.json());
      } catch (err) { console.error("도착지 기지 검색 실패:", err); }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [finalDestination]);

  // 5. [엔터] 일반 장소 검색 처리 (Nominatim API)
  const handleGeneralSearch = async (value, type) => {
    if (!value) return;

    if (type === 'start') setIsStartSearching(true);
    else setIsEndSearching(true);
    
    setStartSuggestions([]);
    setEndSuggestions([]);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${value}&viewbox=126.7,37.7,127.2,37.4&bounded=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        const place = data[0];
        const selectedPlace = {
          name: place.display_name,
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon)
        };
        
        // 부모(Sidebar)에게 좌표 전달 및 텍스트 변경
        if (type === 'start') {
          setDestination(place.display_name);
          onStartPlaceSelect(selectedPlace);
        } else {
          setFinalDestination(place.display_name);
          onEndPlaceSelect(selectedPlace);
        }
      } else { alert("장소를 찾을 수 없습니다."); }
    } catch (err) { alert("검색 중 오류가 발생했습니다."); }
    
    if (type === 'start') setIsStartSearching(false);
    else setIsEndSearching(false);
  };

  // 6. [자동완성 클릭] 제설 기지 선택 처리
  const handleSuggestionClick = (base, type) => {
    const selectedPlace = { name: base.address, lat: base.lat, lng: base.lng };
    if (type === 'start') {
      setDestination(base.address);
      onStartPlaceSelect(selectedPlace);
      setStartSuggestions([]);
    } else {
      setFinalDestination(base.address);
      onEndPlaceSelect(selectedPlace);
      setEndSuggestions([]);
    }
  };
  
  // 7. 폼 제출 핸들러 (수정 없음)
  const handleSubmit = (e) => {
    e.preventDefault(); 
    onAnalyzeClick();
  };

  // [공통] 자동완성 목록 렌더링 함수
  const renderSuggestions = (suggestions, type) => (
    <ul className="suggestions-list">
      <li className="suggestion-header">제설 기지 (자동완성)</li>
      {suggestions.map(base => (
        <li
          key={base.id}
          className="suggestion-item"
          onClick={() => handleSuggestionClick(base, type)}
        >
          <span className={`icon ${base.type === '발진' ? 'base' : 'forward'}`}></span>
          <div>
            <strong>[{base.type}] {base.agency}</strong>
            <small>{base.address}</small>
          </div>
        </li>
      ))}
      <li className="suggestion-footer">
        엔터를 눌러 일반 장소 검색
      </li>
    </ul>
  );

  return (
    <div className="route-search-container">
      <h4>Route Search</h4>
      
      <form onSubmit={handleSubmit}>
        
        {/* --- 1. 출발지 입력 --- */}
        <div className="input-group">
          <label htmlFor="destination">Destination</label>
          <div className="location-search-wrapper"> {/* [추가] 래퍼 */}
            <input 
              type="text" 
              id="destination" 
              placeholder="출발지 입력 (기지 자동완성)..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleGeneralSearch(destination, 'start'))}
              autoComplete="off"
            />
            {isStartSearching && <div className="spinner"></div>}
            {startSuggestions.length > 0 && renderSuggestions(startSuggestions, 'start')}
          </div>
        </div>

        {/* --- 2. 도착지 입력 --- */}
        <div className="input-group">
          <label htmlFor="finalDestination">Final destination</label>
          <div className="location-search-wrapper"> {/* [추가] 래퍼 */}
            <input 
              type="text" 
              id="finalDestination"
              placeholder="도착지 입력 (기지 자동완성)..."
              value={finalDestination}
              onChange={(e) => setFinalDestination(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleGeneralSearch(finalDestination, 'end'))}
              autoComplete="off"
            />
            {isEndSearching && <div className="spinner"></div>}
            {endSuggestions.length > 0 && renderSuggestions(endSuggestions, 'end')}
          </div>
        </div>

        <button 
          className="analyze-button"
          type="submit"
          disabled={isLoading || !destination || !finalDestination}
        >
          {isLoading ? '분석 중...' : 'Analyze Route'}
        </button>
      </form>
    </div>
  );
}

export default RouteSearch;