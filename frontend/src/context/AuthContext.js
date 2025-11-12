import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);
const TOKEN_KEY = 'accessToken';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    
    // ⭐ 1. token을 React 상태(state)로 관리합니다.
    // (페이지 로드 시 localStorage에서 초기값을 가져옵니다.)
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
        console.log('[AuthContext] Attempting to decode token:', token);
        try {
            const decoded = jwtDecode(token);
            // 백엔드 app.py에서 identity는 username이므로, user_id 대신 username을 ID로 사용
            return {
                id: decoded.name, // app.py의 identity는 username이므로 name 사용
                username: decoded.name,
                role: decoded.role
            };
        } catch (error) {
            console.error("Token decoding failed:", error);
            return null;
        }
    };

    useEffect(() => {
        // ⭐ 2. 컴포넌트 마운트 시 토큰 상태를 명확히 설정합니다.
        const tokenFromStorage = localStorage.getItem(TOKEN_KEY);
        console.log('[AuthContext] Initial token from localStorage:', tokenFromStorage);
        if (tokenFromStorage) {
            const userData = decodeToken(tokenFromStorage);
            if (userData) {
                setIsAuthenticated(true);
                setUser(userData);
                setToken(tokenFromStorage); // 상태 설정
            } else {
                localStorage.removeItem(TOKEN_KEY);
                setIsAuthenticated(false);
                setUser(null);
                setToken(null); // 상태 비우기
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
            // ⭐ 3. 로그인 성공 시 token '상태'를 업데이트합니다.
            setToken(token);
        } else {
             localStorage.removeItem(TOKEN_KEY);
             setIsAuthenticated(false);
             setUser(null);
             // ⭐ 4. 실패 시 token '상태'를 비웁니다.
             setToken(null);
        }
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        setIsAuthenticated(false);
        setUser(null);
        // ⭐ 5. 로그아웃 시 token '상태'를 비웁니다.
        setToken(null);
        console.log('[AuthContext] User logged out.');
    };
    
    // ⭐ 1. AuthContext에 사용자 정보 업데이트 함수 추가 ⭐
    const updateUserProfile = (updatedUserData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...updatedUserData
        }));
        console.log('[AuthContext] User profile updated locally.');
        // Note: 실제 프로덕션 환경에서는 프로필 업데이트 후 백엔드에서 새로운 JWT를 받아와 갱신하는 것이 더 안전합니다.
    };
    
    // ⭐ 6. 이 변수는 더 이상 필요 없으므로 제거합니다. (이제 state 'token'을 사용)
    // const token = localStorage.getItem(TOKEN_KEY);


    const contextValue = {
        isAuthenticated,
        user,
        // ⭐ 7. 변수가 아닌 state 'token'을 Context 값으로 제공합니다.
        token, 
        updateUserProfile,
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