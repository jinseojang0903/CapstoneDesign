import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);
const TOKEN_KEY = 'accessToken';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
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
        try {
            const decoded = jwtDecode(token);
            return {
                id: decoded.name,
                username: decoded.name,
                role: decoded.role
            };
        } catch (error) {
            return null;
        }
    };

    useEffect(() => {
        const tokenFromStorage = localStorage.getItem(TOKEN_KEY);
        if (tokenFromStorage) {
            const userData = decodeToken(tokenFromStorage);
            if (userData) {
                setIsAuthenticated(true);
                setUser(userData);
                setToken(tokenFromStorage);
            } else {
                localStorage.removeItem(TOKEN_KEY);
                setIsAuthenticated(false);
                setUser(null);
                setToken(null);
            }
        }
    }, []); 

    const loginSuccess = (token) => {
        localStorage.setItem(TOKEN_KEY, token);
        const userData = decodeToken(token);
        if (userData) {
            setIsAuthenticated(true);
            setUser(userData);
            setToken(token);
        }
    };

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        window.location.href = '/login'; 
    }, []);
    
    const updateUserProfile = (updatedUserData) => {
        setUser(prevUser => ({ ...prevUser, ...updatedUserData }));
    };

    const authFetch = async (url, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, { ...options, headers });

            if (response.status === 401) {
                alert("세션이 만료되었습니다. 다시 로그인해주세요.");
                logout();
                return null;
            }

            return response;
        } catch (error) {
            console.error("Network Request Failed:", error);
            throw error;
        }
    };

    const contextValue = {
        isAuthenticated,
        user,
        token, 
        updateUserProfile,
        loginSuccess,
        logout,
        theme,
        toggleTheme,
        authFetch
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};