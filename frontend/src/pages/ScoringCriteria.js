import React from 'react';
import './ScoringCriteria.css';

const ScoringCriteria = () => {
  return (
    <div className="criteria-container">
      <div className="criteria-header">
        <h2>🛡️ 안전 점수 산정 기준</h2>
        <p>SnowRoute는 5가지 핵심 데이터를 분석하여 도로의 결빙 위험도를 산출합니다.</p>
      </div>

      {/* 분석 요소 */}
      <div className="factors-grid">
        <div className="factor-card">
          <div className="icon">🏔️</div>
          <h3>경사 위험도</h3>
          <p>도로의 경사각(Slope)을 분석합니다. 급경사일수록 결빙 시 제동 거리가 길어져 위험도가 급격히 상승합니다.</p>
        </div>

        <div className="factor-card">
          <div className="icon">❄️</div>
          <h3>결빙 취약성</h3>
          <p>응달 지역, 강/하천 주변, 습도 데이터를 종합하여 블랙아이스가 형성되기 쉬운 환경인지 분석합니다.</p>
        </div>

        <div className="factor-card">
          <div className="icon">💥</div>
          <h3>사고 이력</h3>
          <p>과거 해당 도로에서 발생한 동절기 교통사고 데이터를 기반으로 잠재적 위험 구간을 식별합니다.</p>
        </div>

        <div className="factor-card">
          <div className="icon">👥</div>
          <h3>인구 밀집도</h3>
          <p>유동 인구와 교통량이 많은 지역은 사고 발생 시 피해 규모가 크므로 가중치를 부여합니다.</p>
        </div>

        <div className="factor-card">
          <div className="icon">🛣️</div>
          <h3>도로 기본 상태</h3>
          <p>도로의 포장 재질, 노후도 등 도로 자체의 물리적 특성을 고려한 기본 점수입니다.</p>
        </div>
      </div>

      {/* 등급 설명 */}
      <div className="legend-section">
        <h3>🚦 위험 등급 안내</h3>
        <div className="legend-item danger">
          <span className="badge">Danger (80~100점)</span>
          <span className="desc">결빙 확률이 매우 높습니다. <strong>반드시 우회</strong>하거나 절대 서행하십시오.</span>
        </div>
        <div className="legend-item warning">
          <span className="badge">Warning (60~79점)</span>
          <span className="desc">결빙 주의 구간입니다. 급제동/급가속을 피하고 주의 운전이 필요합니다.</span>
        </div>
        <div className="legend-item safe">
          <span className="badge">Safe (0~59점)</span>
          <span className="desc">비교적 안전한 도로입니다. (기상 악화 시에는 주의 필요)</span>
        </div>
      </div>
    </div>
  );
};

export default ScoringCriteria;