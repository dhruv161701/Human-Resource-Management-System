from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import bcrypt
from database import db
from config import Config

admin_bp = Blueprint('admin', __name__)


def admin_required(f):
    """Decorator to check if user is admin"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        identity = get_jwt_identity()
        if identity.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


@admin_bp.route('/employees', methods=['GET'])
@jwt_required()
def get_all_employees():
    """Get all employees"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') not in ['admin', 'manager']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        search = request.args.get('search', '')
        department = request.args.get('department', '')
        limit = int(request.args.get('limit', 100))
        
        query = {'role': 'employee'}
        
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}},
                {'employee_id': {'$regex': search, '$options': 'i'}}
            ]
        
        if department:
            query['department'] = department
        
        employees = list(db.users.find(query).limit(limit))
        
        result = []
        for emp in employees:
            # Count documents for this employee
            documents = emp.get('documents', [])
            doc_count = len(documents) if documents else 0
            
            # Count pending document requests
            pending_requests = db.document_requests.count_documents({
                'employee_id': emp['employee_id'],
                'status': 'pending'
            })
            
            result.append({
                'employee_id': emp['employee_id'],
                'name': emp.get('name', ''),
                'email': emp['email'],
                'department': emp.get('department', ''),
                'job_title': emp.get('job_title', ''),
                'phone': emp.get('phone', ''),
                'status': 'Active' if emp.get('is_verified') else 'Pending',
                'is_verified': emp.get('is_verified', False),
                'profile_picture': emp.get('profile_picture', ''),
                'document_count': doc_count,
                'pending_doc_requests': pending_requests,
                'created_at': emp.get('created_at').isoformat() if emp.get('created_at') else None
            })
        
        return jsonify({'employees': result}), 200
        
    except Exception as e:
        print(f"Get employees error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@admin_bp.route('/employees/<employee_id>', methods=['GET'])
@jwt_required()
def get_employee(employee_id):
    """Get specific employee details"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') not in ['admin', 'manager']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        employee = db.users.find_one({'employee_id': employee_id})
        
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        # Get pending document requests for this employee
        pending_doc_requests = list(db.document_requests.find({
            'employee_id': employee_id,
            'status': 'pending'
        }))
        
        pending_requests = []
        for req in pending_doc_requests:
            pending_requests.append({
                'id': str(req['_id']),
                'document_type': req['document_type'],
                'description': req.get('description', ''),
                'due_date': req.get('due_date'),
                'requested_at': req['requested_at'].isoformat() if req.get('requested_at') else None
            })
        
        return jsonify({
            'employee_id': employee['employee_id'],
            'name': employee.get('name', ''),
            'email': employee['email'],
            'department': employee.get('department', ''),
            'job_title': employee.get('job_title', ''),
            'phone': employee.get('phone', ''),
            'address': employee.get('address', ''),
            'salary': employee.get('salary', {}),
            'documents': employee.get('documents', []),
            'pending_document_requests': pending_requests,
            'profile_picture': employee.get('profile_picture', ''),
            'is_verified': employee.get('is_verified', False),
            'status': 'Active' if employee.get('is_verified') else 'Pending',
            'created_at': employee.get('created_at').isoformat() if employee.get('created_at') else None
        }), 200
        
    except Exception as e:
        print(f"Get employee error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@admin_bp.route('/employees/<employee_id>', methods=['PUT'])
@jwt_required()
def update_employee(employee_id):
    """Update employee details (Admin can update all fields)"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        # Fields that admin can update
        allowed_fields = ['name', 'department', 'job_title', 'phone', 'address', 'salary']
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        update_data['updated_at'] = datetime.utcnow()
        
        result = db.users.update_one(
            {'employee_id': employee_id},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Employee not found'}), 404
        
        return jsonify({'message': 'Employee updated successfully'}), 200
        
    except Exception as e:
        print(f"Update employee error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@admin_bp.route('/employees/<employee_id>/salary', methods=['PUT'])
@jwt_required()
def update_salary(employee_id):
    """Update employee salary structure"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        basic = int(data.get('basic', 0))
        hra = int(data.get('hra', 0))
        allowances = int(data.get('allowances', 0))
        deductions = int(data.get('deductions', 0))
        net = basic + hra + allowances - deductions
        
        salary_data = {
            'basic': basic,
            'hra': hra,
            'allowances': allowances,
            'deductions': deductions,
            'net': net,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = db.users.update_one(
            {'employee_id': employee_id},
            {'$set': {'salary': salary_data, 'updated_at': datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Employee not found'}), 404
        
        return jsonify({'message': 'Salary updated successfully'}), 200
        
    except Exception as e:
        print(f"Update salary error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@admin_bp.route('/attendance/all', methods=['GET'])
@jwt_required()
def get_all_attendance():
    """Get attendance records for all employees"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') not in ['admin', 'manager']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        date = request.args.get('date')
        employee_id = request.args.get('employee_id')
        limit = int(request.args.get('limit', 100))
        
        query = {}
        
        if date:
            query['date'] = date
        
        if employee_id:
            query['employee_id'] = employee_id
        
        attendance_records = list(db.attendance.find(query).sort('date', -1).limit(limit))
        
        # Get employee names
        employee_ids = list(set(a['employee_id'] for a in attendance_records))
        employees = {e['employee_id']: e['name'] for e in db.users.find({'employee_id': {'$in': employee_ids}})}
        
        result = []
        for record in attendance_records:
            result.append({
                'employee_id': record['employee_id'],
                'employee_name': employees.get(record['employee_id'], 'Unknown'),
                'date': record['date'],
                'check_in': record.get('check_in'),
                'check_out': record.get('check_out'),
                'total_hours': record.get('total_hours', 0),
                'status': record.get('status', 'Absent'),
                'mode': record.get('mode', '')
            })
        
        return jsonify({'attendance': result}), 200
        
    except Exception as e:
        print(f"Get all attendance error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@admin_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') not in ['admin', 'manager']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Total employees
        total_employees = db.users.count_documents({'role': 'employee', 'is_verified': True})
        
        # Today's attendance
        present_today = db.attendance.count_documents({'date': today, 'status': 'Present'})
        absent_today = total_employees - present_today
        
        # Pending leave requests
        pending_leaves = db.leaves.count_documents({'status': 'Pending'})
        
        # Pending timesheets (for managers)
        pending_timesheets = 0
        if identity.get('role') == 'manager':
            pending_timesheets = db.timesheets.count_documents({
                'manager_id': identity.get('manager_id'),
                'status': 'pending'
            })
        else:
            pending_timesheets = db.timesheets.count_documents({'status': 'pending'})
        
        return jsonify({
            'total_employees': total_employees,
            'present_today': present_today,
            'absent_today': absent_today,
            'pending_leaves': pending_leaves,
            'pending_timesheets': pending_timesheets
        }), 200
        
    except Exception as e:
        print(f"Get dashboard stats error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@admin_bp.route('/departments', methods=['GET'])
@jwt_required()
def get_departments():
    """Get list of unique departments"""
    try:
        departments = db.users.distinct('department')
        departments = [d for d in departments if d]  # Filter empty values
        
        return jsonify({'departments': departments}), 200
        
    except Exception as e:
        print(f"Get departments error: {e}")
        return jsonify({'error': 'An error occurred'}), 500
