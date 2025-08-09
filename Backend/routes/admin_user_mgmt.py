from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
from ..models import db, User, Student, Faculty, Admin, Event, EventRegistration, SystemLog, Club
from ..middlewares.auth_middleware import token_required, admin_required
import csv
from io import StringIO
from ..utils.log_action import log_action

admin_user_bp = Blueprint('admin_user', __name__, url_prefix='/admin')

# User Management
@admin_user_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def get_users(current_user):
    page = request.args.get('page', default=1, type=int)
    limit = request.args.get('limit', default=10, type=int)
    search = request.args.get('search', default='', type=str)
    role = request.args.get('role', default=None, type=str)
    status = request.args.get('status', default=None, type=str)
    
    query = User.query
    
    if search:
        query = query.join(Student).filter(
            Student.full_name.ilike(f'%{search}%') |
            User.email.ilike(f'%{search}%')
        )
    
    if role:
        if role == 'student':
            query = query.filter(User.student != None)
        elif role == 'faculty':
            query = query.filter(User.faculty != None)
        elif role == 'admin':
            query = query.filter(User.admin != None)
    
    if status:
        if status == 'active':
            query = query.filter(User.is_active == True)
        elif status == 'banned':
            query = query.filter(User.is_active == False)
    
    paginated_users = query.paginate(page=page, per_page=limit, error_out=False)
    
    users = []
    for user in paginated_users.items:
        user_data = {
            'user_id': user.user_id,
            'email': user.email,
            'created_at': user.created_at,
            'is_active': user.is_active
        }
        
        if user.student:
            user_data.update({
                'full_name': user.student.full_name,
                'role': 'student',
                'user_id': user.student.student_id_number
            })
        elif user.faculty:
            user_data.update({
                'full_name': user.faculty.full_name,
                'role': 'faculty',
                'department': user.faculty.department
            })
        elif user.admin:
            user_data.update({
                'full_name': user.admin.full_name,
                'role': 'admin',
                'admin_role': user.admin.admin_role
            })
            
        users.append(user_data)
    
    return jsonify({
        'users': users,
        'total': paginated_users.total,
        'pages': paginated_users.pages,
        'currentPage': page
    })

@admin_user_bp.route('/users/<int:user_id>/status', methods=['PATCH'])
@token_required
@admin_required
def update_user_status(current_user, user_id):  # Accept current_user first, then route parameter
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided',
                'status_code': 400
            }), 400

        status = data.get('status')
        
        if status not in ['active', 'banned']:
            return jsonify({
                'success': False,
                'error': 'Invalid status. Must be "active" or "banned"',
                'status_code': 400
            }), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found',
                'status_code': 404
            }), 404
        
        # Update status
        user.is_active = (status == 'active')
        db.session.commit()
        
        # Log the action
        action = 'ACTIVATED' if status == 'active' else 'BANNED'
        log_action(
            current_user.user_id, 
            'USER_STATUS_CHANGE', 
            f'Changed user {user_id} status to {status}',
            'info'
        )
        
        return jsonify({
            'success': True,
            'message': f'User status updated to {status}',
            'user_id': user_id,
            'new_status': status
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e),
            'status_code': 500
        }), 500

@admin_user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    db.session.delete(user)
    db.session.commit()
    
    log_action(current_user.user_id, 'USER_DELETED', f'Deleted user {user_id}')
    
    return jsonify({'message': 'User deleted successfully'})

@admin_user_bp.route('/users/export', methods=['GET'])
@token_required
@admin_required
def export_users():
    users = User.query.all()
    
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'User ID', 'Email', 'Full Name', 'Role', 
        'Status', 'Created At', 'Last Login'
    ])
    
    # Write data
    for user in users:
        full_name = ''
        role = ''
        
        if user.student:
            full_name = user.student.full_name
            role = 'Student'
        elif user.faculty:
            full_name = user.faculty.full_name
            role = 'Faculty'
        elif user.admin:
            full_name = user.admin.full_name
            role = 'Admin'
        
        writer.writerow([
            user.user_id,
            user.email,
            full_name,
            role,
            'Active' if user.is_active else 'Banned',
            user.created_at,
            user.last_login
        ])
    
    output.seek(0)
    
    log_action(current_user.user_id, 'USER_EXPORT', 'Exported user data')
    
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=users_export.csv"}
    )