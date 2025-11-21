import os
import pickle
import osmnx as ox
import networkx as nx
import numpy as np
from collections import defaultdict, deque
import time

class InferenceSnowEnv:
    def __init__(self, start, g, attr, step_limit=400):
        self.start = start
        self.g = g
        self.attr = attr
        self.edges = list(attr.keys())
        self.idx = {e: i for i, e in enumerate(self.edges)}
        self.step_limit = step_limit
        self.reset()

    def reset(self):
        self.t = 0
        self.cur = self.start
        self.prev = None
        self.unplowed = (1 << len(self.edges)) - 1 
        self.node_tabu = deque(maxlen=10)
        self.edge_tabu = deque(maxlen=20)
        self.node_tabu.append(self.cur)
        return (self.cur, self.unplowed)

    def incident_unplowed(self, node):
        cnt = 0
        for nb in self.g[node]:
            e = frozenset({node, nb})
            if e in self.idx and (self.unplowed & (1 << self.idx[e])):
                cnt += 1
        return cnt

    def step(self, nxt):
        e = frozenset({self.cur, nxt})
        
        if e in self.idx:
            self.unplowed &= ~(1 << self.idx[e]) 
        
        self.prev = self.cur
        self.cur = nxt
        self.node_tabu.append(self.cur)
        self.edge_tabu.append(e)
        self.t += 1
        
        done = (self.unplowed == 0) or (self.t >= self.step_limit)
        return (self.cur, self.unplowed), done

def select_action(env, Q):
    node = env.cur
    actions = list(env.g[node])
    if not actions: return None
    
    cand = [a for a in actions if a not in env.node_tabu]
    if not cand: cand = actions 
    
    best = None
    best_val = -1e18
    
    for a in cand:
        state = (env.cur, env.unplowed)
        q_val = Q.get((state, a), 0.0)
        
        frontier = env.incident_unplowed(a)
        val = q_val + (10.0 * frontier) 
        
        if val > best_val:
            best_val = val
            best = a
            
    return best

def get_ai_route(gu_name, start_lat, start_lng):
    model_file = f"models/q_table_{gu_name}.pkl"
    
    if not os.path.exists(model_file):
        print(f"⚠️ 모델 없음: {model_file}")
        return None

    try:
        with open(model_file, 'rb') as f:
            data = pickle.load(f)
            Q = data['Q']

        print(f"🗺️ 지도 데이터 로딩 중... (R=3.5km, {gu_name})")
        G = ox.graph_from_point((start_lat, start_lng), dist=3500, network_type='drive', simplify=True)
        
        start_node = ox.distance.nearest_nodes(G, start_lng, start_lat)
        
        graph_dict = {n: list(G.neighbors(n)) for n in G.nodes()}
        edge_attr = {}
        for u, v, d in G.edges(data=True):
            edge_attr[frozenset({u, v})] = d 
            
        WORK_STEPS = 400
        env = InferenceSnowEnv(start_node, graph_dict, edge_attr, step_limit=WORK_STEPS)
        
        path_coords = []
        curr = start_node
        
        path_coords.append([G.nodes[curr]['y'], G.nodes[curr]['x']])
        
        print("🚜 [1단계] AI 제설 작업 수행 중...")
        for i in range(WORK_STEPS):
            nxt = select_action(env, Q)
            if nxt is None: break
            
            env.step(nxt)
            curr = nxt
            
            path_coords.append([G.nodes[nxt]['y'], G.nodes[nxt]['x']])
            
            if env.unplowed == 0: break 
            
        if curr != start_node:
            print("🏠 [2단계] 작업 종료 후 기지로 복귀 중...")
            try:
                return_path = nx.shortest_path(G, source=curr, target=start_node, weight='length')
                
                for node in return_path[1:]:
                    path_coords.append([G.nodes[node]['y'], G.nodes[node]['x']])
                    
            except nx.NetworkXNoPath:
                print("⚠️ 복귀 경로를 찾을 수 없습니다.")

        print(f"✅ 최종 경로 생성 완료: 총 {len(path_coords)} 구간")
        return path_coords

    except Exception as e:
        print(f"❌ AI 추론 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return None