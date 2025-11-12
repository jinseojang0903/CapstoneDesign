// EditProfilePage.js

import React, { useState } from 'react';
import './SettingsPage.css'; 
import { useAuth } from '../context/AuthContext'; 
import { updateProfileApi } from '../api/userApi';

const EditProfilePage = ({ onBack, user }) => { 
    const { token, updateUserProfile, loginSuccess } = useAuth(); 
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '', 
        role: user?.role || 'general',
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
        setIsLoading(true);
        setMessage('');
        setIsError(false);
        const updateData = {
            username: formData.username,
            email: formData.email,
            role: formData.role,
        };

        try {
            const result = await updateProfileApi(updateData, token); 
            setMessage(result.message);
            
            if (updateUserProfile) {
                updateUserProfile({ 
                    ...user, 
                    username: formData.username,
                    email: formData.email, 
                    role: formData.role 
                });
            }
            if (result.access_token && loginSuccess) {
                console.log("새 토큰을 발급받았습니다. 토큰을 갱신합니다.");
                loginSuccess(result.access_token);
            }
            
        } catch (error) {
            setIsError(true);
            setMessage(error.message || '프로필 업데이트 중 알 수 없는 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="settings-container">
            <h2 className="settings-title">프로필 정보 수정</h2>
            
            <button 
                className="action-button close-button" 
                style={{ width: 'auto', marginBottom: '20px' }} 
                onClick={onBack}
            >
                {'< 뒤로가기'}
            </button>
            
            <form onSubmit={handleSubmit}>
                <div className="settings-section" style={{ borderBottom: 'none' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>
                            사용자 이름:
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
                            이메일:
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="role" style={{ display: 'block', marginBottom: '5px' }}>
                            사용자 역할:
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        >
                            <option value="general">일반 사용자</option>
                            <option value="expert">전문가</option>
                        </select>
                    </div>
                    
                </div>
                
                {message && (
                    <p style={{ color: isError ? 'var(--danger-color)' : 'var(--accent-color)', textAlign: 'center', marginTop: '15px' }}>
                        {message}
                    </p>
                )}

                <button 
                    type="submit" 
                    className="action-button close-button"
                    disabled={isLoading}
                >
                    {isLoading ? '저장 중...' : '변경 사항 저장'}
                </button>
            </form>
        </div>
    );
};

export default EditProfilePage;