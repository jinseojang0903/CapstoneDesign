// src/api/userApi.js (app.py의 엔드포인트에 맞춘 최종 버전)

const API_BASE_URL = 'http://127.0.0.1:5000/api';
export const updateProfileApi = async (newProfileData, token) => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newProfileData),
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || '프로필 업데이트에 실패했습니다.');
    }
    return data; 
};

/**
 * 비밀번호 변경 (PATCH /api/password/change)
 * @param {string} oldPassword
 * @param {string} newPassword
 * @param {string} token
 */
export const changePasswordApi = async (oldPassword, newPassword, token) => {
    const response = await fetch(`${API_BASE_URL}/password/change`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            old_password: oldPassword, // app.py 필드명
            new_password: newPassword, // app.py 필드명
        }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        // app.py의 에러 응답 {"error": "..."} 처리
        throw new Error(data.error || '비밀번호 변경에 실패했습니다.');
    }
    
    // app.py의 성공 응답 {"message": "..."} 반환
    return data; 
};


/**
 * 계정 삭제/탈퇴 (DELETE /api/delete)
 * @param {string} password - 확인용 비밀번호
 * @param {string} token - JWT 액세스 토큰
 */
export const deleteAccountApi = async (password, token) => {
    const response = await fetch(`${API_BASE_URL}/delete`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            password: password, // app.py 필드명
        }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        // app.py의 에러 응답 {"error": "..."} 처리
        throw new Error(data.error || '계정 삭제에 실패했습니다.');
    }
    
    // app.py의 성공 응답 {"message": "..."} 반환
    return data; 
};