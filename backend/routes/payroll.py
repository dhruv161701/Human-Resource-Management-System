from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from database import db
from bson import ObjectId

payroll_bp = Blueprint('payroll', __name__)


@payroll_bp.route('/my-payslips', methods=['GET'])
@jwt_required()
def get_my_payslips():
    """Get current employee's payslips"""
    try:
        identity = get_jwt_identity()
        employee_id = identity['employee_id']
        
        limit = int(request.args.get('limit', 12))
        
        payslips = list(db.payslips.find({
            'employee_id': employee_id
        }).sort('month_year', -1).limit(limit))
        
        result = []
        for payslip in payslips:
            result.append({
                'id': str(payslip['_id']),
                'month_year': payslip['month_year'],
                'basic': payslip.get('basic', 0),
                'hra': payslip.get('hra', 0),
                'allowances': payslip.get('allowances', 0),
                'deductions': payslip.get('deductions', 0),
                'gross_salary': payslip.get('gross_salary', 0),
                'net_salary': payslip.get('net_salary', 0),
                'status': payslip.get('status', 'Pending'),
                'paid_on': payslip.get('paid_on').isoformat() if payslip.get('paid_on') else None,
                'created_at': payslip.get('created_at').isoformat() if payslip.get('created_at') else None
            })
        
        return jsonify({'payslips': result}), 200
        
    except Exception as e:
        print(f"Get my payslips error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@payroll_bp.route('/admin/employees', methods=['GET'])
@jwt_required()
def get_payroll_employees():
    """Get all employees with salary info for payroll management"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        search = request.args.get('search', '')
        
        query = {'role': 'employee'}
        
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}},
                {'employee_id': {'$regex': search, '$options': 'i'}}
            ]
        
        employees = list(db.users.find(query))
        
        result = []
        for emp in employees:
            result.append({
                'employee_id': emp['employee_id'],
                'name': emp.get('name', ''),
                'email': emp['email'],
                'department': emp.get('department', ''),
                'job_title': emp.get('job_title', ''),
                'salary': emp.get('salary', {}),
                'is_verified': emp.get('is_verified', False)
            })
        
        return jsonify({'employees': result}), 200
        
    except Exception as e:
        print(f"Get payroll employees error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@payroll_bp.route('/admin/generate-payslip', methods=['POST'])
@jwt_required()
def generate_payslip():
    """Generate payslip for an employee"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        employee_id = data.get('employee_id')
        month_year = data.get('month_year')  # Format: YYYY-MM
        
        if not employee_id or not month_year:
            return jsonify({'error': 'Employee ID and month are required'}), 400
        
        # Get employee salary info
        employee = db.users.find_one({'employee_id': employee_id})
        
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
        
        salary = employee.get('salary', {})
        
        if not salary.get('net'):
            return jsonify({'error': 'Employee salary not configured'}), 400
        
        # Check if payslip already exists for this month
        existing = db.payslips.find_one({
            'employee_id': employee_id,
            'month_year': month_year
        })
        
        if existing:
            return jsonify({'error': f'Payslip already exists for {month_year}'}), 400
        
        # Calculate gross salary
        basic = salary.get('basic', 0)
        hra = salary.get('hra', 0)
        allowances = salary.get('allowances', 0)
        deductions = salary.get('deductions', 0)
        gross_salary = basic + hra + allowances
        net_salary = gross_salary - deductions
        
        # Create payslip
        payslip = {
            'employee_id': employee_id,
            'employee_name': employee.get('name', ''),
            'employee_email': employee.get('email', ''),
            'month_year': month_year,
            'basic': basic,
            'hra': hra,
            'allowances': allowances,
            'deductions': deductions,
            'gross_salary': gross_salary,
            'net_salary': net_salary,
            'status': 'Generated',
            'created_at': datetime.utcnow(),
            'created_by': identity.get('email') or identity.get('employee_id')
        }
        
        result = db.payslips.insert_one(payslip)
        
        return jsonify({
            'message': 'Payslip generated successfully',
            'payslip_id': str(result.inserted_id),
            'month_year': month_year,
            'net_salary': net_salary
        }), 201
        
    except Exception as e:
        print(f"Generate payslip error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@payroll_bp.route('/admin/payslips', methods=['GET'])
@jwt_required()
def get_all_payslips():
    """Get all payslips (Admin only)"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        employee_id = request.args.get('employee_id')
        month_year = request.args.get('month_year')
        status = request.args.get('status')
        limit = int(request.args.get('limit', 100))
        
        query = {}
        if employee_id:
            query['employee_id'] = employee_id
        if month_year:
            query['month_year'] = month_year
        if status:
            query['status'] = status
        
        payslips = list(db.payslips.find(query).sort('created_at', -1).limit(limit))
        
        result = []
        for payslip in payslips:
            result.append({
                'id': str(payslip['_id']),
                'employee_id': payslip['employee_id'],
                'employee_name': payslip.get('employee_name', ''),
                'month_year': payslip['month_year'],
                'basic': payslip.get('basic', 0),
                'hra': payslip.get('hra', 0),
                'allowances': payslip.get('allowances', 0),
                'deductions': payslip.get('deductions', 0),
                'gross_salary': payslip.get('gross_salary', 0),
                'net_salary': payslip.get('net_salary', 0),
                'status': payslip.get('status', 'Generated'),
                'paid_on': payslip.get('paid_on').isoformat() if payslip.get('paid_on') else None,
                'created_at': payslip.get('created_at').isoformat() if payslip.get('created_at') else None
            })
        
        return jsonify({'payslips': result}), 200
        
    except Exception as e:
        print(f"Get all payslips error: {e}")
        return jsonify({'error': 'An error occurred'}), 500


@payroll_bp.route('/admin/payslip/<payslip_id>/mark-paid', methods=['POST'])
@jwt_required()
def mark_payslip_paid(payslip_id):
    """Mark a payslip as paid"""
    try:
        identity = get_jwt_identity()
        
        if identity.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        payslip = db.payslips.find_one({'_id': ObjectId(payslip_id)})
        
        if not payslip:
            return jsonify({'error': 'Payslip not found'}), 404
        
        if payslip.get('status') == 'Paid':
            return jsonify({'error': 'Payslip already marked as paid'}), 400
        
        db.payslips.update_one(
            {'_id': ObjectId(payslip_id)},
            {'$set': {
                'status': 'Paid',
                'paid_on': datetime.utcnow(),
                'paid_by': identity.get('email') or identity.get('employee_id')
            }}
        )
        
        return jsonify({'message': 'Payslip marked as paid'}), 200
        
    except Exception as e:
        print(f"Mark payslip paid error: {e}")
        return jsonify({'error': 'An error occurred'}), 500
