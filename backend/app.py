from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
from config import Config
from database import db

# Import routes
from routes.auth import auth_bp
from routes.employee import employee_bp
from routes.attendance import attendance_bp
from routes.timesheet import timesheet_bp
from routes.leave import leave_bp
from routes.admin import admin_bp
from routes.documents import documents_bp
from routes.payroll import payroll_bp


def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['JWT_SECRET_KEY'] = Config.JWT_SECRET_KEY
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(seconds=Config.JWT_ACCESS_TOKEN_EXPIRES)
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
    
    # Initialize extensions
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    jwt = JWTManager(app)
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired', 'code': 'token_expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token', 'code': 'invalid_token'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization token required', 'code': 'missing_token'}), 401
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(employee_bp, url_prefix='/api/employee')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(timesheet_bp, url_prefix='/api/timesheet')
    app.register_blueprint(leave_bp, url_prefix='/api/leave')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(documents_bp, url_prefix='/api/documents')
    app.register_blueprint(payroll_bp, url_prefix='/api/payroll')
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'database': 'connected' if db is not None else 'disconnected'
        }), 200
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'name': 'Dayflow HRMS API',
            'version': '1.0.0',
            'status': 'running'
        }), 200
    
    return app


if __name__ == '__main__':
    app = create_app()
    print("Starting Dayflow HRMS Backend Server...")
    print("API Documentation:")
    print("  - Auth: /api/auth (signup, login, verify-otp, manager/login)")
    print("  - Employee: /api/employee (profile, documents, salary)")
    print("  - Attendance: /api/attendance (check-in, check-out, weekly, history)")
    print("  - Timesheet: /api/timesheet (submit, status, history, manager/*)")
    print("  - Leave: /api/leave (apply, my-leaves, admin/*)")
    print("  - Admin: /api/admin (employees, attendance, dashboard)")
    app.run(debug=True, host='0.0.0.0', port=5000)
