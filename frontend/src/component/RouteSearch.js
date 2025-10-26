import React, { useState } from 'react';
import './RouteSearch.css';

function RouteSearch() {
  const [destination, setDestination] = useState('');

  const handleDestinationChange = (event) => {
    setDestination(event.target.value);
  };

  const handleAnalyzeClick = () => {
    console.log('분석할 목적지:', destination);
  };

  return (
    <div className="route-search-container">
      <h4>Route Search</h4>
      <div className="input-group">
        <label htmlFor="destination">Destination</label>
        <input 
          type="text" 
          id="destination" 
          placeholder="Enter destination..."
          
          value={destination}
          onChange={handleDestinationChange}
        />
      </div>
      <button 
        className="analyze-button"
        onClick={handleAnalyzeClick}
      >
        Analyze Route
      </button>
    </div>
  );
}

export default RouteSearch;