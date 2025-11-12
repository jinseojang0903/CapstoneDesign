import React, { createContext, useContext, useState, useEffect } from 'react';
import { MAP_THEMES, DEFAULT_MAP_THEME_KEY } from '../constants/mapThemes';

const MapThemeContext = createContext();

export const useMapTheme = () => useContext(MapThemeContext);

export const MapThemeProvider = ({ children }) => {
    const [currentThemeKey, setCurrentThemeKey] = useState(
        localStorage.getItem('mapTheme') || DEFAULT_MAP_THEME_KEY
    );

    const currentTheme = MAP_THEMES[currentThemeKey];

    const setMapTheme = (themeKey) => {
        if (MAP_THEMES[themeKey]) {
            setCurrentThemeKey(themeKey);
            localStorage.setItem('mapTheme', themeKey);
        }
    };

    const value = {
        currentThemeKey,
        currentTheme,
        setMapTheme,
        MAP_THEMES,
    };

    return (
        <MapThemeContext.Provider value={value}>
            {children}
        </MapThemeContext.Provider>
    );
};