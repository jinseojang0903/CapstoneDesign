import React from 'react';

const pageStyle = {
  padding: '20px',
  color: 'white',
  fontSize: '1.5rem',
  height: 'calc(100vh - 65px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#282c34'
};

const AdminPage = () => {
  return (
    <div style={pageStyle}>
      <h1>Admin 관리자 페이지</h1>
    </div>
  );
};

export default AdminPage;