import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const API_LOGIN_URL = 'http://localhost:5000/api/login';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { loginSuccess } = useAuth();

    const handleLogin = async () => {
        setMessage('');
        setIsError(false);
        setIsLoading(true);

        if (!username || !password) {
            setMessage('사용자 이름과 비밀번호를 입력해주세요.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(API_LOGIN_URL, {
                username: username,
                password: password,
            });

            // --- (추가) 백엔드 응답 전체와 토큰 값 확인 ---
            console.log('[LoginPage] API Response:', response);
            console.log('[LoginPage] Received access_token:', response.data.access_token);
            // -------------------------------------------

            const token = response.data.access_token;

            // (주의) loginSuccess 호출 전에 토큰 값이 유효한 문자열인지 확인하는 로직 추가 가능
            if (typeof token === 'string' && token.length > 0) {
                 loginSuccess(token); // AuthContext에 토큰 전달

                 setMessage('로그인 성공! 메인 페이지로 이동합니다.');
                 setIsError(false);

                 setTimeout(() => {
                     navigate('/'); // 메인 페이지로 이동
                 }, 1000);
            } else {
                 console.error('[LoginPage] Invalid token received from server:', token);
                 setMessage('서버로부터 유효하지 않은 인증 정보를 받았습니다.');
                 setIsError(true);
            }


        } catch (error) {
            console.error('[LoginPage] Login API error:', error); // 에러 객체 전체 확인
            const errorMessage = error.response?.data?.error || '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.';
            setMessage(errorMessage);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Enter 키로 로그인 제출을 위한 핸들러
    const handleKeyPress = (event) => {
      if (event.key === 'Enter' && !isLoading) {
        handleLogin();
      }
    };


    return (
        // (수정) form 태그 사용 및 onKeyPress 추가
        <div className="login-container">
            <h2 className="login-title">로그인</h2>

            <input
                className="login-input"
                type="text"
                placeholder="사용자 이름"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress} // Enter 키 이벤트 추가
                required // 필수 입력 필드 표시
            />
            <input
                className="login-input"
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress} // Enter 키 이벤트 추가
                required // 필수 입력 필드 표시
            />

            <button
                className="login-button"
                onClick={handleLogin} // 버튼 클릭으로도 여전히 작동
                disabled={isLoading}
            >
                {isLoading ? '인증 중...' : '로그인'}
            </button>

            {message && (
                <div className={`login-message ${isError ? 'message-error' : 'message-success'}`}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default LoginPage;
