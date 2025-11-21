import React, { useState, useEffect } from 'react';
import './MyRoutes.css';
import { useAuth } from '../context/AuthContext';

const MyRoutes = () => {
  const { token, logout } = useAuth();

  const [savedRoutes, setSavedRoutes] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState(''); 
  const [activeTab, setActiveTab] = useState('history');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (token) {
      fetchMyRoutes();
      fetchHistory();
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        executeSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchMyRoutes = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://127.0.0.1:5000/api/routes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401) { logout(); return; }

      if (res.ok) setSavedRoutes(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://127.0.0.1:5000/api/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) { logout(); return; }

      if (res.ok) setRecentHistory(await res.json());
    } catch (err) { console.error(err); }
  };

  const executeSearch = async (query) => {
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=kr&limit=5`,
        { headers: { 'User-Agent': 'SnowRouteApp/1.0' } }
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickAction = (type) => {
    const targetNames = type === 'home' ? ['집', 'Home', 'home', '우리집'] : ['회사', 'Work', 'work', '직장'];
    const found = savedRoutes.find(r => targetNames.includes(r.name));

    if (found) {
      const event = new CustomEvent('loadSavedRoute', {
        detail: { 
          start: found.start, end: found.end, 
          startCoords: found.start_coords, endCoords: found.end_coords 
        }
      });
      window.dispatchEvent(event);
      alert(`'${found.name}' 경로를 불러왔습니다.`);
    } else {
      setModalTarget(type);
      setSearchQuery('');
      setSearchResults([]);
      setActiveTab('history');
      setIsModalOpen(true);
    }
  };

  const handleConfirmSet = async (place, source) => {
    if (!token) {
        alert("로그인이 필요합니다.");
        return;
    }

    const routeName = modalTarget === 'home' ? 'Home' : 'Work';
    let payload = {};

    if (source === 'history') {
       alert("정확한 위치 설정을 위해 검색 탭을 이용해주세요.");
       setSearchQuery(place.end);
       setActiveTab('search');
       return;
    } else if (source === 'search') {
       payload = {
         name: routeName,
         start_name: "현재 위치", 
         start_lat: 37.5665,
         start_lng: 126.9780,
         end_name: place.display_name.split(',')[0],
         end_lat: parseFloat(place.lat),
         end_lng: parseFloat(place.lon)
       };
    }

    try {
      const res = await fetch('http://127.0.0.1:5000/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
          alert("세션이 만료되었습니다.");
          logout();
          return;
      }

      if (res.ok) {
        alert(`${routeName} 설정이 완료되었습니다!`);
        setIsModalOpen(false);
        fetchMyRoutes();
      } else {
        const err = await res.json();
        alert(err.error || "설정 실패");
      }
    } catch (e) { console.error(e); }
  };

  const handleRouteClick = (route) => {
    const event = new CustomEvent('loadSavedRoute', {
      detail: { 
        start: route.start, end: route.end, 
        startCoords: route.start_coords, endCoords: route.end_coords 
      }
    });
    window.dispatchEvent(event);
    alert(`'${route.name}' 경로를 지도에 표시합니다.`);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if(!window.confirm("삭제하시겠습니까?")) return;
    
    const res = await fetch(`http://127.0.0.1:5000/api/routes/${id}`, { 
        method: 'DELETE', 
        headers: {'Authorization': `Bearer ${token}`} 
    });
    if (res.status === 401) { logout(); return; }

    if (res.ok) {
        setSavedRoutes(savedRoutes.filter(r => r.id !== id));
    }
  };

  return (
    <div className="my-routes-container">
      <div className="header-section">
        <h2>📂 내 경로 관리</h2>
        <p>자주 가는 경로를 저장하고 위험도를 미리 확인하세요.</p>
      </div>

      <div className="quick-actions">
        <button className="action-card home" onClick={() => handleQuickAction('home')}>
          <span className="icon">🏠</span> <span className="label">집으로</span>
        </button>
        <button className="action-card work" onClick={() => handleQuickAction('work')}>
          <span className="icon">🏢</span> <span className="label">회사로</span>
        </button>
        <button className="action-card add" onClick={() => alert("경로 검색 탭에서 검색 후 [Save] 버튼을 눌러주세요.")}>
          <span className="icon">➕</span> <span className="label">경로 추가</span>
        </button>
      </div>

      <hr className="divider" />

      <section className="route-section">
        <h3>⭐ 즐겨찾기</h3>
        <div className="route-list">
          {savedRoutes.length === 0 ? <p className="empty">저장된 경로가 없습니다.</p> : 
            savedRoutes.map(route => (
              <div className="route-card" key={route.id} onClick={() => handleRouteClick(route)}>
                <div className="route-info">
                  <h4>{route.name}</h4>
                  <p>{route.start} ➝ {route.end}</p>
                </div>
                <button className="delete-btn" onClick={(e) => handleDelete(e, route.id)}>🗑️</button>
              </div>
          ))}
        </div>
      </section>

      <section className="route-section">
        <h3>🕒 최근 검색 기록</h3>
        <div className="history-list">
          {recentHistory.length === 0 ? <p className="empty">기록이 없습니다.</p> :
            recentHistory.map(h => (
              <div className="history-item" key={h.id}>
                <span className="date">{h.date}</span>
                <span className="path">{h.start} ➝ {h.end}</span>
                <span className="score" style={{color: h.score >= 80 ? '#ff4d4f' : '#52c41a'}}>
                  {h.score > 0 ? `${h.score}점` : '-'}
                </span>
              </div>
          ))}
        </div>
      </section>
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="route-modal-content" onClick={e => e.stopPropagation()}>
            <h3>{modalTarget === 'home' ? '🏠 집 위치 설정' : '🏢 회사 위치 설정'}</h3>
            
            <div className="modal-tabs">
              <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>최근 기록</button>
              <button className={activeTab === 'search' ? 'active' : ''} onClick={() => setActiveTab('search')}>주소 검색</button>
            </div>

            <div className="modal-body">
              {activeTab === 'history' ? (
                <ul className="modal-history-list">
                  {recentHistory.length === 0 && <p className="empty" style={{padding: '10px'}}>최근 기록이 없습니다.</p>}
                  {recentHistory.map(h => (
                    <li key={h.id} className="history-select-item">
                      <div className="history-path">{h.start} ➝ {h.end}</div>
                      <div className="history-actions">
                        <button onClick={() => handleConfirmSet(h, 'history')}>
                          이 위치 등록
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <div className="modal-search-box">
                    <input 
                      placeholder="도로명 주소, 건물명, 지하철역 검색..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  
                  {isSearching && <p style={{textAlign:'center', color:'#888'}}>🔍 검색 중...</p>}
                  
                  <ul className="search-results">
                    {!isSearching && searchResults.length === 0 && searchQuery.length > 1 && (
                        <p style={{textAlign:'center', color:'#666', marginTop:'20px'}}>검색 결과가 없습니다.</p>
                    )}
                    {searchResults.map(place => (
                      <li key={place.place_id} onClick={() => handleConfirmSet(place, 'search')}>
                        {place.display_name}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            
            <div className="modal-footer">
                <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRoutes;