import os 
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from urllib.parse import quote_plus

# 환경 변수 로드 및 설정
load_dotenv()

DB_USER = os.getenv("DB_USER", "postgres") 
DB_PASSWORD = os.getenv("DB_PASSWORD") 
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
JWT_KEY = os.getenv("JWT_SECRET_KEY")

# Flask 앱 초기화
app = Flask(__name__)
CORS(app)

# DB 설정
SAFE_DB_PASSWORD = quote_plus(DB_PASSWORD) if DB_PASSWORD else "" 
DATABASE_URI = f"postgresql+psycopg2://{DB_USER}:{SAFE_DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = JWT_KEY


# 전역 객체 초기화
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# User 모델
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

# --- 인증 기능 (Auth) ---

# 회원가입 기능: /api/register (Create)
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

# 로그인 및 JWT 발급: /api/login
@app.route("/api/login", methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "사용자 이름과 비밀번호를 입력해주세요."}), 400

    user = User.query.filter_by(username=username).first()

    if user and bcrypt.check_password_hash(user.password, password):
        # user.username이 문자열임을 명시적으로 확인하여 'Subject must be a string' 오류를 방지
        token_identity = str(user.username) 
        
        access_token = create_access_token(
            identity=user.username,
            additional_claims={
                'role': user.role, 
                'name': user.username}
        )
        return jsonify(access_token=access_token), 200
    else:
        return jsonify({"error": "아이디 또는 비밀번호가 잘못되었습니다."}), 401

# --- 사용자 관리 기능 (User Management) ---

# 사용자 프로필 조회: /api/profile (Read)
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

# 사용자 프로필 수정: /api/profile (Update - 이메일, 역할)
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

    # 이메일 수정 처리 (본인 제외 중복 확인)
    if new_email is not None and new_email != user.email:
        email_exists = User.query.filter(
            User.email == new_email,
            User.user_id != user.user_id
        ).first()

        if email_exists:
            return jsonify({"error": "이미 사용 중인 이메일입니다."}), 409
        
        user.email = new_email

    # 역할(Role) 수정 처리
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

# 비밀번호 변경 기능: /api/password/change (Update - 비밀번호)
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

    # 기존 비밀번호 확인
    if not bcrypt.check_password_hash(user.password, old_password):
        return jsonify({"error": "기존 비밀번호가 일치하지 않습니다."}), 401

    # 새 비밀번호 해시 및 저장
    try:
        user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        db.session.commit()
        return jsonify({"message": "비밀번호가 성공적으로 변경되었습니다."}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "비밀번호 변경 중 오류가 발생했습니다."}), 500

# 계정 탈퇴/삭제 기능: /api/delete (Delete)
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

    # 비밀번호 확인
    if not bcrypt.check_password_hash(user.password, confirm_password):
        return jsonify({"error": "비밀번호가 일치하지 않아 계정을 삭제할 수 없습니다."}), 401

    # 사용자 삭제
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "계정이 성공적으로 삭제(탈퇴)되었습니다. 이용해 주셔서 감사합니다."}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "계정 삭제 중 오류가 발생했습니다."}), 500

# --- 기타/더미 기능 ---

# 경로 분석 (더미 기능)
@app.route("/api/analyze-route", methods=['POST'])
@jwt_required()
def analyze_route():
    return jsonify({"score": 78, "status": "CAUTION", "critical_zones": []})

# JWT 인증 테스트
@app.route("/api/protected", methods=['GET'])
@jwt_required()
def protected():
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()

    if user:
         return jsonify(logged_in_as=user.username, user_role=user.role), 200
    else:
         return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

# --- 애플리케이션 실행 ---

if __name__ == '__main__':
    if not DB_PASSWORD:
        print(" FATAL ERROR: DB_PASSWORD 환경 변수가 로드되지 않았습니다.")
        exit(1)
        
    with app.app_context():
        db.create_all()
    app.run(port=5000, debug=True)