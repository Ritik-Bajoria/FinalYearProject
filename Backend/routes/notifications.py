from flask import Blueprint, request, jsonify
from ..middlewares.auth_middleware import token_required
from ..models.notification import Notification, NotificationType
from ..models.user import User
from ..utils.response_utils import make_response
from .. import db
from datetime import datetime

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/notifications', methods=['GET'])
@token_required
def get_notifications(current_user):
    """Get all notifications for the current user"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        query = Notification.query.filter_by(user_id=current_user.user_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        notifications = query.order_by(Notification.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        result = []
        for notification in notifications.items:
            # Format time in a more user-friendly way
            import time
            from datetime import datetime, timedelta
            
            now = datetime.utcnow()
            created_at = notification.created_at
            time_diff = now - created_at
            
            if time_diff.days > 0:
                time_str = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
            elif time_diff.seconds > 3600:
                hours = time_diff.seconds // 3600
                time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
            elif time_diff.seconds > 60:
                minutes = time_diff.seconds // 60
                time_str = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            else:
                time_str = "Just now"
            
            result.append({
                'id': notification.notification_id,
                'message': notification.message,
                'type': notification.notification_type.value if notification.notification_type else 'general',
                'read': notification.is_read,
                'time': time_str,
                'created_at': notification.created_at.isoformat(),
                'related_club_id': notification.related_club_id,
                'related_event_id': notification.related_event_id,
                'related_user_id': notification.related_user_id
            })
        
        return make_response(
            data={
                'notifications': result,
                'total': notifications.total,
                'pages': notifications.pages,
                'current_page': notifications.page,
                'has_next': notifications.has_next,
                'has_prev': notifications.has_prev
            },
            message="Notifications retrieved successfully"
        )
        
    except Exception as e:
        return make_response(error=str(e), status_code=500)

@notifications_bp.route('/notifications/unread-count', methods=['GET'])
@token_required
def get_unread_count(current_user):
    """Get count of unread notifications"""
    try:
        count = Notification.query.filter_by(
            user_id=current_user.user_id,
            is_read=False
        ).count()
        
        return make_response(
            data={'unread_count': count},
            message="Unread count retrieved successfully"
        )
        
    except Exception as e:
        return make_response(error=str(e), status_code=500)

@notifications_bp.route('/notifications/<int:notification_id>/mark-read', methods=['PUT'])
@token_required
def mark_notification_read(current_user, notification_id):
    """Mark a specific notification as read"""
    try:
        notification = Notification.query.filter_by(
            notification_id=notification_id,
            user_id=current_user.user_id
        ).first()
        
        if not notification:
            return make_response(error="Notification not found", status_code=404)
        
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.session.commit()
        
        return make_response(message="Notification marked as read")
        
    except Exception as e:
        db.session.rollback()
        return make_response(error=str(e), status_code=500)

@notifications_bp.route('/notifications/mark-all-read', methods=['PUT'])
@token_required
def mark_all_notifications_read(current_user):
    """Mark all notifications as read for the current user"""
    try:
        notifications = Notification.query.filter_by(
            user_id=current_user.user_id,
            is_read=False
        ).all()
        
        for notification in notifications:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
        
        db.session.commit()
        
        return make_response(
            message=f"Marked {len(notifications)} notifications as read"
        )
        
    except Exception as e:
        db.session.rollback()
        return make_response(error=str(e), status_code=500)

@notifications_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@token_required
def delete_notification(current_user, notification_id):
    """Delete a specific notification"""
    try:
        notification = Notification.query.filter_by(
            notification_id=notification_id,
            user_id=current_user.user_id
        ).first()
        
        if not notification:
            return make_response(error="Notification not found", status_code=404)
        
        db.session.delete(notification)
        db.session.commit()
        
        return make_response(message="Notification deleted successfully")
        
    except Exception as e:
        db.session.rollback()
        return make_response(error=str(e), status_code=500)

@notifications_bp.route('/notifications/create', methods=['POST'])
@token_required
def create_notification_endpoint(current_user):
    """Create a new notification (for testing purposes)"""
    try:
        data = request.get_json()
        
        notification = Notification(
            user_id=data.get('user_id', current_user.user_id),
            message=data.get('message', 'Test notification'),
            notification_type=NotificationType(data.get('type', 'GENERAL')),
            related_club_id=data.get('related_club_id'),
            related_event_id=data.get('related_event_id'),
            related_user_id=data.get('related_user_id')
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return make_response(
            data={'notification_id': notification.notification_id},
            message="Notification created successfully",
            status_code=201
        )
        
    except Exception as e:
        db.session.rollback()
        return make_response(error=str(e), status_code=500)

@notifications_bp.route('/notifications/create-samples', methods=['POST'])
@token_required
def create_sample_notifications(current_user):
    """Create sample notifications for testing"""
    try:
        sample_notifications = [
            {
                'message': "🎉 Welcome to the University Event Hub! Start exploring events and clubs.",
                'type': NotificationType.GENERAL
            },
            {
                'message': "📅 New event 'Tech Conference 2024' has been created in Computer Science Club!",
                'type': NotificationType.EVENT_CREATED.value
            },
            {
                'message': "✅ Your request to join Photography Club has been approved! Welcome to the club!",
                'type': NotificationType.CLUB_JOIN_APPROVED
            },
            {
                'message': "⏰ Reminder: 'Annual Sports Meet' registration ends tomorrow",
                'type': NotificationType.EVENT_REMINDER
            },
            {
                'message': "📢 New academic announcement from the Dean's office",
                'type': NotificationType.SYSTEM_ALERT
            }
        ]
        
        created_count = 0
        for sample in sample_notifications:
            notification = Notification(
                user_id=current_user.user_id,
                message=sample['message'],
                notification_type=sample['type']
            )
            db.session.add(notification)
            created_count += 1
        
        db.session.commit()
        
        return make_response(
            data={'created_count': created_count},
            message=f"Created {created_count} sample notifications",
            status_code=201
        )
        
    except Exception as e:
        db.session.rollback()
        return make_response(error=str(e), status_code=500)