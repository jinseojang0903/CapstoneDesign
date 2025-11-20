import React, { useState, useEffect, useCallback } from 'react';
import './MyRoutes.css';

const MyRoutes = () => {
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  
  // --- 모달 UI 상태 ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState(''); // 'home' or 'work'
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'search'
  
  // --- 검색 로직 상태 ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    fetchMyRoutes();
    fetchHistory();
  }, []);

  // [핵심] 검색어 입력 시 디바운싱 (Debouncing) 처리
  // 사용자가 타이핑을 멈춘 후 500ms 뒤에 API 호출
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
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://127.0.0.1:5000/api/routes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSavedRoutes(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchHistory = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://127.0.0.1:5000/api/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
    // 저장된 이름 매칭 (유연하게)
    const targetNames = type === 'home' ? ['집', 'Home', 'home', '우리집'] : ['회사', 'Work', 'work', '직장'];
    const found = savedRoutes.find(r => targetNames.includes(r.name));

    if (found) {
      // 이미 저장되어 있으면 불러오기 이벤트 발생
      const event = new CustomEvent('loadSavedRoute', {
        detail: { 
          start: found.start, end: found.end, 
          startCoords: found.start_coords, endCoords: found.end_coords 
        }
      });
      window.dispatchEvent(event);
      alert(`'${found.name}' 경로를 불러왔습니다.`);
    } else {
      // 저장 안되어 있으면 모달 열기
      setModalTarget(type);
      setSearchQuery('');
      setSearchResults([]);
      setActiveTab('history'); // 기본 탭은 히스토리
      setIsModalOpen(true);
    }
  };

  const handleConfirmSet = async (place, source) => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("로그인이 필요합니다.");
        return;
    }

    const routeName = modalTarget === 'home' ? 'Home' : 'Work';
    let payload = {};

    if (source === 'history') {
       // 히스토리 데이터 사용 시 로직 (현재는 좌표 문제로 검색 탭 유도)
       alert("정확한 위치 설정을 위해 검색 탭을 이용해주세요.");
       setSearchQuery(place.end); // 검색어로 자동 입력
       setActiveTab('search');
       return;
    } else if (source === 'search') {
       // 검색 결과 사용
       // 출발지는 '현재 위치(임시)'로 고정하고 도착지를 선택한 장소로 설정
       payload = {
         name: routeName,
         start_name: "현재 위치", 
         start_lat: 37.5665, // 임시 좌표 (시청)
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
      
      if (res.ok) {
        alert(`${routeName} 설정이 완료되었습니다!`);
        setIsModalOpen(false);
        fetchMyRoutes(); // 목록 갱신
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
    const token = localStorage.getItem('token');
    await fetch(`http://127.0.0.1:5000/api/routes/${id}`, { method: 'DELETE', headers: {'Authorization': `Bearer ${token}`} });
    setSavedRoutes(savedRoutes.filter(r => r.id !== id));
  };

  return (
    <div className="my-routes-container">
      <div className="header-section">
        <h2>📂 내 경로 관리</h2>
        <p>자주 가는 경로를 저장하고 위험도를 미리 확인하세요.</p>
      </div>

      {/* 퀵 액션 버튼 */}
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

      {/* 즐겨찾기 목록 */}
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

      {/* 최근 검색 기록 */}
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

      {/* ================= 모달 창 ================= */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
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
                        {/* 기록을 클릭하면 해당 목적지를 검색 탭으로 넘겨서 좌표 검색 유도 */}
                        <button onClick={() => handleConfirmSet(h, 'history')}>
                          이 위치 등록
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  {/* CSS 클래스명 일치시킴: modal-search-box */}
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