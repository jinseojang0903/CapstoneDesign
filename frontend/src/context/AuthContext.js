import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);
const TOKEN_KEY = 'accessToken';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    const [theme, setTheme] = useState(localStorage.getItem('appTheme') || 'dark'); 

    const toggleTheme = () => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('appTheme', newTheme);
            return newTheme;
        });
    };
    
    useEffect(() => {
        document.body.className = theme;
    }, [theme]);


    const decodeToken = (token) => {
        console.log('[AuthContext] Attempting to decode token:', token);
        try {
            const decoded = jwtDecode(token);
            console.log('[AuthContext] Decoded token object:', decoded);
            return {
                id: decoded.sub,
                username: decoded.name,
                role: decoded.role
            };
        } catch (error) {
            console.error("Token decoding failed:", error);
            return null;
        }
    };

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        console.log('[AuthContext] Initial token from localStorage:', token);
        if (token) {
            const userData = decodeToken(token);
            if (userData) {
                setIsAuthenticated(true);
                setUser(userData);
            } else {
                localStorage.removeItem(TOKEN_KEY);
                setIsAuthenticated(false);
                setUser(null);
            }
        }
    }, []); 

    const loginSuccess = (token) => {
        console.log('[AuthContext] loginSuccess received token:', token);
        localStorage.setItem(TOKEN_KEY, token);
        const userData = decodeToken(token);
        if (userData) {
            setIsAuthenticated(true);
            setUser(userData);
        } else {
             localStorage.removeItem(TOKEN_KEY);
             setIsAuthenticated(false);
             setUser(null);
        }
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        setIsAuthenticated(false);
        setUser(null);
        console.log('[AuthContext] User logged out.');
    };

    const contextValue = {
        isAuthenticated,
        user,
        loginSuccess,
        logout,
        theme,
        toggleTheme,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};