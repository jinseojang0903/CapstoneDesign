import os 
from dotenv import load_dotenv # .env 파일 로드
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from urllib.parse import quote_plus

# --- (수정된 부분) 환경 변수 로드 및 설정 ---
load_dotenv() # .env 파일을 현재 환경에 로드

DB_USER = os.getenv("DB_USER", "postgres") 
DB_PASSWORD = os.getenv("DB_PASSWORD") 
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")

JWT_KEY = os.getenv("JWT_SECRET_KEY")

app = Flask(__name__)
CORS(app)


# 비밀번호에 포함될 수 있는 특수문자를 URL 인코딩 (DB 접속 시 필수)
SAFE_DB_PASSWORD = quote_plus(DB_PASSWORD) if DB_PASSWORD else "" 
# DB 드라이버는 psycopg2를 사용합니다.
DATABASE_URI = f"postgresql+psycopg2://{DB_USER}:{SAFE_DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = JWT_KEY


db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

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

@app.route("/api/analyze-route", methods=['POST'])
@jwt_required()
def analyze_route():
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()
    print(f"요청 사용자: {user.username} (ID: {user.user_id}, Role: {user.role})") 

    data = request.get_json()
    print(f"프론트엔드로부터 받은 데이터: {data}")

    dummy_response = {
        "score": 78,
        "status": "CAUTION",
        "critical_zones": [
            {"lat": 37.5665, "lng": 126.9780, "risk": "High"},
            {"lat": 37.5650, "lng": 126.9790, "risk": "Medium"}
        ]
    }
    return jsonify(dummy_response)

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

    user_exists = User.query.filter_by(username=username).first()
    if user_exists:
        return jsonify({"error": "이미 존재하는 사용자입니다."}), 409

    if email:
        email_exists = User.query.filter_by(email=email).first()
        if email_exists:
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
                'sub': user.user_id,
                'name': user.username}
        )
        return jsonify(access_token=access_token), 200
    else:
        return jsonify({"error": "아이디 또는 비밀번호가 잘못되었습니다."}), 401


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
    # DB_PASSWORD가 로드되었는지 최종 확인
    if not DB_PASSWORD:
        print("\n=======================================================")
        print(" FATAL ERROR: DB_PASSWORD 환경 변수가 로드되지 않았습니다.")
        print(" .env 파일이 app.py와 같은 위치에 있는지,")
        print(" 그리고 DB_PASSWORD 값이 정확히 입력되었는지 확인하세요.")
        print("=======================================================\n")
        exit(1)
        
    with app.app_context():
        db.create_all()
    app.run(port=5000, debug=True)