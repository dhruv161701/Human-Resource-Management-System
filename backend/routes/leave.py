from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from database import db
from bson import ObjectId

leave_bp = Blueprint('leave', __name__)


@leave_bp.route('/apply', methods=['POST'])
@jwt_required()
def apply_leave():
    """Apply for leave"""
    try:
        identity = get_jwt_identity()
        employee_id = identity['employee_id']
        employee_name = identity['name']
        
        data = request.get_json()
        
        leave_type = data.get('leave_type')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        reason = data.get('reason', '')
        
        if not leave_type or not start_date or not end_date:
            return jsonify({'error': 'Leave type, start date, and end date are required'}), 400
        
        valid_leave_types = ['Paid Leave', 'Sick Leave', 'Unpaid Leave']
        if leave_type not in valid_leave_types:
            return jsonify({'error': f'Invalid leave type. Must be one of: {", ".join(valid_leave_types)}'}), 400
        
        # Validate dates
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            
            if end < start:
                return jsonify({'error': 'End date cannot be before start date'}), 400
            
            if start < datetime.now().replace(hour=0, minute=0, second=0, microsecond=0):
                return jsonify({'error': 'Cannot apply for leave in the past'}), 400
                
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Check for overlapping leave requests
        overlapping = db.leaves.find_one({
            'employee_id': employee_id,
            'status': {'$ne': 'Rejected'},
            '$or': [
                {'start_date': {'$lte': end_date}, 'end_date': {'$gte': start_date}}
            ]
        })
        
        if overlapping:
            return jsonify({'error': 'You already have a leave request for overlapping dates'}), 400
        
        # Create leave request
        leave = {
            'employee_id': employee_id,
            'employee_name': employee_name,
            'leave_type': leave_type,
            'start_date': start_date,
            'end_date': end_date,
            'reason': reason,
            'status': 'Pending',
            'comment': '',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = db.leaves.insert_one(leave)
        
        return jsonify({
            'message': 'Leave request submitted successfully',
            'leave_id': str(result.inserted_id),
            'status': 'Pending'
        }), 201
        
    except Exception as e:
        print(f"Apply leave error: {e}")
        return jsonify({'error': 'An error occurred while applying for leave'}), 500


@leave_bp.route('/my-leaves', methods=['GET'])
@jwt_required()
def get_my_leaves():
    """Get current employee's leave requests"""
    try:
        identity = get_jwt_identity()
        employee_id = identity['employee_id']
        
        status = request.args.get('status')
        limit = int(request.args.get('limit', 20))
        
        query = {'employee_id': employee_id}
        if status:
            query['status'] = status
        
        leaves = list(db.leaves.find(query).sort('created_at', -1).limit(limit))
        
        result = []
        for leave in leaves:
            result.append({
                'id': str(leave['_id']),
                'leave_type': leave['leave_type'],
                'start_date': leave['start_date'],
                'end_date': leave['end_date'],
                'reason': leave.get('reason', ''),
                'status': leave['status'],
                'comment': leave.get('comment', ''),
                'created_at': leave.get('created_at').isoformat() if leave.get('created_at') else None
            })
        
        return jsonify({'leaves': result}), 200
        
    except Exception as e:
        print(f"Get my leaves error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@leave_bp.route('/cancel/<leave_id>', methods=['DELETE'])
@jwt_required()
def cancel_leave(leave_id):
    """Cancel a pending leave request"""
    try:
        identity = get_jwt_identity()
        employee_id = identity['employee_id']
        
        leave = db.leaves.find_one({
            '_id': ObjectId(leave_id),
            'employee_id': employee_id
        })
        
        if not leave:
            return jsonify({'error': 'Leave request not found'}), 404
        
        if leave['status'] != 'Pending':
            return jsonify({'error': 'Can only cancel pending leave requests'}), 400
        
        db.leaves.delete_one({'_id': ObjectId(leave_id)})
        
        return jsonify({'message': 'Leave request cancelled successfully'}), 200
        
    except Exception as e:
        print(f"Cancel leave error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


# Admin endpoints
@leave_bp.route('/admin/all', methods=['GET'])
@jwt_required()
def get_all_leaves():
    """Get all leave requests (Admin only)"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') not in ['admin', 'manager']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        status = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        
        query = {}
        if status:
            query['status'] = status
        
        leaves = list(db.leaves.find(query).sort('created_at', -1).limit(limit))
        
        result = []
        for leave in leaves:
            result.append({
                'id': str(leave['_id']),
                'employee_id': leave['employee_id'],
                'employee_name': leave.get('employee_name', ''),
                'leave_type': leave['leave_type'],
                'start_date': leave['start_date'],
                'end_date': leave['end_date'],
                'reason': leave.get('reason', ''),
                'status': leave['status'],
                'comment': leave.get('comment', ''),
                'reviewed_by': leave.get('reviewed_by', ''),
                'created_at': leave.get('created_at').isoformat() if leave.get('created_at') else None,
                'updated_at': leave.get('updated_at').isoformat() if leave.get('updated_at') else None
            })
        
        return jsonify({'leaves': result}), 200
        
    except Exception as e:
        print(f"Get all leaves error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@leave_bp.route('/admin/pending', methods=['GET'])
@jwt_required()
def get_pending_leaves():
    """Get pending leave requests (Admin only)"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') not in ['admin', 'manager']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        leaves = list(db.leaves.find({'status': 'Pending'}).sort('created_at', -1))
        
        result = []
        for leave in leaves:
            result.append({
                'id': str(leave['_id']),
                'employee_id': leave['employee_id'],
                'employee_name': leave.get('employee_name', ''),
                'leave_type': leave['leave_type'],
                'start_date': leave['start_date'],
                'end_date': leave['end_date'],
                'reason': leave.get('reason', ''),
                'status': leave['status'],
                'created_at': leave.get('created_at').isoformat() if leave.get('created_at') else None
            })
        
        return jsonify({'leaves': result}), 200
        
    except Exception as e:
        print(f"Get pending leaves error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@leave_bp.route('/admin/review', methods=['POST'])
@jwt_required()
def review_leave():
    """Approve or reject a leave request (Admin only)"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') not in ['admin', 'manager']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        leave_id = data.get('leave_id')
        action = data.get('action')  # 'approve' or 'reject'
        comment = data.get('comment', '')
        
        if not leave_id or not action:
            return jsonify({'error': 'Leave ID and action are required'}), 400
        
        if action not in ['approve', 'reject']:
            return jsonify({'error': 'Invalid action. Must be approve or reject'}), 400
        
        leave = db.leaves.find_one({'_id': ObjectId(leave_id)})
        
        if not leave:
            return jsonify({'error': 'Leave request not found'}), 404
        
        if leave['status'] != 'Pending':
            return jsonify({'error': 'Leave request already reviewed'}), 400
        
        new_status = 'Approved' if action == 'approve' else 'Rejected'
        
        db.leaves.update_one(
            {'_id': ObjectId(leave_id)},
            {'$set': {
                'status': new_status,
                'comment': comment,
                'updated_at': datetime.utcnow(),
                'reviewed_by': identity.get('name', identity.get('email'))
            }}
        )
        
        # If approved, update attendance records for leave dates
        if new_status == 'Approved':
            start = datetime.strptime(leave['start_date'], '%Y-%m-%d')
            end = datetime.strptime(leave['end_date'], '%Y-%m-%d')
            
            current = start
            while current <= end:
                date_str = current.strftime('%Y-%m-%d')
                
                # Update or create attendance record
                db.attendance.update_one(
                    {'employee_id': leave['employee_id'], 'date': date_str},
                    {'$set': {
                        'status': 'Leave',
                        'check_in': None,
                        'check_out': None,
                        'total_hours': 0
                    }},
                    upsert=True
                )
                
                current = current.replace(day=current.day + 1) if current.day < 28 else current.replace(month=current.month + 1, day=1)
        
        return jsonify({
            'message': f'Leave request {new_status.lower()} successfully',
            'status': new_status
        }), 200
        
    except Exception as e:
        print(f"Review leave error: {e}")
        return jsonify({'error': 'An error occurred'}), 500
