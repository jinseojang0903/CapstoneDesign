import React from 'react';
import './CriticalZones.css';
import { criticalZonesData } from '../data/mockData.js';

function CriticalZones() {
  return (
    <div className="zones-container">
      <h4>Critical Zones</h4>
      {criticalZonesData.map((zone) => (
        <div className="zone-item" key={zone.level}>
          <span className="zone-level" style={{ color: zone.color }}>
            {zone.level}
          </span>
          <span className="zone-condition">
            {zone.condition}
          </span>
        </div>
      ))}
    </div>
  );
}

export default CriticalZones;