import osmnx as ox
import networkx as nx
import pandas as pd
import os

class RouteFinder:
    def __init__(self, csv_path='final_freezing_score.csv', region="Seoul, South Korea"):
        print(f"🗺️ [RouteFinder] '{region}' 지도 데이터와 위험 점수 로딩 중... (시간이 좀 걸립니다)")
        
        # 1. 파일 경로 설정 (절대 경로로 변환하여 에러 방지)
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        full_csv_path = os.path.join(base_dir, csv_path)
        
        # 2. 결빙 점수 로드
        if os.path.exists(full_csv_path):
            self.score_df = pd.read_csv(full_csv_path)
            self.risk_map = self.score_df.set_index('road_id')['final_risk_score'].to_dict()
            print(f"   - 결빙 점수 데이터 {len(self.risk_map)}개 로드 완료")
        else:
            print(f"⚠️ [경고] '{csv_path}' 파일을 찾을 수 없습니다.")
            self.risk_map = {}

        # 3. 도로망 그래프 로드
        try:
            self.G = ox.graph_from_place(region, network_type="drive")
            print(f"   - 도로망 그래프 로드 완료 (노드 {len(self.G.nodes)}개)")
            self._map_scores_to_graph()
        except Exception as e:
            print(f"❌ [오류] 지도 로딩 실패: {e}")
            self.G = None
        
        print("✅ [RouteFinder] 준비 완료!")

    def _map_scores_to_graph(self):
        """그래프 엣지에 결빙 점수 및 도로명 매핑"""
        for u, v, k, data in self.G.edges(keys=True, data=True):
            osm_ids = data.get('osmid', [])
            edge_risk = 0.0
            if isinstance(osm_ids, list):
                scores = [self.risk_map.get(int(i), 0) for i in osm_ids if isinstance(i, (int, str)) and int(i) in self.risk_map]
                edge_risk = max(scores) if scores else 0.0
            else:
                try:
                    edge_risk = self.risk_map.get(int(osm_ids), 0.0)
                except:
                    edge_risk = 0.0
            data['risk_score'] = float(edge_risk)

    def _get_dist(self, node_id, target_lat, target_lng):
        """거리 계산 헬퍼"""
        node = self.G.nodes[node_id]
        return (node['y'] - target_lat)**2 + (node['x'] - target_lng)**2

    def find_path(self, start_lat, start_lng, end_lat, end_lng):
        if not self.G: raise Exception("지도 데이터가 로드되지 않았습니다.")

        try:
            # [핵심 개선] 가장 가까운 '도로(Edge)'를 먼저 찾습니다.
            # 출발지 스내핑
            u, v, key = ox.distance.nearest_edges(self.G, start_lng, start_lat)
            orig_node = u if self._get_dist(u, start_lat, start_lng) < self._get_dist(v, start_lat, start_lng) else v

            # 도착지 스내핑
            u, v, key = ox.distance.nearest_edges(self.G, end_lng, end_lat)
            dest_node = u if self._get_dist(u, end_lat, end_lng) < self._get_dist(v, end_lat, end_lng) else v
            
        except Exception:
            # 실패 시 기존 방식(Node)으로 폴백
            orig_node = ox.distance.nearest_nodes(self.G, start_lng, start_lat)
            dest_node = ox.distance.nearest_nodes(self.G, end_lng, end_lat)

        # 최단 경로 계산
        try:
            route_nodes = nx.shortest_path(self.G, orig_node, dest_node, weight='length')
        except nx.NetworkXNoPath:
            return None

        # 경로 상세 분석
        path_coords = []
        scores = []
        danger_segments = []

        for i in range(len(route_nodes) - 1):
            u = route_nodes[i]
            v = route_nodes[i+1]
            edge_data = self.G.get_edge_data(u, v)[0]

            if 'geometry' in edge_data:
                coords = list(edge_data['geometry'].coords)
                path_coords.extend([[y, x] for x, y in coords])
            else:
                path_coords.append([self.G.nodes[u]['y'], self.G.nodes[u]['x']])

            score = edge_data.get('risk_score', 0)
            scores.append(score)

            if score >= 60:
                # [추가] 도로명 추출
                raw_name = edge_data.get('name', '도로명 정보 없음')
                if isinstance(raw_name, list):
                    road_name = raw_name[0]
                else:
                    road_name = str(raw_name)

                danger_segments.append({
                    'lat': self.G.nodes[u]['y'], 
                    'lng': self.G.nodes[u]['x'], 
                    'score': score,
                    'road_name': road_name
                })

        path_coords.append([self.G.nodes[dest_node]['y'], self.G.nodes[dest_node]['x']])

        # 통계 산출
        if not scores:
            stats = {'average': 0, 'max': 0, 'min': 0, 'risk_level': 'Safe'}
        else:
            max_score = max(scores)
            risk_level = 'Safe'
            if max_score >= 80: risk_level = 'Danger'
            elif max_score >= 60: risk_level = 'Warning'

            stats = {
                'average': round(sum(scores) / len(scores), 1),
                'max': round(max_score, 1),
                'min': round(min(scores), 1),
                'risk_level': risk_level,
                'danger_count': len(danger_segments)
            }

        return {
            'path': path_coords,
            'stats': stats,
            'danger_segments': danger_segments
        }