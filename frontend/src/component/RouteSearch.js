import React, { useState, useEffect } from 'react';
import './RouteSearch.css';

function RouteSearch({ 
  destination: propDest, 
  setDestination: propSetDest,
  finalDestination: propFinalDest,
  setFinalDestination: propSetFinalDest,
}) {
  
  const [localDest, setLocalDest] = useState('');
  const [localFinalDest, setLocalFinalDest] = useState('');
  
  const destination = propDest !== undefined ? propDest : localDest;
  const setDestination = propSetDest || setLocalDest;
  
  const finalDestination = propFinalDest !== undefined ? propFinalDest : localFinalDest;
  const setFinalDestination = propSetFinalDest || setLocalFinalDest;

  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- [1] MyRoutes에서 즐겨찾기 클릭 시 데이터를 받아오는 리스너 ---
  useEffect(() => {
    const handleLoadSavedRoute = (e) => {
      const { start, end, startCoords, endCoords } = e.detail;
      setDestination(start);
      setFinalDestination(end);
      setStartCoords(startCoords);
      setEndCoords(endCoords);
    };
    window.addEventListener('loadSavedRoute', handleLoadSavedRoute);
    return () => window.removeEventListener('loadSavedRoute', handleLoadSavedRoute);
  }, [setDestination, setFinalDestination]);

  const fetchLocations = async (query, setSuggestions) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const baseRes = await fetch(`http://127.0.0.1:5000/api/bases/search?q=${query}`);
      const bases = await baseRes.json();

      const nominatimRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=kr&limit=3`,
        { headers: { 'User-Agent': 'SnowRouteApp/1.0' } }
      );
      const places = await nominatimRes.json();
      
      const formattedPlaces = places.map(p => ({
        id: p.place_id,
        agency: p.display_name.split(',')[0],
        address: p.display_name,
        lat: parseFloat(p.lat),
        lng: parseFloat(p.lon),
        type: 'general'
      }));
      setSuggestions([...bases, ...formattedPlaces]);

    } catch (err) { console.error("검색 실패:", err); }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchLocations(destination, setStartSuggestions), 300);
    return () => clearTimeout(timer);
  }, [destination]);

  useEffect(() => {
    const timer = setTimeout(() => fetchLocations(finalDestination, setEndSuggestions), 300);
    return () => clearTimeout(timer);
  }, [finalDestination]);

  const handleSelect = (place, type) => {
    if (type === 'start') {
      setStartCoords(place);
      setDestination(place.agency);
      setStartSuggestions([]);
    } else {
      setEndCoords(place);
      setFinalDestination(place.agency);
      setEndSuggestions([]);
    }
  };

  // --- [2] 경로 분석 및 기록 저장 ---
  const handleAnalyze = async () => {
    if (!startCoords || !endCoords) {
      alert("출발지와 도착지를 리스트에서 선택해주세요!");
      return;
    }

    setIsLoading(true);

    // 1. 이벤트 발생 (지도 그리기)
    const event = new CustomEvent('analyzeRequest', {
      detail: { start: startCoords, end: endCoords }
    });
    window.dispatchEvent(event);
    
    // 2. [신규] 검색 기록 DB 저장
    const token = localStorage.getItem('token');
    if(token) {
      try {
        await fetch('http://127.0.0.1:5000/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            start_name: destination,
            end_name: finalDestination,
            start_lat: startCoords.lat,
            start_lng: startCoords.lng,
            end_lat: endCoords.lat,
            end_lng: endCoords.lng,
            score: 0 // 점수는 분석 결과에서 받아와야 하지만 일단 0
          })
        });
      } catch(e) { console.error("History save failed", e); }
    }

    setTimeout(() => setIsLoading(false), 2000);
  };

  // --- [3] 경로 저장 (즐겨찾기) ---
  const handleSaveRoute = async () => {
    if (!startCoords || !endCoords) {
      alert("저장할 출발지와 도착지가 선택되지 않았습니다.");
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) { alert("로그인이 필요합니다."); return; }

    const routeName = prompt("이 경로의 이름을 입력하세요 (예: 집, 회사)");
    if (!routeName) return;

    try {
      const response = await fetch('http://127.0.0.1:5000/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: routeName,
          start_name: destination,
          start_lat: startCoords.lat,
          start_lng: startCoords.lng,
          end_name: finalDestination,
          end_lat: endCoords.lat,
          end_lng: endCoords.lng
        })
      });

      if (response.ok) {
        alert(`'${routeName}' 저장 완료!`);
      } else {
        const data = await response.json();
        alert(data.error || "저장 실패");
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="route-search-container">
      <h4>Route Search</h4>
      
      <div className="input-group">
        <label>Start Point</label>
        <input 
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="예: 강남역"
        />
        {startSuggestions.length > 0 && (
          <ul className="suggestion-list">
            {startSuggestions.map((s, i) => (
              <li key={i} onClick={() => handleSelect(s, 'start')}>
                <span className={`icon ${s.type === 'general' ? 'general' : 'base'}`}></span>
                {s.agency}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="input-group">
        <label>Destination</label>
        <input 
          value={finalDestination}
          onChange={(e) => setFinalDestination(e.target.value)}
          placeholder="예: 서초역"
        />
        {endSuggestions.length > 0 && (
          <ul className="suggestion-list">
            {endSuggestions.map((s, i) => (
              <li key={i} onClick={() => handleSelect(s, 'end')}>
                <span className={`icon ${s.type === 'general' ? 'general' : 'base'}`}></span>
                {s.agency}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="button-group" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button className="analyze-button" onClick={handleAnalyze} disabled={isLoading} style={{ flex: 2 }}>
          {isLoading ? 'Analyzing...' : 'Analyze Route'}
        </button>
        <button className="save-button" onClick={handleSaveRoute} style={{ flex: 1, backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Save
        </button>
      </div>
    </div>
  );
}

export default RouteSearch;