// ChangePasswordPage.js (API 연동 및 자동 로그아웃 기능 포함)
import React, { useState } from 'react';
import './SettingsPage.css'; 
import { useAuth } from '../context/AuthContext'; // 1. AuthContext에서 토큰 가져오기
import { changePasswordApi } from '../api/userApi'; // 2. 실제 API 함수 import

// 3. (onBack, onLogout)을 props로 받습니다. (userId는 토큰을 사용하므로 제거)
const ChangePasswordPage = ({ onBack, onLogout }) => { 
    // 4. useAuth 훅을 사용하여 JWT 토큰을 가져옵니다.
    const { token } = useAuth(); 

    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        
        if (formData.newPassword !== formData.confirmNewPassword) {
            setIsError(true);
            setMessage('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
            return;
        }

        // 5. 비밀번호 길이 검사 (app.py와 동일하게 4자로 수정)
        if (formData.newPassword.length < 4) {
            setIsError(true);
            setMessage('새 비밀번호는 최소 4자 이상이어야 합니다.');
            return;
        }

        setIsLoading(true);

        try {
            // 6. ⭐ 실제 API 클라이언트를 사용하여 백엔드 호출 ⭐
            const result = await changePasswordApi(
                formData.oldPassword, 
                formData.newPassword,
                token // JWT 토큰 전달
            );
            
            // 7. 성공 메시지 수정 (로그아웃 안내)
            setMessage(result.message + " (2초 후 로그인 페이지로 이동합니다.)");
            setIsError(false); // 성공 시 에러 상태 초기화

            setFormData({ // 폼 초기화
                oldPassword: '',
                newPassword: '',
                confirmNewPassword: '',
            });

            // 8. (*** 여기가 로그아웃 코드입니다 ***)
            // 2초 후 onLogout 함수 호출 (자동 로그아웃)
            setTimeout(() => {
                if (onLogout) {
                    onLogout(); // AuthContext의 logout 함수가 실행됩니다.
                }
            }, 2000); // 2초 딜레이
            
        } catch (error) {
            setIsError(true);
            setMessage(error.message || '비밀번호 변경 중 알 수 없는 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="settings-container">
            <h2 className="settings-title">비밀번호 변경</h2>
            
            <button 
                className="action-button close-button" 
                style={{ width: 'auto', marginBottom: '20px' }} 
                onClick={onBack}
            >
                {'< 뒤로가기'}
            </button>
            
            <form onSubmit={handleSubmit}>
                <div className="settings-section" style={{ borderBottom: 'none' }}>
                    
                    <InputGroup 
                        label="현재 비밀번호" 
                        name="oldPassword" 
                        type="password"
                        value={formData.oldPassword}
                        onChange={handleChange}
                    />

                    <InputGroup 
                        label="새 비밀번호" 
                        name="newPassword" 
                        type="password"
                        value={formData.newPassword}
                        onChange={handleChange}
                    />

                    <InputGroup 
                        label="새 비밀번호 확인" 
                        name="confirmNewPassword" 
                        type="password"
                        value={formData.confirmNewPassword}
                        onChange={handleChange}
                    />
                </div>
                
                {message && (
                    <p style={{ color: isError ? 'var(--danger-color)' : 'var(--accent-color)', textAlign: 'center', marginTop: '15px' }}>
                        {message}
                    </p>
                )}

                <button 
                    type="submit" 
                    className="action-button close-button"
                    // 9. 로딩 중이거나 메시지가 표시된 상태(성공한 상태)에서는 버튼 비활성화
                    disabled={isLoading || (message && !isError) || !formData.oldPassword || !formData.newPassword || !formData.confirmNewPassword}
                >
                    {isLoading ? '변경 중...' : '비밀번호 변경'}
                </button>
            </form>
        </div>
    );
};

// 재사용 가능한 입력 필드 컴포넌트
const InputGroup = ({ label, name, type, value, onChange }) => (
    <div style={{ marginBottom: '15px' }}>
        <label htmlFor={name} style={{ display: 'block', marginBottom: '5px' }}>
            {label}:
        </label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required
            autoComplete={name.includes('newPassword') ? 'new-password' : name.includes('oldPassword') ? 'current-password' : ''}
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        />
    </div>
);

export default ChangePasswordPage;