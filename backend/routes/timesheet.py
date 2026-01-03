from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from database import db
from utils.email_service import send_timesheet_notification

timesheet_bp = Blueprint('timesheet', __name__)


def get_week_dates(date=None):
    """Get the start and end dates of the week for a given date"""
    if date is None:
        date = datetime.now()
    elif isinstance(date, str):
        date = datetime.strptime(date, '%Y-%m-%d')
    
    start_of_week = date - timedelta(days=date.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    return start_of_week.strftime('%Y-%m-%d'), end_of_week.strftime('%Y-%m-%d')


@timesheet_bp.route('/submit', methods=['POST'])
@jwt_required()
def submit_timesheet():
    """Submit weekly timesheet"""
    try:
        identity = get_jwt_identity()
        employee_id = identity['employee_id']
        employee_name = identity['name']
        
        data = request.get_json()
        manager_id = data.get('manager_id')
        
        if not manager_id:
            return jsonify({'error': 'Manager selection is required'}), 400
        
        # Verify manager exists
        manager = db.managers.find_one({'manager_id': manager_id, 'is_active': True})
        if not manager:
            return jsonify({'error': 'Invalid manager selected'}), 400
        
        # Get current week dates
        week_start, week_end = get_week_dates()
        
        # Check if today is Friday, Saturday, or Sunday
        today = datetime.now()
        day_of_week = today.weekday()
        
        if day_of_week < 4:  # Before Friday
            return jsonify({
                'error': 'Timesheet can only be submitted on Friday, Saturday, or Sunday'
            }), 400
        
        # Check if already submitted
        existing = db.timesheets.find_one({
            'employee_id': employee_id,
            'week_start': week_start
        })
        
        if existing:
            return jsonify({
                'error': f'Timesheet already submitted for this week. Status: {existing["status"]}'
            }), 400
        
        # Check if previous week timesheet is approved
        prev_week_start, _ = get_week_dates(today - timedelta(days=7))
        prev_timesheet = db.timesheets.find_one({
            'employee_id': employee_id,
            'week_start': prev_week_start
        })
        
        if prev_timesheet and prev_timesheet.get('status') != 'approved':
            return jsonify({
                'error': 'Previous week timesheet must be approved before submitting new one'
            }), 400
        
        # Get attendance records for the week
        attendance_records = list(db.attendance.find({
            'employee_id': employee_id,
            'date': {'$gte': week_start, '$lte': week_end}
        }))
        
        # Calculate total hours
        total_hours = sum(a.get('total_hours', 0) for a in attendance_records)
        
        # Prepare attendance data for timesheet
        attendance_data = []
        for record in attendance_records:
            attendance_data.append({
                'date': record['date'],
                'check_in': record.get('check_in'),
                'check_out': record.get('check_out'),
                'total_hours': record.get('total_hours', 0),
                'status': record.get('status', 'Absent')
            })
        
        # Create timesheet
        timesheet = {
            'employee_id': employee_id,
            'employee_name': employee_name,
            'week_start': week_start,
            'week_end': week_end,
            'manager_id': manager_id,
            'manager_name': manager['name'],
            'status': 'pending',
            'total_hours': round(total_hours, 2),
            'attendance_records': attendance_data,
            'submitted_at': datetime.utcnow(),
            'reviewed_at': None,
            'comments': ''
        }
        
        db.timesheets.insert_one(timesheet)
        
        return jsonify({
            'message': 'Timesheet submitted successfully',
            'week_start': week_start,
            'week_end': week_end,
            'manager': manager['name'],
            'total_hours': round(total_hours, 2)
        }), 200
        
    except Exception as e:
        print(f"Submit timesheet error: {e}")
        return jsonify({'error': 'An error occurred while submitting timesheet'}), 500


@timesheet_bp.route('/status', methods=['GET'])
@jwt_required()
def get_timesheet_status():
    """Get current week timesheet status"""
    try:
        identity = get_jwt_identity()
        employee_id = identity['employee_id']
        
        week_start, week_end = get_week_dates()
        
        timesheet = db.timesheets.find_one({
            'employee_id': employee_id,
            'week_start': week_start
        })
        
        if timesheet:
            return jsonify({
                'submitted': True,
                'status': timesheet['status'],
                'week_start': week_start,
                'week_end': week_end,
                'manager_name': timesheet.get('manager_name'),
                'total_hours': timesheet.get('total_hours', 0),
                'submitted_at': timesheet.get('submitted_at').isoformat() if timesheet.get('submitted_at') else None,
                'reviewed_at': timesheet.get('reviewed_at').isoformat() if timesheet.get('reviewed_at') else None,
                'comments': timesheet.get('comments', '')
            }), 200
        
        return jsonify({
            'submitted': False,
            'week_start': week_start,
            'week_end': week_end
        }), 200
        
    except Exception as e:
        print(f"Get timesheet status error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@timesheet_bp.route('/history', methods=['GET'])
@jwt_required()
def get_timesheet_history():
    """Get employee's timesheet history"""
    try:
        identity = get_jwt_identity()
        employee_id = identity['employee_id']
        
        limit = int(request.args.get('limit', 10))
        
        timesheets = list(db.timesheets.find({
            'employee_id': employee_id
        }).sort('week_start', -1).limit(limit))
        
        result = []
        for ts in timesheets:
            result.append({
                'week_start': ts['week_start'],
                'week_end': ts['week_end'],
                'status': ts['status'],
                'manager_name': ts.get('manager_name'),
                'total_hours': ts.get('total_hours', 0),
                'submitted_at': ts.get('submitted_at').isoformat() if ts.get('submitted_at') else None,
                'reviewed_at': ts.get('reviewed_at').isoformat() if ts.get('reviewed_at') else None,
                'comments': ts.get('comments', '')
            })
        
        return jsonify({'timesheets': result}), 200
        
    except Exception as e:
        print(f"Get timesheet history error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


# Manager endpoints
@timesheet_bp.route('/manager/pending', methods=['GET'])
@jwt_required()
def get_pending_timesheets():
    """Get pending timesheets for manager"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') != 'manager':
            return jsonify({'error': 'Unauthorized'}), 403
        
        manager_id = identity['manager_id']
        
        timesheets = list(db.timesheets.find({
            'manager_id': manager_id,
            'status': 'pending'
        }).sort('submitted_at', -1))
        
        result = []
        for ts in timesheets:
            result.append({
                'id': str(ts['_id']),
                'employee_id': ts['employee_id'],
                'employee_name': ts['employee_name'],
                'week_start': ts['week_start'],
                'week_end': ts['week_end'],
                'total_hours': ts.get('total_hours', 0),
                'attendance_records': ts.get('attendance_records', []),
                'submitted_at': ts.get('submitted_at').isoformat() if ts.get('submitted_at') else None
            })
        
        return jsonify({'timesheets': result}), 200
        
    except Exception as e:
        print(f"Get pending timesheets error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@timesheet_bp.route('/manager/all', methods=['GET'])
@jwt_required()
def get_all_timesheets():
    """Get all timesheets for manager"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') != 'manager':
            return jsonify({'error': 'Unauthorized'}), 403
        
        manager_id = identity['manager_id']
        status = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        
        query = {'manager_id': manager_id}
        if status:
            query['status'] = status
        
        timesheets = list(db.timesheets.find(query).sort('submitted_at', -1).limit(limit))
        
        result = []
        for ts in timesheets:
            result.append({
                'id': str(ts['_id']),
                'employee_id': ts['employee_id'],
                'employee_name': ts['employee_name'],
                'week_start': ts['week_start'],
                'week_end': ts['week_end'],
                'status': ts['status'],
                'total_hours': ts.get('total_hours', 0),
                'attendance_records': ts.get('attendance_records', []),
                'submitted_at': ts.get('submitted_at').isoformat() if ts.get('submitted_at') else None,
                'reviewed_at': ts.get('reviewed_at').isoformat() if ts.get('reviewed_at') else None,
                'comments': ts.get('comments', '')
            })
        
        return jsonify({'timesheets': result}), 200
        
    except Exception as e:
        print(f"Get all timesheets error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@timesheet_bp.route('/manager/review', methods=['POST'])
@jwt_required()
def review_timesheet():
    """Approve or reject a timesheet"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') != 'manager':
            return jsonify({'error': 'Unauthorized'}), 403
        
        manager_id = identity['manager_id']
        data = request.get_json()
        
        employee_id = data.get('employee_id')
        week_start = data.get('week_start')
        action = data.get('action')  # 'approve' or 'reject'
        comments = data.get('comments', '')
        
        if not employee_id or not week_start or not action:
            return jsonify({'error': 'Missing required fields'}), 400
        
        if action not in ['approve', 'reject']:
            return jsonify({'error': 'Invalid action'}), 400
        
        # Find the timesheet
        timesheet = db.timesheets.find_one({
            'employee_id': employee_id,
            'week_start': week_start,
            'manager_id': manager_id
        })
        
        if not timesheet:
            return jsonify({'error': 'Timesheet not found'}), 404
        
        if timesheet['status'] != 'pending':
            return jsonify({'error': 'Timesheet already reviewed'}), 400
        
        # Update timesheet status
        new_status = 'approved' if action == 'approve' else 'rejected'
        
        db.timesheets.update_one(
            {'employee_id': employee_id, 'week_start': week_start},
            {'$set': {
                'status': new_status,
                'reviewed_at': datetime.utcnow(),
                'comments': comments
            }}
        )
        
        # Get employee email for notification
        employee = db.users.find_one({'employee_id': employee_id})
        if employee:
            send_timesheet_notification(
                employee['email'],
                employee['name'],
                new_status,
                week_start,
                timesheet['week_end'],
                comments
            )
        
        return jsonify({
            'message': f'Timesheet {new_status} successfully',
            'status': new_status
        }), 200
        
    except Exception as e:
        print(f"Review timesheet error: {e}")
        return jsonify({'error': 'An error occurred'}), 500
