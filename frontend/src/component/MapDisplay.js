import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; 
import './MapDisplay.css';
import { useMapTheme } from '../context/MapThemeContext';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

function SelectedLocationMarkers({ startPoint, endPoint }) {
  const map = useMap(); 
  useEffect(() => {
    if (startPoint && endPoint) {
      const bounds = L.latLngBounds([startPoint.lat, startPoint.lng], [endPoint.lat, endPoint.lng]);
      map.flyToBounds(bounds, { padding: [50, 50] });
    } else if (startPoint) {
      map.flyTo([startPoint.lat, startPoint.lng], 15);
    } else if (endPoint) {
      map.flyTo([endPoint.lat, endPoint.lng], 15);
    }
  }, [startPoint, endPoint, map]);

  return (
    <>
      {startPoint && <Marker position={[startPoint.lat, startPoint.lng]}><Popup><strong>🟢 출발지</strong><br/>{startPoint.name}</Popup></Marker>}
      {endPoint && <Marker position={[endPoint.lat, endPoint.lng]}><Popup><strong>🏁 도착지</strong><br/>{endPoint.name}</Popup></Marker>}
    </>
  );
}

function MapDisplay() { 
  const position = [37.5665, 126.9780]; 
  const { currentTheme } = useMapTheme(); 
  const [bases, setBases] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/bases')
      .then(response => response.json())
      .then(data => setBases(data))
      .catch(error => console.error("데이터 로드 실패:", error));
  }, []);

  // [기존] Sidebar -> Map (그리기용)
  useEffect(() => {
    const handlePlaceSelect = (event) => {
      const { type, place } = event.detail;
      if (type === 'start') setStartPoint(place);
      else if (type === 'end') setEndPoint(place);
    };
    window.addEventListener('placeSelected', handlePlaceSelect);
    return () => window.removeEventListener('placeSelected', handlePlaceSelect);
  }, []);

  // [신규] 마커 팝업에서 버튼 클릭 시 호출할 함수
  const handleSetRoutePoint = (type, base) => {
    // 1. 장소 데이터 포맷팅
    const placeData = {
      name: base.agency, // "강남구" 등
      lat: base.lat,
      lng: base.lng
    };

    // 2. "setRoutePoint" 라는 방송 송출 (Sidebar가 들음)
    const event = new CustomEvent('setRoutePoint', {
      detail: { type: type, place: placeData }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="map-display-container">
      <MapContainer center={position} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution={currentTheme.attribution} url={currentTheme.url} />

        {/* 제설 기지 마커 */}
        {bases.map(base => (
          <CircleMarker
            key={base.id}
            center={[base.lat, base.lng]}
            pathOptions={{
              color: base.type === '발진' ? '#ff4444' : '#4444ff',
              fillColor: base.type === '발진' ? '#ff0000' : '#0000ff',
              fillOpacity: 0.7
            }}
            radius={base.type === '발진' ? 10 : 6}
          >
            {/* [수정] 팝업 내부에 버튼 추가 */}
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong>[{base.type}] {base.agency}</strong><br/>
                <span style={{ fontSize: '0.9em', color: '#666' }}>{base.address}</span>
                
                <div style={{ marginTop: '8px', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                  <button 
                    onClick={() => handleSetRoutePoint('start', base)}
                    style={{
                      backgroundColor: '#28a745', color: 'white', border: 'none', 
                      borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8em'
                    }}
                  >
                    🟢 출발
                  </button>
                  <button 
                    onClick={() => handleSetRoutePoint('end', base)}
                    style={{
                      backgroundColor: '#007bff', color: 'white', border: 'none', 
                      borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8em'
                    }}
                  >
                    🏁 도착
                  </button>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        <SelectedLocationMarkers startPoint={startPoint} endPoint={endPoint} />
      </MapContainer>
    </div>
  );
}

export default MapDisplay;