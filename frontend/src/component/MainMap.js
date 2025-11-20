import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './MainMap.css';
import { useMapTheme } from '../context/MapThemeContext';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.flyToBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

function MainMap() {
  const { currentTheme } = useMapTheme();

  const [startPlace, setStartPlace] = useState(null);
  const [endPlace, setEndPlace] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [routeStats, setRouteStats] = useState(null);
  const [lastMilePath, setLastMilePath] = useState([]); 
  const [dangerSegments, setDangerSegments] = useState([]);
  
  const [currentMode, setCurrentMode] = useState('fast');

  useEffect(() => {
    const handleAnalyzeRequest = async (e) => {
      const { start, end, mode = 'fast' } = e.detail;
      
      setStartPlace(start);
      setEndPlace(end);
      setCurrentMode(mode);
      
      setRouteStats(null);
      setRoutePath([]); 
      setLastMilePath([]); 
      setDangerSegments([]);

      try {
        const response = await fetch('http://127.0.0.1:5000/api/find_safe_route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start: { lat: start.lat, lng: start.lng },
            end: { lat: end.lat, lng: end.lng },
            mode: mode
          })
        });
        
        const data = await response.json();

        if (data.success) {
          setRoutePath(data.path); 
          setRouteStats(data.stats); 
          
          if (data.danger_segments) {
            setDangerSegments(data.danger_segments);
          }

          if (data.path && data.path.length > 0) {
            const lastRoadPoint = data.path[data.path.length - 1]; 
            setLastMilePath([lastRoadPoint, [end.lat, end.lng]]);
          }

          const analysisEvent = new CustomEvent('analysisSuccess', {
            detail: {
              score: data.stats.average,
              status: data.stats.risk_level,
              
              sections: data.danger_segments.map((seg, idx) => ({
                id: idx,
                name: seg.road_name || '도로명 정보 없음',
                score: seg.score,
                type: seg.score >= 80 ? 'Danger' : 'Caution'
              })),

              details: {
                maxSlope: data.stats.env_details?.max_slope || 0,
                avgSlope: data.stats.env_details?.avg_slope || 0,
                avgFreeze: data.stats.env_details?.avg_freeze || 0,
                avgAccident: data.stats.env_details?.avg_accident || 0,
                avgPopulation: data.stats.env_details?.avg_population || 0,
                avgRaw: data.stats.env_details?.avg_raw || 0
              }
            }
          });
          window.dispatchEvent(analysisEvent);

        } else {
          alert("경로를 찾을 수 없습니다: " + (data.message || data.error));
        }

      } catch (error) {
        console.error("API 오류:", error);
        alert("서버와 통신 중 오류가 발생했습니다.");
      }
    };

    window.addEventListener('analyzeRequest', handleAnalyzeRequest);
    return () => window.removeEventListener('analyzeRequest', handleAnalyzeRequest);
  }, []);

  const mapBounds = (startPlace && endPlace) 
    ? L.latLngBounds([startPlace.lat, startPlace.lng], [endPlace.lat, endPlace.lng])
    : null;

  const getPathColor = () => {
    if (currentMode === 'safe') return '#2ecc71';
    return '#3498db';
  };

  return (
    <div className="main-dashboard-wrapper">
      <MapContainer 
        center={[37.5665, 126.9780]} 
        zoom={11} 
        style={{ height: '100%', width: '100%', zIndex: 0 }} 
      >
        <TileLayer 
            url={currentTheme.url} 
            attribution={currentTheme.attribution}
        />
        
        <MapUpdater bounds={mapBounds} />

        {startPlace && <Marker position={[startPlace.lat, startPlace.lng]}><Popup>출발: {startPlace.agency}</Popup></Marker>}
        {endPlace && <Marker position={[endPlace.lat, endPlace.lng]}><Popup>도착: {endPlace.agency}</Popup></Marker>}

        {routePath.length > 0 && (
          <Polyline 
            positions={routePath} 
            color={getPathColor()} 
            weight={7} 
            opacity={0.8} 
          />
        )}

        {lastMilePath.length > 0 && (
          <Polyline 
            positions={lastMilePath} 
            color="#666" 
            weight={4} 
            dashArray="5, 10" 
            opacity={0.6} 
          />
        )}

        {dangerSegments.map((segment, index) => (
          <CircleMarker
            key={index}
            center={[segment.lat, segment.lng]}
            radius={8}
            pathOptions={{
              color: '#fff',      
              weight: 2,
              fillColor: '#ff0000',
              fillOpacity: 1.0,
            }}
          >
            <Popup>
              <div style={{ textAlign: 'center', minWidth: '120px' }}>
                <div style={{ 
                  fontSize: '1.1em', 
                  fontWeight: 'bold', 
                  marginBottom: '5px', 
                  color: '#333',
                  borderBottom: '1px solid #ddd',
                  paddingBottom: '5px'
                }}>
                  {segment.road_name || '도로명 정보 없음'}
                </div>
                
                <span style={{ fontSize: '0.9em', color: '#666' }}>
                  결빙 위험도: <span style={{ color: 'red', fontWeight: 'bold' }}>{segment.score.toFixed(0)}점</span>
                </span>
              </div>
            </Popup>
          </CircleMarker>
        ))}

      </MapContainer>

      {routeStats && (
        <div className="analysis-panel">
          <h3>📊 경로 분석 결과</h3>
          <div className="stat-item">
            <span>경로 모드:</span>
            <strong style={{ color: currentMode === 'safe' ? '#2ecc71' : '#333' }}>
              {currentMode === 'safe' ? '🛡️ 안전 우회' : '🚀 최단 거리'}
            </strong>
          </div>
          <div className="stat-item">
            <span>평균 위험도:</span>
            <strong>{routeStats.average} / 100</strong>
          </div>
          <div className="stat-item">
            <span>최대 위험 구간:</span>
            <span style={{ color: routeStats.max >= 80 ? 'red' : 'orange' }}>
              {routeStats.max}점 ({routeStats.risk_level})
            </span>
          </div>
          <div className="stat-item">
             <span>위험 구간 수:</span>
             <strong>{routeStats.danger_count}곳</strong>
          </div>
          
          {dangerSegments.length > 0 && (
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#e74c3c', fontWeight: 'bold', textAlign: 'center' }}>
              ※ 지도상의 🔴 마커를 확인하세요!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MainMap;