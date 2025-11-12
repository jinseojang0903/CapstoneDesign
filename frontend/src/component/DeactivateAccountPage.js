// DeactivateAccountPage.js

import React, { useState } from 'react';
import './SettingsPage.css'; 
import { useAuth } from '../context/AuthContext';
import { deleteAccountApi } from '../api/userApi';

const DeactivateAccountPage = ({ onBack }) => { 
    const { token, logout } = useAuth(); 
    const [passwordInput, setPasswordInput] = useState(''); 
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const isConfirmed = passwordInput.length > 0; 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        if (!passwordInput) {
            setIsError(true);
            setMessage(`계정 삭제를 위해 비밀번호를 입력해야 합니다.`);
            return;
        }

        setIsLoading(true);

        try {
            const result = await deleteAccountApi(passwordInput, token); 
            
            setMessage(result.message);
            
            setTimeout(() => {
                logout(); 
            }, 2000);
            
        } catch (error) {
            setIsError(true);
            setMessage(error.message || '계정 삭제 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="settings-container">
            <h2 className="settings-title" style={{ color: 'var(--danger-color)' }}>
                ⚠️ 계정 비활성화/탈퇴
            </h2>
            
            <button 
                className="action-button close-button" 
                style={{ width: 'auto', marginBottom: '20px' }} 
                onClick={onBack}
            >
                {'< 뒤로가기'}
            </button>
            
            <form onSubmit={handleSubmit}>
                <div className="settings-section">
                    <p style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>
                        경고: 계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                    </p>
                    <p>
                        탈퇴를 진행하려면 **현재 비밀번호**를 입력하여 본인임을 확인해 주세요.
                    </p>
                    
                    <div style={{ marginTop: '20px' }}>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
                            비밀번호 입력:
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>
                </div>
                
                {message && (
                    <p style={{ color: isError ? 'var(--danger-color)' : 'var(--accent-color)', textAlign: 'center', marginTop: '15px' }}>
                        {message}
                    </p>
                )}

                <button 
                    type="submit" 
                    className="action-button logout-button"
                    disabled={isLoading || !isConfirmed}
                    style={{ backgroundColor: 'var(--danger-color)' }}
                >
                    {isLoading ? '탈퇴 처리 중...' : '계정 영구 탈퇴'}
                </button>
            </form>
        </div>
    );
};

export default DeactivateAccountPage;