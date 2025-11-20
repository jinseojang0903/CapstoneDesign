import os 
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from urllib.parse import quote_plus

# [중요] 분리한 서비스 로직 임포트
from services.route_algo import RouteFinder

# 환경 변수 로드
load_dotenv()

DB_USER = os.getenv("DB_USER", "postgres") 
DB_PASSWORD = os.getenv("DB_PASSWORD") 
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
JWT_KEY = os.getenv("JWT_SECRET_KEY", "secret-key") # 기본값 설정

# Flask 앱 초기화
app = Flask(__name__)
CORS(app)

# DB 설정 (특수문자 비밀번호 처리)
SAFE_DB_PASSWORD = quote_plus(DB_PASSWORD) if DB_PASSWORD else "" 
DATABASE_URI = f"postgresql+psycopg2://{DB_USER}:{SAFE_DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = JWT_KEY

# 전역 객체 초기화
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# ===============================================
# [전역] RouteFinder 초기화 (서버 시작 시 1회 로딩)
# ===============================================
route_finder = None 

# --- 모델 정의 (User) ---
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

# --- 모델 정의 (SnowBase - 제설 전진기지) ---
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

# --- Auth API (Register, Login, Profile, Delete) ---

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
        # 토큰 생성
        token_identity = str(user.username) 
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

# --- SnowBase (지도 마커) API ---

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


# ===============================================
# [핵심] 안전 경로 분석 API (Route Search)
# ===============================================
@app.route("/api/find_safe_route", methods=['POST'])
def find_safe_route():
    global route_finder
    
    # 초기화 실패 시 예외 처리
    if route_finder is None:
        return jsonify({'success': False, 'error': '지도 데이터가 로딩되지 않았습니다.'}), 503

    data = request.get_json()
    try:
        # 프론트엔드에서 받은 데이터: { start: {lat, lng}, end: {lat, lng} }
        start = data.get('start')
        end = data.get('end')

        if not start or not end:
            return jsonify({'success': False, 'error': '출발지와 도착지 좌표가 필요합니다.'}), 400

        # 알고리즘 수행 (route_algo.py의 find_path 호출)
        # 여기서 반환되는 result에는 'path', 'stats', 'danger_segments'가 모두 포함됨
        result = route_finder.find_path(
            float(start['lat']), float(start['lng']),
            float(end['lat']), float(end['lng'])
        )

        if result:
            return jsonify({'success': True, **result})
        else:
            return jsonify({'success': False, 'message': '경로를 찾을 수 없습니다.'}), 404

    except Exception as e:
        print(f"경로 분석 에러: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# --- 기타 기능 ---
@app.route("/api/protected", methods=['GET'])
@jwt_required()
def protected():
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()
    if user:
         return jsonify(logged_in_as=user.username, user_role=user.role), 200
    else:
         return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

# --- 서버 실행 ---
if __name__ == '__main__':
    if not DB_PASSWORD:
        print(" FATAL ERROR: DB_PASSWORD 환경 변수가 로드되지 않았습니다.")
        exit(1)
        
    with app.app_context():
        db.create_all()
    
    # RouteFinder 초기화 (csv_path 명시)
    # 개발 모드에서 reloader로 인해 2번 로딩되는 것 방지 로직 포함
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
         route_finder = RouteFinder(csv_path='final_freezing_score.csv')
    else:
         # 일반 실행 시
         route_finder = RouteFinder(csv_path='final_freezing_score.csv')

    app.run(port=5000, debug=True)