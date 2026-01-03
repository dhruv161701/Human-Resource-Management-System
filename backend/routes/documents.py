from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from bson import ObjectId
from database import db
from utils.email_service import send_document_request_email
from utils.azure_storage import azure_storage

documents_bp = Blueprint('documents', __name__)


@documents_bp.route('/request', methods=['POST'])
@jwt_required()
def request_document():
    """HR/Admin requests a document from an employee"""
    try:
        identity = get_jwt_identity()
        
        # Only admin can request documents
        if identity.get('role') != 'admin':
            return jsonify({'error': 'Only admin can request documents'}), 403
        
        data = request.get_json()
        employee_id = data.get('employee_id')
        document_type = data.get('document_type')
        description = data.get('description', '')
        due_date = data.get('due_date')
        
        if not employee_id or not document_type:
            return jsonify({'error': 'Employee ID and document type are required'}), 400
        
        # Get employee details
        employee = db.users.find_one({'employee_id': employee_id})
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        # Create document request
        doc_request = {
            'employee_id': employee_id,
            'employee_email': employee['email'],
            'employee_name': employee.get('name', ''),
            'document_type': document_type,
            'description': description,
            'due_date': due_date,
            'status': 'pending',  # pending, uploaded, approved, rejected
            'requested_by': identity.get('employee_id') or identity.get('email'),
            'requested_at': datetime.utcnow(),
            'uploaded_at': None,
            'reviewed_at': None,
            'document_url': None,
            'filename': None,
            'comments': None
        }
        
        result = db.document_requests.insert_one(doc_request)
        
        # Send email notification to employee
        try:
            send_document_request_email(
                employee['email'],
                employee.get('name', 'Employee'),
                document_type,
                description,
                due_date
            )
        except Exception as e:
            print(f"Failed to send document request email: {e}")
        
        return jsonify({
            'message': 'Document request sent successfully',
            'request_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(f"Request document error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@documents_bp.route('/requests/pending', methods=['GET'])
@jwt_required()
def get_pending_requests():
    """Get pending document requests for current employee"""
    try:
        identity = get_jwt_identity()
        employee_id = identity.get('employee_id')
        
        if not employee_id:
            return jsonify({'error': 'Employee ID not found'}), 400
        
        requests = list(db.document_requests.find({
            'employee_id': employee_id,
            'status': 'pending'
        }).sort('requested_at', -1))
        
        result = []
        for req in requests:
            result.append({
                'id': str(req['_id']),
                'document_type': req['document_type'],
                'description': req.get('description', ''),
                'due_date': req.get('due_date'),
                'requested_at': req['requested_at'].isoformat() if req.get('requested_at') else None,
                'status': req['status']
            })
        
        return jsonify({'requests': result}), 200
        
    except Exception as e:
        print(f"Get pending requests error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@documents_bp.route('/requests/all', methods=['GET'])
@jwt_required()
def get_all_requests():
    """Get all document requests for current employee"""
    try:
        identity = get_jwt_identity()
        employee_id = identity.get('employee_id')
        
        if not employee_id:
            return jsonify({'error': 'Employee ID not found'}), 400
        
        status = request.args.get('status')
        query = {'employee_id': employee_id}
        if status:
            query['status'] = status
        
        requests = list(db.document_requests.find(query).sort('requested_at', -1))
        
        result = []
        for req in requests:
            result.append({
                'id': str(req['_id']),
                'document_type': req['document_type'],
                'description': req.get('description', ''),
                'due_date': req.get('due_date'),
                'requested_at': req['requested_at'].isoformat() if req.get('requested_at') else None,
                'uploaded_at': req['uploaded_at'].isoformat() if req.get('uploaded_at') else None,
                'status': req['status'],
                'document_url': req.get('document_url'),
                'filename': req.get('filename'),
                'comments': req.get('comments')
            })
        
        return jsonify({'requests': result}), 200
        
    except Exception as e:
        print(f"Get all requests error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@documents_bp.route('/upload/<request_id>', methods=['POST'])
@jwt_required()
def upload_document(request_id):
    """Employee uploads a requested document"""
    try:
        identity = get_jwt_identity()
        employee_id = identity.get('employee_id')
        
        if not employee_id:
            return jsonify({'error': 'Employee ID not found'}), 400
        
        # Get the document request
        doc_request = db.document_requests.find_one({
            '_id': ObjectId(request_id),
            'employee_id': employee_id
        })
        
        if not doc_request:
            return jsonify({'error': 'Document request not found'}), 404
        
        if doc_request['status'] != 'pending':
            return jsonify({'error': 'Document already uploaded or processed'}), 400
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Upload to Azure Blob Storage
        file_data = file.read()
        result, error = azure_storage.upload_file(
            file_data, 
            file.filename, 
            file.content_type, 
            employee_id
        )
        
        if error or not result:
            return jsonify({'error': error or 'Failed to upload file'}), 500
        
        url = result['url']
        
        # Update document request
        db.document_requests.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': {
                'status': 'uploaded',
                'document_url': url,
                'filename': file.filename,
                'uploaded_at': datetime.utcnow()
            }}
        )
        
        return jsonify({
            'message': 'Document uploaded successfully',
            'url': url
        }), 200
        
    except Exception as e:
        print(f"Upload document error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@documents_bp.route('/admin/requests', methods=['GET'])
@jwt_required()
def admin_get_all_requests():
    """Admin gets all document requests"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        status = request.args.get('status')
        employee_id = request.args.get('employee_id')
        limit = int(request.args.get('limit', 50))
        
        query = {}
        if status:
            query['status'] = status
        if employee_id:
            query['employee_id'] = employee_id
        
        requests = list(db.document_requests.find(query).sort('requested_at', -1).limit(limit))
        
        result = []
        for req in requests:
            result.append({
                'id': str(req['_id']),
                'employee_id': req['employee_id'],
                'employee_name': req.get('employee_name', ''),
                'employee_email': req.get('employee_email', ''),
                'document_type': req['document_type'],
                'description': req.get('description', ''),
                'due_date': req.get('due_date'),
                'requested_at': req['requested_at'].isoformat() if req.get('requested_at') else None,
                'uploaded_at': req['uploaded_at'].isoformat() if req.get('uploaded_at') else None,
                'reviewed_at': req['reviewed_at'].isoformat() if req.get('reviewed_at') else None,
                'status': req['status'],
                'document_url': req.get('document_url'),
                'filename': req.get('filename'),
                'comments': req.get('comments')
            })
        
        return jsonify({'requests': result}), 200
        
    except Exception as e:
        print(f"Admin get requests error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@documents_bp.route('/admin/employee/<employee_id>', methods=['GET'])
@jwt_required()
def admin_get_employee_documents(employee_id):
    """Admin gets all document requests for a specific employee"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        requests = list(db.document_requests.find({
            'employee_id': employee_id
        }).sort('requested_at', -1))
        
        result = []
        for req in requests:
            result.append({
                'id': str(req['_id']),
                'employee_id': req['employee_id'],
                'document_type': req['document_type'],
                'description': req.get('description', ''),
                'due_date': req.get('due_date'),
                'requested_at': req['requested_at'].isoformat() if req.get('requested_at') else None,
                'uploaded_at': req['uploaded_at'].isoformat() if req.get('uploaded_at') else None,
                'reviewed_at': req['reviewed_at'].isoformat() if req.get('reviewed_at') else None,
                'status': req['status'],
                'url': req.get('document_url'),
                'filename': req.get('filename'),
                'comments': req.get('comments')
            })
        
        return jsonify({'documents': result}), 200
        
    except Exception as e:
        print(f"Admin get employee documents error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@documents_bp.route('/admin/review', methods=['POST'])
@jwt_required()
def admin_review_document():
    """Admin reviews an uploaded document"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        request_id = data.get('request_id')
        action = data.get('action')  # approved or rejected
        comments = data.get('comments', '')
        
        if not request_id or action not in ['approved', 'rejected']:
            return jsonify({'error': 'Request ID and valid action required'}), 400
        
        doc_request = db.document_requests.find_one({'_id': ObjectId(request_id)})
        
        if not doc_request:
            return jsonify({'error': 'Document request not found'}), 404
        
        if doc_request['status'] != 'uploaded':
            return jsonify({'error': 'Document not uploaded yet or already reviewed'}), 400
        
        new_status = action  # action is already 'approved' or 'rejected'
        
        # Update document request
        db.document_requests.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': {
                'status': new_status,
                'reviewed_at': datetime.utcnow(),
                'reviewed_by': identity.get('employee_id') or identity.get('email'),
                'comments': comments
            }}
        )
        
        # If rejected, create a new pending request for re-upload
        if action == 'rejected':
            db.document_requests.insert_one({
                'employee_id': doc_request['employee_id'],
                'employee_name': doc_request.get('employee_name', ''),
                'employee_email': doc_request.get('employee_email', ''),
                'document_type': doc_request['document_type'],
                'description': f"Re-upload requested. Reason: {comments}" if comments else "Re-upload requested",
                'requested_at': datetime.utcnow(),
                'status': 'pending'
            })
        
        # If approved, add to employee's documents array
        if action == 'approved' and doc_request.get('document_url'):
            db.users.update_one(
                {'employee_id': doc_request['employee_id']},
                {'$push': {
                    'documents': {
                        'document_type': doc_request['document_type'],
                        'filename': doc_request.get('filename', ''),
                        'url': doc_request['document_url'],
                        'uploaded_at': doc_request.get('uploaded_at'),
                        'approved_at': datetime.utcnow()
                    }
                }}
            )
        
        return jsonify({
            'message': f'Document {new_status} successfully'
        }), 200
        
    except Exception as e:
        print(f"Admin review document error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@documents_bp.route('/types', methods=['GET'])
@jwt_required()
def get_document_types():
    """Get list of document types"""
    document_types = [
        {'id': 'aadhar', 'name': 'Aadhar Card'},
        {'id': 'pan', 'name': 'PAN Card'},
        {'id': 'passport', 'name': 'Passport'},
        {'id': 'driving_license', 'name': 'Driving License'},
        {'id': 'voter_id', 'name': 'Voter ID'},
        {'id': 'education_certificate', 'name': 'Education Certificate'},
        {'id': 'experience_letter', 'name': 'Experience Letter'},
        {'id': 'relieving_letter', 'name': 'Relieving Letter'},
        {'id': 'salary_slip', 'name': 'Salary Slip'},
        {'id': 'bank_statement', 'name': 'Bank Statement'},
        {'id': 'address_proof', 'name': 'Address Proof'},
        {'id': 'photo', 'name': 'Passport Size Photo'},
        {'id': 'other', 'name': 'Other'}
    ]
    return jsonify({'types': document_types}), 200
