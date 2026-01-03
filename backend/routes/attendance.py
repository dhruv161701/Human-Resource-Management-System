from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from database import db
from config import Config

attendance_bp = Blueprint('attendance', __name__)


def get_week_dates(date=None):
    """Get the start and end dates of the week for a given date
    Weeks start from January 5th, 2026 (Monday)
    """
    if date is None:
        date = datetime.now()
    elif isinstance(date, str):
        date = datetime.strptime(date, '%Y-%m-%d')
    
    # Reference start date: January 5th, 2026 (Monday)
    reference_start = datetime(2026, 1, 5)
    
    # If date is before reference start, use reference start week
    if date < reference_start:
        return reference_start.strftime('%Y-%m-%d'), (reference_start + timedelta(days=6)).strftime('%Y-%m-%d')
    
    # Calculate which week number we're in since reference start
    days_since_reference = (date - reference_start).days
    week_number = days_since_reference // 7
    
    # Calculate start and end of that week
    start_of_week = reference_start + timedelta(weeks=week_number)
    end_of_week = start_of_week + timedelta(days=6)
    
    return start_of_week.strftime('%Y-%m-%d'), end_of_week.strftime('%Y-%m-%d')


def calculate_hours(check_in, check_out):
    """Calculate total hours between check-in and check-out"""
    try:
        # Parse times (format: HH:MM AM/PM or HH:MM)
        def parse_time(time_str):
            for fmt in ['%I:%M %p', '%H:%M', '%I:%M%p']:
                try:
                    return datetime.strptime(time_str.strip(), fmt)
                except ValueError:
                    continue
            return None
        
        in_time = parse_time(check_in)
        out_time = parse_time(check_out)
        
        if in_time and out_time:
            diff = out_time - in_time
            hours = diff.total_seconds() / 3600
            return round(hours, 2)
        return 0
    except Exception:
        return 0


@attendance_bp.route('/check-in', methods=['POST'])
@jwt_required()
def check_in():
    """Employee check-in for a specific date"""
    try:
        identity = get_jwt_identity()
        employee_id = identity['employee_id']
        
        data = request.get_json() or {}
        target_date_str = data.get('date')
        
        # Use provided date or today
        if target_date_str:
            target_date = datetime.strptime(target_date_str, '%Y-%m-%d')
        else:
            target_date = datetime.now()
            target_date_str = target_date.strftime('%Y-%m-%d')
        
        current_time = datetime.now().strftime('%I:%M %p')
        week_start, week_end = get_week_dates(target_date)
        
        # Check if target date is Saturday (5) or Sunday (6)
        if target_date.weekday() in [5, 6]:
            return jsonify({'error': 'Check-in is not available on weekends'}), 400
        
        # Check if already checked in for that date
        existing = db.attendance.find_one({
            'employee_id': employee_id,
            'date': target_date_str
        })
        
        if existing and existing.get('check_in'):
            return jsonify({'error': f'Already checked in for {target_date_str}'}), 400
        
        # Create or update attendance record
        if existing:
            db.attendance.update_one(
                {'employee_id': employee_id, 'date': target_date_str},
                {'$set': {
                    'check_in': current_time,
                    'status': 'Present',
                    'week_start': week_start,
                    'week_end': week_end
                }}
            )
        else:
            db.attendance.insert_one({
                'employee_id': employee_id,
                'date': target_date_str,
                'check_in': current_time,
                'check_out': None,
                'total_hours': 0,
                'status': 'Present',
                'mode': 'Office',
                'week_start': week_start,
                'week_end': week_end
            })
        
        return jsonify({
            'message': 'Check-in successful',
            'check_in': current_time,
            'date': target_date_str
        }), 200
        
    except Exception as e:
        print(f"Check-in error: {e}")
        return jsonify({'error': 'An error occurred during check-in'}), 500


@attendance_bp.route('/check-out', methods=['POST'])
@jwt_required()
def check_out():
    """Employee check-out for a specific date"""
    try:
        identity = get_jwt_identity()
        employee_id = identity['employee_id']
        
        data = request.get_json() or {}
        target_date_str = data.get('date')
        
        # Use provided date or today
        if not target_date_str:
            target_date_str = datetime.now().strftime('%Y-%m-%d')
        
        current_time = datetime.now().strftime('%I:%M %p')
        
        # Check if checked in for that date
        existing = db.attendance.find_one({
            'employee_id': employee_id,
            'date': target_date_str
        })
        
        if not existing or not existing.get('check_in'):
            return jsonify({'error': f'Please check-in first for {target_date_str}'}), 400
        
        if existing.get('check_out'):
            return jsonify({'error': f'Already checked out for {target_date_str}'}), 400
        
        # Calculate total hours
        total_hours = calculate_hours(existing['check_in'], current_time)
        
        # Determine status based on hours
        status = 'Present'
        if total_hours < 4:
            status = 'Half-day'
        
        # Update attendance record
        db.attendance.update_one(
            {'employee_id': employee_id, 'date': target_date_str},
            {'$set': {
                'check_out': current_time,
                'total_hours': total_hours,
                'status': status
            }}
        )
        
        return jsonify({
            'message': 'Check-out successful',
            'check_out': current_time,
            'total_hours': total_hours,
            'status': status,
            'date': target_date_str
        }), 200
        
    except Exception as e:
        print(f"Check-out error: {e}")
        return jsonify({'error': 'An error occurred during check-out'}), 500


@attendance_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today_attendance():
    """Get today's attendance for current employee"""
    try:
        identity = get_jwt_identity()
        employee_id = identity['employee_id']
        
        today = datetime.now().strftime('%Y-%m-%d')
        
        attendance = db.attendance.find_one({
            'employee_id': employee_id,
            'date': today
        })
        
        if attendance:
            return jsonify({
                'date': attendance['date'],
                'check_in': attendance.get('check_in'),
                'check_out': attendance.get('check_out'),
                'total_hours': attendance.get('total_hours', 0),
                'status': attendance.get('status', 'Absent'),
                'mode': attendance.get('mode', '')
            }), 200
        
        return jsonify({
            'date': today,
            'check_in': None,
            'check_out': None,
            'total_hours': 0,
            'status': 'Absent',
            'mode': ''
        }), 200
        
    except Exception as e:
        print(f"Get today attendance error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@attendance_bp.route('/weekly', methods=['GET'])
@jwt_required()
def get_weekly_attendance():
    """Get weekly attendance for current employee"""
    try:
        identity = get_jwt_identity()
        employee_id = identity['employee_id']
        
        # Get week start and end dates
        week_start, week_end = get_week_dates()
        
        # Get all attendance records for the week
        attendance_records = list(db.attendance.find({
            'employee_id': employee_id,
            'date': {'$gte': week_start, '$lte': week_end}
        }))
        
        # Create a map of date to attendance
        attendance_map = {a['date']: a for a in attendance_records}
        
        # Generate all days of the week
        start_date = datetime.strptime(week_start, '%Y-%m-%d')
        weekly_data = []
        
        for i in range(7):
            date = start_date + timedelta(days=i)
            date_str = date.strftime('%Y-%m-%d')
            day_name = date.strftime('%a')
            
            if date_str in attendance_map:
                record = attendance_map[date_str]
                weekly_data.append({
                    'date': date_str,
                    'day': day_name,
                    'check_in': record.get('check_in'),
                    'check_out': record.get('check_out'),
                    'total_hours': record.get('total_hours', 0),
                    'status': record.get('status', 'Absent'),
                    'mode': record.get('mode', '')
                })
            else:
                weekly_data.append({
                    'date': date_str,
                    'day': day_name,
                    'check_in': None,
                    'check_out': None,
                    'total_hours': 0,
                    'status': 'Absent',
                    'mode': ''
                })
        
        # Calculate total weekly hours
        total_weekly_hours = sum(d.get('total_hours', 0) for d in weekly_data)
        
        return jsonify({
            'week_start': week_start,
            'week_end': week_end,
            'attendance': weekly_data,
            'total_hours': round(total_weekly_hours, 2)
        }), 200
        
    except Exception as e:
        print(f"Get weekly attendance error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@attendance_bp.route('/history', methods=['GET'])
@jwt_required()
def get_attendance_history():
    """Get attendance history for current employee"""
    try:
        identity = get_jwt_identity()
        employee_id = identity['employee_id']
        
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = int(request.args.get('limit', 30))
        
        query = {'employee_id': employee_id}
        
        if start_date and end_date:
            query['date'] = {'$gte': start_date, '$lte': end_date}
        
        attendance_records = list(db.attendance.find(query).sort('date', -1).limit(limit))
        
        result = []
        for record in attendance_records:
            result.append({
                'date': record['date'],
                'check_in': record.get('check_in'),
                'check_out': record.get('check_out'),
                'total_hours': record.get('total_hours', 0),
                'status': record.get('status', 'Absent'),
                'mode': record.get('mode', '')
            })
        
        return jsonify({'attendance': result}), 200
        
    except Exception as e:
        print(f"Get attendance history error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@attendance_bp.route('/managers', methods=['GET'])
@jwt_required()
def get_managers():
    """Get list of managers for timesheet submission"""
    try:
        managers = list(db.managers.find({'is_active': True}))
        
        result = []
        for manager in managers:
            result.append({
                'manager_id': manager['manager_id'],
                'name': manager['name'],
                'email': manager['email']
            })
        
        return jsonify({'managers': result}), 200
        
    except Exception as e:
        print(f"Get managers error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@attendance_bp.route('/can-submit-timesheet', methods=['GET'])
@jwt_required()
def can_submit_timesheet():
    """Check if employee can submit timesheet"""
    try:
        identity = get_jwt_identity()
        employee_id = identity['employee_id']
        
        # Get current week dates
        week_start, week_end = get_week_dates()
        
        # Check if today is Friday, Saturday, or Sunday
        today = datetime.now()
        day_of_week = today.weekday()  # 0=Monday, 4=Friday, 5=Saturday, 6=Sunday
        
        can_submit = day_of_week >= 4  # Friday or later
        
        # Check if already submitted for this week
        existing_timesheet = db.timesheets.find_one({
            'employee_id': employee_id,
            'week_start': week_start
        })
        
        if existing_timesheet:
            return jsonify({
                'can_submit': False,
                'reason': f'Timesheet already submitted. Status: {existing_timesheet["status"]}',
                'timesheet_status': existing_timesheet['status'],
                'week_start': week_start,
                'week_end': week_end
            }), 200
        
        # Check if previous week timesheet is approved (if exists)
        prev_week_start, prev_week_end = get_week_dates(today - timedelta(days=7))
        prev_timesheet = db.timesheets.find_one({
            'employee_id': employee_id,
            'week_start': prev_week_start
        })
        
        if prev_timesheet and prev_timesheet.get('status') != 'approved':
            return jsonify({
                'can_submit': False,
                'reason': 'Previous week timesheet not approved yet',
                'week_start': week_start,
                'week_end': week_end
            }), 200
        
        if not can_submit:
            return jsonify({
                'can_submit': False,
                'reason': 'Timesheet can only be submitted on Friday, Saturday, or Sunday',
                'week_start': week_start,
                'week_end': week_end
            }), 200
        
        return jsonify({
            'can_submit': True,
            'week_start': week_start,
            'week_end': week_end
        }), 200
        
    except Exception as e:
        print(f"Can submit timesheet error: {e}")
        return jsonify({'error': 'An error occurred'}), 500
