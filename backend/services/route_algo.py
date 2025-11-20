import osmnx as ox
import networkx as nx
import pandas as pd
import os

class RouteFinder:
    def __init__(self, csv_path='final_freezing_score.csv', region="Seoul, South Korea"):
        print(f"🗺️ [RouteFinder] '{region}' 지도 데이터와 상세 위험 점수 로딩 중...")
        
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        full_csv_path = os.path.join(base_dir, csv_path)
        
        if os.path.exists(full_csv_path):
            self.score_df = pd.read_csv(full_csv_path)
            self.score_df = self.score_df.sort_values('final_risk_score', ascending=False).drop_duplicates(['road_id'])
            self.risk_map = self.score_df.set_index('road_id')[
                ['final_risk_score', 'norm_slope_score', 'norm_freezing_weak_score', 'norm_accident_score', 'norm_population_risk', 'original_raw_score']
            ].to_dict('index')
            
            print(f"   - 결빙 데이터 {len(self.risk_map)}개 로드 완료")
        else:
            print(f"⚠️ [경고] '{csv_path}' 파일을 찾을 수 없습니다.")
            self.risk_map = {}

        try:
            self.G = ox.graph_from_place(region, network_type="drive")
            print(f"   - 도로망 그래프 로드 완료 (노드 {len(self.G.nodes)}개)")
            self._map_scores_to_graph()
        except Exception as e:
            print(f"❌ [오류] 지도 로딩 실패: {e}")
            self.G = None
        
        print("✅ [RouteFinder] 준비 완료!")

    def _map_scores_to_graph(self):
        """그래프 엣지에 모든 점수 매핑"""
        for u, v, k, data in self.G.edges(keys=True, data=True):
            osm_ids = data.get('osmid', [])
            scores = {
                'risk': 0.0, 'slope': 0.0, 'freeze': 0.0, 'accident': 0.0, 
                'population': 0.0, 'raw': 0.0 
            }
            
            target_ids = []
            if isinstance(osm_ids, list):
                target_ids = [int(i) for i in osm_ids if isinstance(i, (int, str)) and int(i) in self.risk_map]
            elif isinstance(osm_ids, (int, str)) and int(osm_ids) in self.risk_map:
                target_ids = [int(osm_ids)]

            if target_ids:
                scores['risk'] = max([self.risk_map[i]['final_risk_score'] for i in target_ids])
                scores['slope'] = max([self.risk_map[i]['norm_slope_score'] for i in target_ids])
                scores['freeze'] = max([self.risk_map[i]['norm_freezing_weak_score'] for i in target_ids])
                scores['accident'] = max([self.risk_map[i]['norm_accident_score'] for i in target_ids])
                scores['population'] = max([self.risk_map[i]['norm_population_risk'] for i in target_ids])
                scores['raw'] = max([self.risk_map[i]['original_raw_score'] for i in target_ids])

            data['risk_score'] = float(scores['risk'])
            data['slope_score'] = float(scores['slope'])
            data['freeze_score'] = float(scores['freeze'])
            data['accident_score'] = float(scores['accident'])
            data['population_score'] = float(scores['population'])
            data['raw_score'] = float(scores['raw'])

    def _get_dist(self, node_id, target_lat, target_lng):
        node = self.G.nodes[node_id]
        return (node['y'] - target_lat)**2 + (node['x'] - target_lng)**2

    def find_path(self, start_lat, start_lng, end_lat, end_lng, mode='fast'):
        if not self.G: raise Exception("지도 데이터가 로드되지 않았습니다.")

        def weight_function(u, v, d):
            length = d.get('length', 10)
            risk = d.get('risk_score', 0)
            if mode == 'safe':
                if risk >= 80: return length * 1000 
                if risk >= 60: return length * 100
            return length

        try:
            u, v, key = ox.distance.nearest_edges(self.G, start_lng, start_lat)
            orig_node = u if self._get_dist(u, start_lat, start_lng) < self._get_dist(v, start_lat, start_lng) else v
            u, v, key = ox.distance.nearest_edges(self.G, end_lng, end_lat)
            dest_node = u if self._get_dist(u, end_lat, end_lng) < self._get_dist(v, end_lat, end_lng) else v
        except Exception:
            orig_node = ox.distance.nearest_nodes(self.G, start_lng, start_lat)
            dest_node = ox.distance.nearest_nodes(self.G, end_lng, end_lat)

        try:
            route_nodes = nx.shortest_path(self.G, orig_node, dest_node, weight=weight_function)
        except nx.NetworkXNoPath:
            return None

        path_coords = []
        metrics = {
            'risk': [], 'slope': [], 'freeze': [], 'accident': [], 
            'population': [], 'raw': []
        }
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

            r_score = edge_data.get('risk_score', 0)
            metrics['risk'].append(r_score)
            metrics['slope'].append(edge_data.get('slope_score', 0))
            metrics['freeze'].append(edge_data.get('freeze_score', 0))
            metrics['accident'].append(edge_data.get('accident_score', 0))
            # ▼▼▼ [추가] ▼▼▼
            metrics['population'].append(edge_data.get('population_score', 0))
            metrics['raw'].append(edge_data.get('raw_score', 0))

            if r_score >= 60:
                raw_name = edge_data.get('name', '도로명 정보 없음')
                road_name = raw_name[0] if isinstance(raw_name, list) else str(raw_name)
                danger_segments.append({
                    'lat': self.G.nodes[u]['y'], 
                    'lng': self.G.nodes[u]['x'], 
                    'score': r_score,
                    'road_name': road_name
                })

        path_coords.append([self.G.nodes[dest_node]['y'], self.G.nodes[dest_node]['x']])

        if not metrics['risk']:
            stats = {'average': 0, 'max': 0, 'risk_level': 'Safe', 'danger_count': 0, 'env_details': {}}
        else:
            max_score = max(metrics['risk'])
            risk_level = 'Danger' if max_score >= 80 else ('Warning' if max_score >= 60 else 'Safe')

            stats = {
                'average': round(sum(metrics['risk']) / len(metrics['risk']), 1),
                'max': round(max_score, 1),
                'risk_level': risk_level,
                'danger_count': len(danger_segments),
                'env_details': {
                    'avg_slope': round(sum(metrics['slope']) / len(metrics['slope']), 1),
                    'max_slope': round(max(metrics['slope']), 1),
                    'avg_freeze': round(sum(metrics['freeze']) / len(metrics['freeze']), 1),
                    'avg_accident': round(sum(metrics['accident']) / len(metrics['accident']), 1),
                    'avg_population': round(sum(metrics['population']) / len(metrics['population']), 1),
                    'avg_raw': round(sum(metrics['raw']) / len(metrics['raw']), 1),
                }
            }

        return {
            'path': path_coords,
            'stats': stats,
            'danger_segments': danger_segments
        }