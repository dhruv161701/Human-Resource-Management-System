import os
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

class Config:
    # MongoDB Configuration
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    DATABASE_NAME = 'hrms-database'
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'hrms-super-secret-key-2024')
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours in seconds
    
    # SMTP Configuration
    SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    EMAIL_ADDRESS = os.getenv('EMAIL_ADDRESS')
    EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')
    
    # Google Cloud Storage Configuration
    GCS_PROJECT_ID = os.getenv('x-goog-project-id')
    GCS_SERVICE_ACCOUNT = os.getenv('google_cloud_storage_account')
    GCS_BUCKET_NAME = 'hrms-documents-bucket'
    
    # Security
    BCRYPT_ROUNDS = 12
    OTP_EXPIRY_MINUTES = 10
    
    # Managers list
    MANAGERS = [
        {'id': 'MGR001', 'name': 'Amit Singh', 'email': 'amit.singh@company.com'},
        {'id': 'MGR002', 'name': 'Suresh Chauhan', 'email': 'suresh.chauhan@company.com'},
        {'id': 'MGR003', 'name': 'Rekha Agarwal', 'email': 'rekha.agarwal@company.com'}
    ]
    
    # Default Admin
    DEFAULT_ADMIN = {
        'employee_id': 'ADMIN001',
        'email': 'dayflow@gmail.com',
        'name': 'System Admin',
        'password': 'admin123@'
    }
