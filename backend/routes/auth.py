from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import bcrypt
import re
from database import db
from config import Config
from utils.email_service import generate_otp, send_otp_email

auth_bp = Blueprint('auth', __name__)


def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    return True, None


def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user and send OTP for verification"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'name', 'employee_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        name = data['name'].strip()
        employee_id = data['employee_id'].strip().upper()
        role = data.get('role', 'employee')
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        # Check if user already exists
        existing_user = db.users.find_one({'$or': [{'email': email}, {'employee_id': employee_id}]})
        if existing_user:
            if existing_user.get('email') == email:
                return jsonify({'error': 'Email already registered'}), 400
            else:
                return jsonify({'error': 'Employee ID already registered'}), 400
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(Config.BCRYPT_ROUNDS))
        
        # Generate OTP
        otp = generate_otp()
        otp_expiry = datetime.utcnow() + timedelta(minutes=Config.OTP_EXPIRY_MINUTES)
        
        # Store OTP
        db.otp_verifications.delete_many({'email': email})
        db.otp_verifications.insert_one({
            'email': email,
            'otp': otp,
            'expires_at': otp_expiry,
            'created_at': datetime.utcnow(),
            'user_data': {
                'email': email,
                'password': hashed_password.decode('utf-8'),
                'name': name,
                'employee_id': employee_id,
                'role': role
            }
        })
        
        # Send OTP email
        email_sent = send_otp_email(email, otp)
        
        if email_sent:
            return jsonify({
                'message': 'OTP sent to your email. Please verify to complete registration.',
                'email': email
            }), 200
        else:
            return jsonify({'error': 'Failed to send verification email. Please try again.'}), 500
            
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({'error': 'An error occurred during signup'}), 500


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP and complete user registration"""
    try:
        data = request.get_json()
        email = data.get('email', '').lower().strip()
        otp = data.get('otp', '').strip()
        
        if not email or not otp:
            return jsonify({'error': 'Email and OTP are required'}), 400
        
        # Find OTP record
        otp_record = db.otp_verifications.find_one({
            'email': email,
            'otp': otp,
            'expires_at': {'$gt': datetime.utcnow()}
        })
        
        if not otp_record:
            return jsonify({'error': 'Invalid or expired OTP'}), 400
        
        user_data = otp_record.get('user_data')
        
        # Create user
        user = {
            'email': user_data['email'],
            'password': user_data['password'],
            'name': user_data['name'],
            'employee_id': user_data['employee_id'],
            'role': user_data['role'],
            'is_verified': True,
            'department': '',
            'phone': '',
            'address': '',
            'job_title': '',
            'profile_picture': '',
            'salary': {},
            'documents': [],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        db.users.insert_one(user)
        
        # Delete OTP record
        db.otp_verifications.delete_many({'email': email})
        
        # Generate JWT token
        access_token = create_access_token(
            identity={
                'email': user['email'],
                'employee_id': user['employee_id'],
                'role': user['role'],
                'name': user['name']
            }
        )
        
        return jsonify({
            'message': 'Email verified successfully',
            'token': access_token,
            'user': {
                'email': user['email'],
                'name': user['name'],
                'employee_id': user['employee_id'],
                'role': user['role']
            }
        }), 200
        
    except Exception as e:
        print(f"OTP verification error: {e}")
        return jsonify({'error': 'An error occurred during verification'}), 500


@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    """Resend OTP to user's email"""
    try:
        data = request.get_json()
        email = data.get('email', '').lower().strip()
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Find existing OTP record
        otp_record = db.otp_verifications.find_one({'email': email})
        
        if not otp_record:
            return jsonify({'error': 'No pending verification found for this email'}), 400
        
        # Generate new OTP
        otp = generate_otp()
        otp_expiry = datetime.utcnow() + timedelta(minutes=Config.OTP_EXPIRY_MINUTES)
        
        # Update OTP record
        db.otp_verifications.update_one(
            {'email': email},
            {'$set': {'otp': otp, 'expires_at': otp_expiry}}
        )
        
        # Send OTP email
        email_sent = send_otp_email(email, otp)
        
        if email_sent:
            return jsonify({'message': 'OTP resent successfully'}), 200
        else:
            return jsonify({'error': 'Failed to send verification email'}), 500
            
    except Exception as e:
        print(f"Resend OTP error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = db.users.find_one({'email': email})
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if user is verified
        if not user.get('is_verified'):
            return jsonify({'error': 'Please verify your email first'}), 401
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Generate JWT token
        access_token = create_access_token(
            identity={
                'email': user['email'],
                'employee_id': user['employee_id'],
                'role': user['role'],
                'name': user['name']
            }
        )
        
        return jsonify({
            'message': 'Login successful',
            'token': access_token,
            'user': {
                'email': user['email'],
                'name': user['name'],
                'employee_id': user['employee_id'],
                'role': user['role'],
                'department': user.get('department', ''),
                'job_title': user.get('job_title', ''),
                'profile_picture': user.get('profile_picture', '')
            }
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'An error occurred during login'}), 500


@auth_bp.route('/manager/login', methods=['POST'])
def manager_login():
    """Manager login"""
    try:
        data = request.get_json()
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find manager
        manager = db.managers.find_one({'email': email, 'is_active': True})
        
        if not manager:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), manager['password'].encode('utf-8')):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Generate JWT token
        access_token = create_access_token(
            identity={
                'email': manager['email'],
                'manager_id': manager['manager_id'],
                'role': 'manager',
                'name': manager['name']
            }
        )
        
        return jsonify({
            'message': 'Login successful',
            'token': access_token,
            'user': {
                'email': manager['email'],
                'name': manager['name'],
                'manager_id': manager['manager_id'],
                'role': 'manager'
            }
        }), 200
        
    except Exception as e:
        print(f"Manager login error: {e}")
        return jsonify({'error': 'An error occurred during login'}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') == 'manager':
            manager = db.managers.find_one({'email': identity['email']})
            if manager:
                return jsonify({
                    'email': manager['email'],
                    'name': manager['name'],
                    'manager_id': manager['manager_id'],
                    'role': 'manager'
                }), 200
        else:
            user = db.users.find_one({'email': identity['email']})
            if user:
                return jsonify({
                    'email': user['email'],
                    'name': user['name'],
                    'employee_id': user['employee_id'],
                    'role': user['role'],
                    'department': user.get('department', ''),
                    'job_title': user.get('job_title', ''),
                    'phone': user.get('phone', ''),
                    'address': user.get('address', ''),
                    'profile_picture': user.get('profile_picture', ''),
                    'salary': user.get('salary', {}),
                    'documents': user.get('documents', [])
                }), 200
        
        return jsonify({'error': 'User not found'}), 404
        
    except Exception as e:
        print(f"Get user error: {e}")
        return jsonify({'error': 'An error occurred'}), 500
