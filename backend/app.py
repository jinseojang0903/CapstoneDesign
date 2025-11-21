import os 
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from urllib.parse import quote_plus
from datetime import datetime
from services.route_algo import RouteFinder
from ai_inference import get_ai_route

load_dotenv()

DB_USER = os.getenv("DB_USER", "postgres") 
DB_PASSWORD = os.getenv("DB_PASSWORD") 
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
JWT_KEY = os.getenv("JWT_SECRET_KEY", "secret-key")

app = Flask(__name__)
CORS(app)

SAFE_DB_PASSWORD = quote_plus(DB_PASSWORD) if DB_PASSWORD else "" 
DATABASE_URI = f"postgresql+psycopg2://{DB_USER}:{SAFE_DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = JWT_KEY

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

route_finder = None 

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.BigInteger, primary_key=True) 
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    role = db.Column(db.String(50), nullable=False, default='general') 

    def __init__(self, username, password, email=None, role='general'):
        self.username = username
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')
        self.email = email
        self.role = role

class UserRoute(db.Model):
    __tablename__ = 'user_routes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.user_id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)  # 예: "집", "회사"
    start_name = db.Column(db.String(100), nullable=False)
    start_lat = db.Column(db.Float, nullable=False)
    start_lng = db.Column(db.Float, nullable=False)
    end_name = db.Column(db.String(100), nullable=False)
    end_lat = db.Column(db.Float, nullable=False)
    end_lng = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'start': self.start_name,
            'end': self.end_name,
            'start_coords': {'lat': self.start_lat, 'lng': self.start_lng},
            'end_coords': {'lat': self.end_lat, 'lng': self.end_lng},
            'created_at': self.created_at.strftime('%Y-%m-%d')
        }

class SearchHistory(db.Model):
    __tablename__ = 'search_history'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.user_id'), nullable=False)
    start_name = db.Column(db.String(100), nullable=False)
    end_name = db.Column(db.String(100), nullable=False)
    start_lat = db.Column(db.Float, nullable=True)
    start_lng = db.Column(db.Float, nullable=True)
    end_lat = db.Column(db.Float, nullable=True)
    end_lng = db.Column(db.Float, nullable=True)
    score = db.Column(db.Integer, nullable=True, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def serialize(self):
        return {
            'id': self.id,
            'date': self.created_at.strftime('%Y.%m.%d'),
            'start': self.start_name,
            'end': self.end_name,
            'start_coords': {'lat': self.start_lat, 'lng': self.start_lng},
            'end_coords': {'lat': self.end_lat, 'lng': self.end_lng},
            'score': self.score
        }

class SnowBase(db.Model):
    __tablename__ = 'snow_bases'
    id = db.Column(db.Integer, primary_key=True)
    base_id = db.Column(db.String(50), nullable=True)
    agency = db.Column(db.String(50))
    type = db.Column(db.String(20))
    address = db.Column(db.Text)
    lat = db.Column(db.Numeric(10, 7))
    lng = db.Column(db.Numeric(10, 7))

    def serialize(self):
        return {
            'id': self.id,
            'agency': self.agency,
            'type': self.type,
            'address': self.address,
            'lat': float(self.lat),
            'lng': float(self.lng)
        }

@app.route("/api/register", methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    role = data.get('role', 'general') 

    if role not in ['general', 'expert']:
        return jsonify({"error": "유효하지 않은 역할(role)입니다."}), 400

    if not username or not password:
        return jsonify({"error": "사용자 이름과 비밀번호는 필수입니다."}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "이미 존재하는 사용자입니다."}), 409

    if email and User.query.filter_by(email=email).first():
        return jsonify({"error": "이미 사용 중인 이메일입니다."}), 409

    new_user = User(username=username, password=password, email=email, role=role)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": f"{username}님(등급: {role}), 회원가입 성공!"}), 201

@app.route("/api/login", methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "사용자 이름과 비밀번호를 입력해주세요."}), 400

    user = User.query.filter_by(username=username).first()

    if user and bcrypt.check_password_hash(user.password, password):
        access_token = create_access_token(
            identity=user.username,
            additional_claims={
                'role': user.role, 
                'name': user.username
            }
        )
        return jsonify(access_token=access_token), 200
    else:
        return jsonify({"error": "아이디 또는 비밀번호가 잘못되었습니다."}), 401

@app.route("/api/profile", methods=['GET'])
@jwt_required()
def get_profile():
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()

    if user:
        return jsonify({
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }), 200
    else:
        return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

@app.route("/api/profile", methods=['PATCH'])
@jwt_required()
def update_profile():
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()

    if not user:
        return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

    data = request.get_json()
    new_email = data.get('email')
    new_role = data.get('role')

    if new_email is not None and new_email != user.email:
        email_exists = User.query.filter(
            User.email == new_email,
            User.user_id != user.user_id
        ).first()
        if email_exists:
            return jsonify({"error": "이미 사용 중인 이메일입니다."}), 409
        user.email = new_email

    if new_role is not None and new_role != user.role:
        if new_role not in ['general', 'expert']:
            return jsonify({"error": "유효하지 않은 역할(role)입니다."}), 400
        user.role = new_role

    try:
        db.session.commit()
        return jsonify({"message": "프로필 정보가 성공적으로 업데이트되었습니다."}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "프로필 정보 업데이트 중 오류가 발생했습니다."}), 500

@app.route("/api/password/change", methods=['PATCH'])
@jwt_required()
def change_password():
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()

    if not user:
        return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    if not old_password or not new_password:
        return jsonify({"error": "기존 비밀번호와 새 비밀번호를 모두 입력해주세요."}), 400

    if not bcrypt.check_password_hash(user.password, old_password):
        return jsonify({"error": "기존 비밀번호가 일치하지 않습니다."}), 401

    try:
        user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        db.session.commit()
        return jsonify({"message": "비밀번호가 성공적으로 변경되었습니다."}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "비밀번호 변경 중 오류가 발생했습니다."}), 500

@app.route("/api/delete", methods=['DELETE'])
@jwt_required()
def delete_account():
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()

    if not user:
        return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

    data = request.get_json()
    confirm_password = data.get('password')

    if not confirm_password:
        return jsonify({"error": "계정 삭제를 위해 비밀번호를 입력해주세요."}), 400

    if not bcrypt.check_password_hash(user.password, confirm_password):
        return jsonify({"error": "비밀번호가 일치하지 않아 계정을 삭제할 수 없습니다."}), 401

    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "계정이 성공적으로 삭제(탈퇴)되었습니다."}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "계정 삭제 중 오류가 발생했습니다."}), 500

@app.route("/api/routes", methods=['GET'])
@jwt_required()
def get_my_routes():
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    routes = UserRoute.query.filter_by(user_id=user.user_id).order_by(UserRoute.created_at.desc()).all()
    return jsonify([r.serialize() for r in routes]), 200

@app.route("/api/routes", methods=['POST'])
@jwt_required()
def add_my_route():
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    new_route = UserRoute(
        user_id=user.user_id,
        name=data.get('name', '새로운 경로'),
        start_name=data['start_name'],
        start_lat=data['start_lat'],
        start_lng=data['start_lng'],
        end_name=data['end_name'],
        end_lat=data['end_lat'],
        end_lng=data['end_lng']
    )
    
    db.session.add(new_route)
    db.session.commit()
    
    return jsonify({"message": "경로가 저장되었습니다.", "route": new_route.serialize()}), 201

@app.route("/api/routes/<int:route_id>", methods=['DELETE'])
@jwt_required()
def delete_my_route(route_id):
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()
    
    route = UserRoute.query.filter_by(id=route_id, user_id=user.user_id).first()
    if not route:
        return jsonify({"error": "Route not found"}), 404
        
    db.session.delete(route)
    db.session.commit()
    return jsonify({"message": "경로가 삭제되었습니다."}), 200

@app.route("/api/history", methods=['GET'])
@jwt_required()
def get_history():
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    history = SearchHistory.query.filter_by(user_id=user.user_id)\
        .order_by(SearchHistory.created_at.desc()).limit(10).all()
    
    return jsonify([h.serialize() for h in history]), 200

@app.route("/api/history", methods=['POST'])
@jwt_required()
def add_history():
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()
    
    data = request.get_json()
    
    new_history = SearchHistory(
        user_id=user.user_id,
        start_name=data['start_name'],
        end_name=data['end_name'],
        start_lat=data.get('start_lat'),
        start_lng=data.get('start_lng'),
        end_lat=data.get('end_lat'),
        end_lng=data.get('end_lng'),
        score=data.get('score', 0)
    )
    
    db.session.add(new_history)
    db.session.commit()
    return jsonify({"message": "History saved"}), 201

@app.route("/api/bases", methods=['GET'])
def get_all_bases():
    try:
        bases = SnowBase.query.all()
        return jsonify([b.serialize() for b in bases]), 200
    except Exception as e:
        return jsonify({"error": f"데이터 로드 실패: {str(e)}"}), 500

@app.route("/api/bases/search", methods=['GET'])
def search_bases():
    query = request.args.get('q', '')
    if not query:
        return jsonify([]), 200

    search_term = f"%{query}%"
    try:
        bases = SnowBase.query.filter(
            (SnowBase.agency.ilike(search_term)) | 
            (SnowBase.address.ilike(search_term))
        ).all()
        return jsonify([b.serialize() for b in bases]), 200
    except Exception as e:
        return jsonify({"error": f"검색 중 오류 발생: {str(e)}"}), 500

@app.route("/api/find_safe_route", methods=['POST'])
def find_safe_route():
    global route_finder
    if route_finder is None:
        return jsonify({'success': False, 'error': '지도 데이터가 로딩되지 않았습니다.'}), 503

    data = request.get_json()
    try:
        start = data.get('start')
        end = data.get('end')
        mode = data.get('mode', 'fast') 

        print(f"🔍 [DEBUG] 요청된 모드: {mode}")
        print(f"📍 출발: {start}, 도착: {end}")

        if not start or not end:
            return jsonify({'success': False, 'error': '출발지와 도착지 좌표가 필요합니다.'}), 400

        result = route_finder.find_path(
            float(start['lat']), float(start['lng']),
            float(end['lat']), float(end['lng']),
            mode=mode
        )

        if result:
            return jsonify({'success': True, **result})
        else:
            return jsonify({'success': False, 'message': '경로를 찾을 수 없습니다.'}), 404

    except Exception as e:
        print(f"경로 분석 에러: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/professional/recommend', methods=['POST'])
@jwt_required()
def recommend_ai_route():
    """
    학습된 AI(Q-Learning) 모델을 사용하여 최적 제설 경로를 추천합니다.
    Request Body: { "gu_name": "gangnam", "base_coords": { "lat": ..., "lng": ... } }
    """
    data = request.get_json()
    gu_name = data.get('gu_name')
    base_coords = data.get('base_coords')
    
    if not gu_name or not base_coords:
        return jsonify({"error": "구(gu_name) 또는 출발지(base_coords) 정보가 누락되었습니다."}), 400

    print(f"🤖 AI 경로 추론 요청: {gu_name}구, 출발: {base_coords}")

    try:
        path = get_ai_route(gu_name, float(base_coords['lat']), float(base_coords['lng']))
        
        if path:
            return jsonify({"path": path}), 200
        else:
            return jsonify({"error": "경로를 생성할 수 없습니다. (모델 없음 또는 지도 오류)"}), 500
    except Exception as e:
        print(f"❌ AI 추론 에러: {e}")
        return jsonify({"error": f"서버 에러: {str(e)}"}), 500

@app.route("/api/protected", methods=['GET'])
@jwt_required()
def protected():
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()
    if user:
         return jsonify(logged_in_as=user.username, user_role=user.role), 200
    else:
         return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

if __name__ == '__main__':
    if not DB_PASSWORD:
        print(" FATAL ERROR: DB_PASSWORD 환경 변수가 로드되지 않았습니다.")
        exit(1)
        
    with app.app_context():
        db.create_all()
    
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
         route_finder = RouteFinder(csv_path='final_freezing_score.csv')
    else:
         route_finder = RouteFinder(csv_path='final_freezing_score.csv')

    app.run(port=5000, debug=True)