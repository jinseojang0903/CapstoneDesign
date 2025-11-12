import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MapThemeProvider } from './context/MapThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MapThemeProvider>
        <App />
        </MapThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);