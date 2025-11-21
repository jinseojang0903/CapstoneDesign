import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './ProfessionalPage.css';
import { useMapTheme } from '../context/MapThemeContext';
import { useAuth } from '../context/AuthContext';

// 트랙터 아이콘 (이모지 사용)
const tractorIcon = L.divIcon({
    className: 'custom-icon',
    html: '<div style="font-size: 24px;">🚜</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const SEOUL_GU_LIST = [
    { name: 'gangnam', label: '강남구', coords: [37.5172, 127.0473] },
    { name: 'gangdong', label: '강동구', coords: [37.5301, 127.1237] },
    { name: 'gangbuk', label: '강북구', coords: [37.6396, 127.0257] },
    { name: 'gangseo', label: '강서구', coords: [37.5509, 126.8497] },
    { name: 'gwanak', label: '관악구', coords: [37.4784, 126.9516] },
    { name: 'gwangjin', label: '광진구', coords: [37.5385, 127.0823] },
    { name: 'guro', label: '구로구', coords: [37.4954, 126.8874] },
    { name: 'geumcheon', label: '금천구', coords: [37.4568, 126.8954] },
    { name: 'nowon', label: '노원구', coords: [37.6542, 127.0568] },
    { name: 'dobong', label: '도봉구', coords: [37.6688, 127.0471] },
    { name: 'dongdaemun', label: '동대문구', coords: [37.5744, 127.0400] },
    { name: 'dongjak', label: '동작구', coords: [37.5124, 126.9393] },
    { name: 'mapo', label: '마포구', coords: [37.5663, 126.9016] },
    { name: 'seodaemun', label: '서대문구', coords: [37.5791, 126.9368] },
    { name: 'seocho', label: '서초구', coords: [37.4837, 127.0324] },
    { name: 'seongdong', label: '성동구', coords: [37.5633, 127.0371] },
    { name: 'seongbuk', label: '성북구', coords: [37.5891, 127.0182] },
    { name: 'songpa', label: '송파구', coords: [37.5145, 127.1066] },
    { name: 'yangcheon', label: '양천구', coords: [37.5169, 126.8660] },
    { name: 'yeongdeungpo', label: '영등포구', coords: [37.5264, 126.8962] },
    { name: 'yongsan', label: '용산구', coords: [37.5326, 126.9900] },
    { name: 'eunpyeong', label: '은평구', coords: [37.6027, 126.9291] },
    { name: 'jongno', label: '종로구', coords: [37.5730, 126.9794] },
    { name: 'jung', label: '중구', coords: [37.5641, 126.9979] },
    { name: 'jungnang', label: '중랑구', coords: [37.6066, 127.0926] },
];

// [수정됨] 지도 시점 이동 컴포넌트 (기지 선택 시 해당 위치로 이동)
const ChangeView = ({ center, target }) => {
    const map = useMap();
    
    useEffect(() => {
        if (target) {
            // 기지가 있으면 기지로 줌인 (레벨 15)
            map.flyTo([target.lat, target.lng], 15, { duration: 1.5 });
        } else {
            // 기지가 없으면 구 중심으로 (레벨 13)
            map.flyTo(center, 13, { duration: 1.5 });
        }
    }, [center, target, map]);

    return null;
};

const ProfessionalPage = () => {
    const { currentTheme } = useMapTheme();
    const { token, authFetch } = useAuth();

    const [bases, setBases] = useState([]);
    const [selectedGu, setSelectedGu] = useState(SEOUL_GU_LIST[0]);
    const [basePoint, setBasePoint] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // 애니메이션 상태
    const [displayedPath, setDisplayedPath] = useState([]);
    const [currentPos, setCurrentPos] = useState(null);
    const [progress, setProgress] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const animationRef = useRef(null);
    const fullPathRef = useRef([]);

    useEffect(() => {
        fetch('http://127.0.0.1:5000/api/bases')
            .then(res => res.json())
            .then(data => setBases(data))
            .catch(err => console.error("기지 데이터 로드 실패:", err));
    }, []);

    const handleSelectBase = (base) => {
        setBasePoint({ lat: base.lat, lng: base.lng, name: base.agency });
        // 초기화
        setDisplayedPath([]);
        setCurrentPos(null);
        setProgress(0);
        setIsAnimating(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        
        // alert 제거 (지도가 움직이는 것으로 충분한 피드백)
    };

    // [수정됨] 애니메이션 시작 함수 (속도 조절 적용)
    const startAnimation = (pathData) => {
        fullPathRef.current = pathData;
        let index = 0;
        setIsAnimating(true);

        const animate = () => {
            if (index >= fullPathRef.current.length) {
                setIsAnimating(false);
                alert("제설 작업 완료! ❄️🚛");
                return;
            }

            const step = 1;   // 한 번에 이동할 포인트 수 (1이 가장 부드러움)
            const delay = 50; // 딜레이 (ms) - 숫자가 클수록 느려짐 (50ms 추천)
            
            setTimeout(() => {
                // 경로 업데이트
                const nextChunk = fullPathRef.current.slice(0, index + step);
                setDisplayedPath(nextChunk);
                
                // 제설차 위치 업데이트
                const headIndex = Math.min(index + step - 1, fullPathRef.current.length - 1);
                const head = fullPathRef.current[headIndex];
                setCurrentPos(head);

                // 진행률 업데이트
                const percent = Math.round((index / fullPathRef.current.length) * 100);
                setProgress(percent);

                index += step;
                
                // 다음 프레임 요청
                animationRef.current = requestAnimationFrame(animate);
            }, delay);
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    const handleGenerateRoute = async () => {
        if (!basePoint) {
            alert("지도에서 출발 기지를 먼저 선택해주세요.");
            return;
        }

        if (!token) {
            alert("로그인이 필요합니다.");
            return;
        }

        setIsLoading(true);
        setDisplayedPath([]); 
        
        try {
            // authFetch 사용 (헤더 자동 설정, 401 자동 처리)
            const res = await authFetch('http://127.0.0.1:5000/api/professional/recommend', {
                method: 'POST',
                body: JSON.stringify({
                    gu_name: selectedGu.name,
                    base_coords: { lat: basePoint.lat, lng: basePoint.lng }
                })
            });

            // authFetch가 null 반환 시(에러) 중단
            if (!res) return; 

            const data = await res.json();

            if (res.ok) {
                startAnimation(data.path);
            } else {
                alert(data.error || "경로 생성 실패");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("서버 통신 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <div className="professional-container">
            <div className="control-panel">
                <h2>🚜 AI 제설 관제</h2>
                
                <div className="control-group">
                    <label>작업 구역 (District)</label>
                    <select 
                        onChange={(e) => {
                            const gu = SEOUL_GU_LIST.find(g => g.name === e.target.value);
                            setSelectedGu(gu);
                            setBasePoint(null); 
                            setDisplayedPath([]);
                            setCurrentPos(null);
                            setProgress(0);
                        }}
                    >
                        {SEOUL_GU_LIST.map(gu => (
                            <option key={gu.name} value={gu.name}>{gu.label}</option>
                        ))}
                    </select>
                </div>

                <div className="info-text">
                    <p>1. 작업할 구를 선택하세요.</p>
                    <p>2. 지도 위 <strong>기지 마커</strong> 클릭 → <strong>[🚩출발]</strong></p>
                    <p>3. <strong>작업 시작</strong> 버튼을 누르면 실시간 경로가 표시됩니다.</p>
                </div>

                {basePoint && (
                    <div className="base-info">
                        📍 기지: <strong>{basePoint.name}</strong>
                        {progress > 0 && (
                            <div style={{ marginTop: '8px', color: '#00ffcc' }}>
                                🚧 진행률: {progress}%
                            </div>
                        )}
                    </div>
                )}

                <button 
                    className="ai-btn"
                    onClick={handleGenerateRoute} 
                    disabled={isLoading || isAnimating || !basePoint}
                    style={{
                        background: isAnimating ? '#27ae60' : (isLoading ? '#7f8c8d' : '#e74c3c')
                    }}
                >
                    {isLoading ? '경로 계산 중... (약 3초)' : (isAnimating ? '작업 수행 중... 🚜' : '제설 작업 시작')}
                </button>
            </div>

            <div className="map-area">
                <MapContainer center={selectedGu.coords} zoom={13} style={{ height: '100%', width: '100%' }}>
                    {/* [테마 적용] */}
                    <TileLayer 
                         url={currentTheme.url}
                         attribution={currentTheme.attribution}
                    />
                    
                    {/* [중심 이동] 구 중심 또는 선택된 기지로 이동 */}
                    <ChangeView center={selectedGu.coords} target={basePoint} />

                    {bases.map(base => (
                        <CircleMarker
                            key={base.id}
                            center={[base.lat, base.lng]}
                            pathOptions={{
                                color: base.type === '발진' ? '#ff4444' : '#4444ff',
                                fillColor: base.type === '발진' ? '#ff0000' : '#0000ff',
                                fillOpacity: 0.7
                            }}
                            radius={base.type === '발진' ? 10 : 6}
                        >
                            <Popup>
                                <div style={{ textAlign: 'center', color: 'black' }}>
                                    <strong>[{base.type}] {base.agency}</strong><br/>
                                    <span style={{ fontSize: '0.9em', color: '#666' }}>{base.address}</span>
                                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
                                        <button 
                                            onClick={() => handleSelectBase(base)}
                                            style={{
                                                backgroundColor: '#e74c3c', color: 'white', border: 'none', 
                                                borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold'
                                            }}
                                        >
                                            🚩 여기서 작업 시작
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}

                    {displayedPath.length > 0 && (
                        <Polyline 
                            positions={displayedPath} 
                            color="#00ffcc"
                            weight={6} 
                            opacity={0.9} 
                        />
                    )}

                    {currentPos && (
                        <Marker position={currentPos} icon={tractorIcon}>
                            <Popup>현재 작업 위치</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default ProfessionalPage;