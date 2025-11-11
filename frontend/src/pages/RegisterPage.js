import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 1. useNavigate 훅 import
import './RegisterPage.css'; // (CSS 파일이 있다면)

// 2. API 주소를 상수로 분리 (사용자님의 코드 반영)
const API_BASE_URL = 'http://127.0.0.1:5000/api/register'; 

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('general');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false); 

    // 3. navigate 함수 초기화
    const navigate = useNavigate();

    // 4. "가입하기" 버튼 클릭 시 실행될 함수 (form의 onSubmit으로 변경)
    const handleSubmit = async (e) => {
        e.preventDefault(); // 5. 폼 기본 제출 동작(새로고침) 방지
        
        setMessage('');
        setIsError(false);
        setIsLoading(true);

        // 6. 사용자님의 클라이언트 측 유효성 검사 (유지)
        if (!username || !password) {
            setMessage('사용자 이름과 비밀번호를 입력해주세요.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(API_BASE_URL, {
                username: username,
                password: password,
                email: email, 
                role: role
            });

            setMessage(response.data.message + ' 잠시 후 로그인 페이지로 이동합니다.');
            setIsError(false);
            setUsername('');
            setPassword('');
            setEmail('');

            // 7. (추가) 회원가입 성공 시 2초 후 로그인 페이지로 이동
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            const errorMessage = error.response?.data?.error || '회원가입에 실패했습니다. 서버를 확인해주세요.';
            setMessage(errorMessage);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // 8. <div> 대신 <form> 태그 사용, onSubmit 핸들러 연결
        <form className="register-container" onSubmit={handleSubmit}>
            <h2 className="register-title">회원가입</h2>

            <input
                className="register-input"
                type="text"
                placeholder="사용자 이름"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required // 9. HTML 기본 유효성 검사 추가
            />
            <input
                className="register-input"
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required // 9. HTML 기본 유효성 검사 추가
            />
             <input
                className="register-input"
                type="email"
                placeholder="이메일 (선택)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <select 
                className="register-select"
                value={role} 
                onChange={(e) => setRole(e.target.value)}
            >
                <option value="general">일반 사용자</option>
                <option value="expert">전문가 (제설차 운전자)</option>
            </select>

            {/* 10. onClick 대신 type="submit"으로 변경 */}
            <button 
                className="register-button" 
                type="submit"
                disabled={isLoading}
            >
                {isLoading ? '처리 중...' : '회원가입'}
            </button>

            {/* 메시지 표시 (사용자님의 코드 반영) */}
            {message && (
                <div className={`register-message ${isError ? 'message-error' : 'message-success'}`}>
                    {message}
                </div>
            )}
        </form>
    );
};

export default RegisterPage;

