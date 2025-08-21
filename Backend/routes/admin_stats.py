from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
from ..models import db, User, Student, Faculty, Admin, Event, EventRegistration, SystemLog, Club
from ..middlewares.auth_middleware import token_required, admin_required
import csv
from io import StringIO

admin_stats_bp = Blueprint('admin_stats', __name__, url_prefix='/admin')


# 2. Dashboard Statistics
@admin_stats_bp.route('/dashboard/stats', methods=['GET'])
# @token_required
# @admin_required
def dashboard_stats():
    total_users = User.query.count()
    active_events = Event.query.filter(Event.event_date >= datetime.utcnow()).count()
    pending_approvals = Event.query.filter_by(approval_status='pending').count()
    
    # Count system alerts (example: recent errors)
    system_alerts = SystemLog.query.filter(
        SystemLog.action_type == 'ERROR',
        SystemLog.timestamp >= (datetime.utcnow() - timedelta(days=1))
    ).count()
    
    return jsonify({
        'totalUsers': total_users,
        'activeEvents': active_events,
        'pendingApprovals': pending_approvals,
        'systemAlerts': system_alerts
    })

@admin_stats_bp.route('/users/recent', methods=['GET'])
# @token_required
# @admin_required
def recent_users():
    limit = request.args.get('limit', default=3, type=int)
    users = User.query.order_by(User.created_at.desc()).limit(limit).all()
    
    result = []
    for user in users:
        user_data = {
            'user_id': user.user_id,
            'email': user.email,
            'created_at': user.created_at,
            'is_active': user.is_active
        }
        
        # Add role-specific info
        if user.student:
            user_data['full_name'] = user.student.full_name
            user_data['role'] = 'student'
        elif user.faculty:
            user_data['full_name'] = user.faculty.full_name
            user_data['role'] = 'faculty'
        elif user.admin:
            user_data['full_name'] = user.admin.full_name
            user_data['role'] = 'admin'
            
        result.append(user_data)
    
    return jsonify({'users': result})

@admin_stats_bp.route('/events/recent', methods=['GET'])
# @token_required
# @admin_required
def recent_events():
    limit = request.args.get('limit', default=3, type=int)
    events = Event.query.order_by(Event.created_at.desc()).limit(limit).all()
    
    result = []
    for event in events:
        organizer = User.query.get(event.created_by)
        organizer_name = None
        if organizer:
            if organizer.student:
                organizer_name = organizer.student.full_name
            elif organizer.faculty:
                organizer_name = organizer.faculty.full_name
            elif organizer.admin:
                organizer_name = organizer.admin.full_name
        
        result.append({
            'event_id': event.event_id,
            'title': event.title,
            'organizer_name': organizer_name,
            'event_date': event.event_date,
            'status': event.approval_status,
            'registered_count': EventRegistration.query.filter_by(event_id=event.event_id).count()
        })
    
    return jsonify({'events': result})