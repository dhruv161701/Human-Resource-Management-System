from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from database import db
from utils.azure_openai import azure_openai_service

ai_bp = Blueprint('ai', __name__)


def get_employee_context(employee_id):
    """Get context data for an employee"""
    context = {}
    
    # Get profile
    user = db.users.find_one({'employee_id': employee_id})
    if user:
        context['profile'] = {
            'name': user.get('name', ''),
            'employee_id': user.get('employee_id', ''),
            'email': user.get('email', ''),
            'department': user.get('department', ''),
            'job_title': user.get('job_title', ''),
            'date_of_joining': user.get('date_of_joining', '')
        }
        context['salary'] = user.get('salary', {})
        context['leave_balance'] = user.get('leave_balance', {
            'paid_leave': 12,
            'sick_leave': 6,
            'unpaid_leave': 10
        })
    
    # Get recent attendance (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    attendance = list(db.attendance.find({
        'employee_id': employee_id,
        'date': {'$gte': thirty_days_ago.strftime('%Y-%m-%d')}
    }).sort('date', -1).limit(30))
    
    context['attendance'] = [{
        'date': a.get('date'),
        'status': a.get('status'),
        'check_in': a.get('check_in'),
        'check_out': a.get('check_out')
    } for a in attendance]
    
    # Get leaves
    leaves = list(db.leaves.find({
        'employee_id': employee_id
    }).sort('created_at', -1).limit(20))
    
    context['leaves'] = [{
        'leave_type': l.get('leave_type'),
        'start_date': l.get('start_date'),
        'end_date': l.get('end_date'),
        'status': l.get('status'),
        'reason': l.get('reason', '')[:100]
    } for l in leaves]
    
    return context


def get_manager_context(manager_id):
    """Get context data for a manager (team data)"""
    context = {}
    
    # Get manager info
    manager = db.users.find_one({'employee_id': manager_id})
    if not manager:
        return context
    
    manager_department = manager.get('department', '')
    
    # Get team members (employees in same department)
    team_members = list(db.users.find({
        'department': manager_department,
        'role': 'employee'
    }))
    
    context['team_members'] = [{
        'name': m.get('name', ''),
        'employee_id': m.get('employee_id', ''),
        'job_title': m.get('job_title', '')
    } for m in team_members]
    
    # Get team attendance (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    team_ids = [m['employee_id'] for m in team_members]
    
    team_attendance = list(db.attendance.find({
        'employee_id': {'$in': team_ids},
        'date': {'$gte': seven_days_ago.strftime('%Y-%m-%d')}
    }))
    
    context['team_attendance'] = [{
        'employee_id': a.get('employee_id'),
        'date': a.get('date'),
        'status': a.get('status')
    } for a in team_attendance]
    
    # Get pending leave requests
    pending_leaves = list(db.leaves.find({
        'employee_id': {'$in': team_ids},
        'status': 'Pending'
    }))
    
    context['pending_leaves'] = [{
        'employee_id': l.get('employee_id'),
        'leave_type': l.get('leave_type'),
        'start_date': l.get('start_date'),
        'end_date': l.get('end_date')
    } for l in pending_leaves]
    
    # Get pending timesheets
    pending_timesheets = list(db.timesheets.find({
        'employee_id': {'$in': team_ids},
        'status': 'Pending'
    }))
    
    context['pending_timesheets'] = [{
        'employee_id': t.get('employee_id'),
        'week_start': t.get('week_start'),
        'total_hours': t.get('total_hours', 0)
    } for t in pending_timesheets]
    
    return context


def get_admin_context():
    """Get context data for admin (organization-wide)"""
    context = {}
    
    # Total employees
    total_employees = db.users.count_documents({'role': 'employee'})
    context['total_employees'] = total_employees
    
    # Get departments
    departments = db.users.distinct('department', {'role': 'employee'})
    context['departments'] = [d for d in departments if d]
    
    # Attendance summary (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    attendance = list(db.attendance.find({
        'date': {'$gte': thirty_days_ago.strftime('%Y-%m-%d')}
    }))
    
    present_count = sum(1 for a in attendance if a.get('status') == 'Present')
    absent_count = sum(1 for a in attendance if a.get('status') == 'Absent')
    
    context['attendance_summary'] = {
        'total_records': len(attendance),
        'present': present_count,
        'absent': absent_count,
        'attendance_rate': round(present_count / len(attendance) * 100, 1) if attendance else 0
    }
    
    # Leave summary
    all_leaves = list(db.leaves.find({}))
    pending_leaves = sum(1 for l in all_leaves if l.get('status') == 'Pending')
    approved_leaves = sum(1 for l in all_leaves if l.get('status') == 'Approved')
    rejected_leaves = sum(1 for l in all_leaves if l.get('status') == 'Rejected')
    
    context['leave_summary'] = {
        'total': len(all_leaves),
        'pending': pending_leaves,
        'approved': approved_leaves,
        'rejected': rejected_leaves
    }
    
    # Payroll summary
    employees_with_salary = list(db.users.find({
        'role': 'employee',
        'salary.net': {'$exists': True, '$gt': 0}
    }))
    
    total_payroll = sum(e.get('salary', {}).get('net', 0) for e in employees_with_salary)
    context['payroll_summary'] = {
        'employees_configured': len(employees_with_salary),
        'total': total_payroll,
        'average': round(total_payroll / len(employees_with_salary), 0) if employees_with_salary else 0
    }
    
    # Recent activities
    recent_leaves = list(db.leaves.find({}).sort('created_at', -1).limit(10))
    context['recent_leave_requests'] = [{
        'employee_id': l.get('employee_id'),
        'leave_type': l.get('leave_type'),
        'status': l.get('status'),
        'start_date': l.get('start_date')
    } for l in recent_leaves]
    
    return context


@ai_bp.route('/chat', methods=['POST'])
@jwt_required()
def ai_chat():
    """AI chat endpoint for all roles"""
    try:
        identity = get_jwt_identity()
        role = identity.get('role', 'employee')
        employee_id = identity.get('employee_id')
        
        data = request.get_json()
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get context based on role
        if role == 'admin':
            context = get_admin_context()
        elif role == 'manager':
            context = get_manager_context(employee_id)
        else:
            context = get_employee_context(employee_id)
        
        # Get AI response
        response = azure_openai_service.get_hr_assistant_response(
            user_query=user_message,
            context_data=context,
            role=role
        )
        
        if 'error' in response:
            return jsonify({'error': response['error']}), 500
        
        return jsonify({
            'response': response.get('content', ''),
            'usage': response.get('usage', {})
        }), 200
        
    except Exception as e:
        print(f"AI chat error: {e}")
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/insights', methods=['POST'])
@jwt_required()
def generate_insights():
    """Generate AI insights (Admin/Manager only)"""
    try:
        identity = get_jwt_identity()
        role = identity.get('role', 'employee')
        employee_id = identity.get('employee_id')
        
        if role not in ['admin', 'manager']:
            return jsonify({'error': 'Admin or Manager access required'}), 403
        
        data = request.get_json()
        insight_type = data.get('type', 'general')  # attendance, leave, payroll, general
        
        # Get data based on role
        if role == 'admin':
            context = get_admin_context()
        else:
            context = get_manager_context(employee_id)
        
        # Generate insights
        response = azure_openai_service.generate_insights(
            data=context,
            insight_type=insight_type
        )
        
        if 'error' in response:
            return jsonify({'error': response['error']}), 500
        
        return jsonify({
            'insights': response.get('content', ''),
            'type': insight_type,
            'generated_at': datetime.utcnow().isoformat(),
            'usage': response.get('usage', {})
        }), 200
        
    except Exception as e:
        print(f"Generate insights error: {e}")
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/quick-insights', methods=['GET'])
@jwt_required()
def quick_insights():
    """Get quick dashboard insights"""
    try:
        identity = get_jwt_identity()
        role = identity.get('role', 'employee')
        
        if role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        context = get_admin_context()
        
        # Generate quick insights
        quick_prompt = f"""Based on this HR data, provide 3-4 brief bullet points of key insights:
- Total Employees: {context.get('total_employees', 0)}
- Attendance Rate: {context.get('attendance_summary', {}).get('attendance_rate', 0)}%
- Pending Leaves: {context.get('leave_summary', {}).get('pending', 0)}
- Monthly Payroll: ₹{context.get('payroll_summary', {}).get('total', 0)}

Keep each point under 15 words. Focus on actionable insights."""

        response = azure_openai_service.chat_completion(
            messages=[
                {"role": "system", "content": "You are an HR analytics assistant. Be concise and actionable."},
                {"role": "user", "content": quick_prompt}
            ],
            max_tokens=300,
            temperature=0.5
        )
        
        if 'error' in response:
            return jsonify({'error': response['error']}), 500
        
        return jsonify({
            'insights': response.get('content', ''),
            'data_summary': {
                'total_employees': context.get('total_employees', 0),
                'attendance_rate': context.get('attendance_summary', {}).get('attendance_rate', 0),
                'pending_leaves': context.get('leave_summary', {}).get('pending', 0),
                'monthly_payroll': context.get('payroll_summary', {}).get('total', 0)
            }
        }), 200
        
    except Exception as e:
        print(f"Quick insights error: {e}")
        return jsonify({'error': str(e)}), 500
