import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; 
import './MapDisplay.css';
import { useMapTheme } from '../context/MapThemeContext'; 

function MapDisplay() {
  const position = [37.5665, 126.9780]; 
  const { currentTheme } = useMapTheme(); 

  return (
    <div className="map-display-container">
      <MapContainer 
        center={position} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution={currentTheme.attribution}
          url={currentTheme.url}
        />
      </MapContainer>
    </div>
  );
}

export default MapDisplay;