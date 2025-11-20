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

  const fetchLocations = async (query, setSuggestions) => {
    if (query.length < 2) {
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

    } catch (err) {
      console.error("검색 실패:", err);
    }
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

  const handleAnalyze = () => {
    if (!startCoords || !endCoords) {
      alert("출발지와 도착지를 리스트에서 선택해주세요!");
      return;
    }

    setIsLoading(true);

    const event = new CustomEvent('analyzeRequest', {
      detail: { start: startCoords, end: endCoords }
    });
    window.dispatchEvent(event);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="route-search-container">
      <h4>Route Search</h4>
      
      {/* 출발지 입력 */}
      <div className="input-group">
        <label>Start Point</label>
        <input 
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="예: 강남역, 강남구 제설기지"
        />
        {startSuggestions.length > 0 && (
          <ul className="suggestion-list">
            {startSuggestions.map((s, i) => (
              <li key={i} onClick={() => handleSelect(s, 'start')}>
                <span className={`icon ${s.type === 'general' ? 'general' : 'base'}`}></span>
                {s.agency} <small>{s.type === 'general' ? '(일반)' : '(기지)'}</small>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 도착지 입력 */}
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

      <button className="analyze-button" onClick={handleAnalyze} disabled={isLoading}>
        {isLoading ? 'Analyzing...' : 'Analyze Route'}
      </button>
    </div>
  );
}

export default RouteSearch;