from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import base64
from database import db
from utils.gcs_service import gcs_service

employee_bp = Blueprint('employee', __name__)


@employee_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get employee profile"""
    try:
        identity = get_jwt_identity()
        user = db.users.find_one({'email': identity['email']})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
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
            'documents': user.get('documents', []),
            'created_at': user.get('created_at', '').isoformat() if user.get('created_at') else ''
        }), 200
        
    except Exception as e:
        print(f"Get profile error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@employee_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update employee profile (limited fields)"""
    try:
        identity = get_jwt_identity()
        data = request.get_json()
        
        # Fields that employees can update
        allowed_fields = ['phone', 'address', 'name']
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        update_data['updated_at'] = datetime.utcnow()
        
        result = db.users.update_one(
            {'email': identity['email']},
            {'$set': update_data}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Profile not updated'}), 400
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        print(f"Update profile error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@employee_bp.route('/profile/picture', methods=['POST'])
@jwt_required()
def upload_profile_picture():
    """Upload profile picture"""
    try:
        identity = get_jwt_identity()
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg, gif'}), 400
        
        # Upload to GCS
        file_data = file.read()
        result, error = gcs_service.upload_file(
            file_data,
            file.filename,
            file.content_type,
            identity['employee_id']
        )
        
        if error:
            return jsonify({'error': f'Upload failed: {error}'}), 500
        
        # Update user profile
        db.users.update_one(
            {'email': identity['email']},
            {'$set': {'profile_picture': result['url'], 'updated_at': datetime.utcnow()}}
        )
        
        return jsonify({
            'message': 'Profile picture uploaded successfully',
            'url': result['url']
        }), 200
        
    except Exception as e:
        print(f"Upload profile picture error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@employee_bp.route('/documents', methods=['POST'])
@jwt_required()
def upload_document():
    """Upload employee document"""
    try:
        identity = get_jwt_identity()
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        document_type = request.form.get('document_type', 'Other')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Upload to GCS
        file_data = file.read()
        result, error = gcs_service.upload_file(
            file_data,
            file.filename,
            file.content_type,
            identity['employee_id']
        )
        
        if error:
            return jsonify({'error': f'Upload failed: {error}'}), 500
        
        document = {
            'filename': file.filename,
            'url': result['url'],
            'gcs_path': result['gcs_path'],
            'document_type': document_type,
            'uploaded_at': datetime.utcnow().isoformat()
        }
        
        # Add document to user's documents array
        db.users.update_one(
            {'email': identity['email']},
            {
                '$push': {'documents': document},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        
        return jsonify({
            'message': 'Document uploaded successfully',
            'document': document
        }), 200
        
    except Exception as e:
        print(f"Upload document error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@employee_bp.route('/documents/<int:doc_index>', methods=['DELETE'])
@jwt_required()
def delete_document(doc_index):
    """Delete employee document"""
    try:
        identity = get_jwt_identity()
        user = db.users.find_one({'email': identity['email']})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        documents = user.get('documents', [])
        
        if doc_index < 0 or doc_index >= len(documents):
            return jsonify({'error': 'Document not found'}), 404
        
        document = documents[doc_index]
        
        # Delete from GCS
        if document.get('gcs_path'):
            gcs_service.delete_file(document['gcs_path'])
        
        # Remove from user's documents array
        documents.pop(doc_index)
        db.users.update_one(
            {'email': identity['email']},
            {
                '$set': {'documents': documents, 'updated_at': datetime.utcnow()}
            }
        )
        
        return jsonify({'message': 'Document deleted successfully'}), 200
        
    except Exception as e:
        print(f"Delete document error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@employee_bp.route('/salary', methods=['GET'])
@jwt_required()
def get_salary():
    """Get employee salary details (read-only)"""
    try:
        identity = get_jwt_identity()
        user = db.users.find_one({'email': identity['email']})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'salary': user.get('salary', {}),
            'employee_id': user['employee_id'],
            'name': user['name']
        }), 200
        
    except Exception as e:
        print(f"Get salary error: {e}")
        return jsonify({'error': 'An error occurred'}), 500
