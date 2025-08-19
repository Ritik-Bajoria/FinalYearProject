from ..models.notification import Notification, NotificationType
from .. import db
from datetime import datetime

def create_notification(user_id, message, notification_type=NotificationType.GENERAL, 
                       related_club_id=None, related_event_id=None, related_user_id=None):
    """
    Create a new notification for a user
    
    Args:
        user_id: ID of the user to notify
        message: Notification message
        notification_type: Type of notification (NotificationType enum)
        related_club_id: Related club ID (optional)
        related_event_id: Related event ID (optional)
        related_user_id: Related user ID (optional)
    
    Returns:
        Created notification object
    """
    try:
        notification = Notification(
            user_id=user_id,
            message=message,
            notification_type=notification_type,
            related_club_id=related_club_id,
            related_event_id=related_event_id,
            related_user_id=related_user_id,
            created_at=datetime.utcnow()
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return notification
    except Exception as e:
        db.session.rollback()
        raise e

def create_club_join_notification(club, requester, approved_by=None):
    """Create notification when someone joins a club"""
    if approved_by:
        message = f"Your request to join {club.name} has been approved by {approved_by.full_name}"
        notification_type = NotificationType.CLUB_JOIN_APPROVED
    else:
        message = f"New member {requester.full_name} has joined {club.name}"
        notification_type = NotificationType.CLUB_JOIN_REQUEST
    
    return create_notification(
        user_id=requester.user_id,
        message=message,
        notification_type=notification_type,
        related_club_id=club.club_id,
        related_user_id=approved_by.user_id if approved_by else None
    )

def create_event_notification(event, user_id, message_type="created"):
    """Create notification for event-related activities"""
    if message_type == "created":
        message = f"New event '{event.title}' has been created"
        notification_type = NotificationType.EVENT_CREATED.value
    elif message_type == "approved":
        message = f"Your event '{event.title}' has been approved and is now live!"
        notification_type = NotificationType.EVENT_APPROVED
    elif message_type == "rejected":
        message = f"Your event '{event.title}' has been rejected"
        notification_type = NotificationType.EVENT_REJECTED
    elif message_type == "reminder":
        message = f"Reminder: '{event.title}' is starting soon"
        notification_type = NotificationType.EVENT_REMINDER
    else:
        message = f"Update on event '{event.title}'"
        notification_type = NotificationType.EVENT_UPDATED
    
    return create_notification(
        user_id=user_id,
        message=message,
        notification_type=notification_type,
        related_event_id=event.event_id
    )

def create_event_notification_for_club_members(event, club):
    """Create notifications for all club members about a new event"""
    from ..models.association_tables import user_club_association, ClubMembershipStatus
    from ..models.user import User
    
    try:
        # Get all approved members of the club
        approved_members = db.session.query(User).join(
            user_club_association,
            User.user_id == user_club_association.c.user_id
        ).filter(
            user_club_association.c.club_id == club.club_id,
            user_club_association.c.status == ClubMembershipStatus.APPROVED.value
        ).all()
        
        # Create notifications for all members except the event creator
        notifications_created = 0
        for member in approved_members:
            if member.user_id != event.created_by:  # Don't notify the creator
                try:
                    create_notification(
                        user_id=member.user_id,
                        message=f"New event '{event.title}' has been created in {club.name}! 📅",
                        notification_type=NotificationType.EVENT_CREATED.value,
                        related_event_id=event.event_id,
                        related_club_id=club.club_id
                    )
                    notifications_created += 1
                except Exception as e:
                    print(f"Failed to create notification for user {member.user_id}: {str(e)}")
                    continue
        
        print(f"Created {notifications_created} notifications for event '{event.title}'")
        return notifications_created
        
    except Exception as e:
        print(f"Error creating event notifications: {str(e)}")
        return 0

def create_event_notification_for_all_users(event, club=None):
    """Create notifications for all users about a new public event"""
    from ..models.user import User
    
    try:
        # Get all active users
        all_users = User.query.filter_by(is_active=True).all()
        
        # Create notifications for all users except the event creator
        notifications_created = 0
        for user in all_users:
            if user.user_id != event.created_by:  # Don't notify the creator
                try:
                    if club:
                        message = f"🎉 New event '{event.title}' by {club.name} is now available!"
                    else:
                        message = f"🎉 New event '{event.title}' is now available!"
                    
                    create_notification(
                        user_id=user.user_id,
                        message=message,
                        notification_type=NotificationType.EVENT_CREATED.value,
                        related_event_id=event.event_id,
                        related_club_id=club.club_id if club else None
                    )
                    notifications_created += 1
                except Exception as e:
                    print(f"Failed to create notification for user {user.user_id}: {str(e)}")
                    continue
        
        print(f"Created {notifications_created} public notifications for event '{event.title}'")
        return notifications_created
        
    except Exception as e:
        print(f"Error creating public event notifications: {str(e)}")
        return 0

def create_event_reminder_notifications(event):
    """Create reminder notifications for event participants"""
    from ..models.event_registration import EventRegistration
    from ..models.user import User
    
    try:
        # Get all registered users for the event
        registrations = EventRegistration.query.filter_by(event_id=event.event_id).all()
        
        notifications_created = 0
        for registration in registrations:
            try:
                create_notification(
                    user_id=registration.user_id,
                    message=f"⏰ Reminder: '{event.title}' is starting soon! Don't forget to attend.",
                    notification_type=NotificationType.EVENT_REMINDER,
                    related_event_id=event.event_id
                )
                notifications_created += 1
            except Exception as e:
                print(f"Failed to create reminder for user {registration.user_id}: {str(e)}")
                continue
        
        print(f"Created {notifications_created} reminder notifications for event '{event.title}'")
        return notifications_created
        
    except Exception as e:
        print(f"Error creating event reminders: {str(e)}")
        return 0

def create_admin_notification(message, notification_type=NotificationType.SYSTEM_ALERT, related_event_id=None, related_club_id=None, related_user_id=None):
    """Create notifications for all admins"""
    from ..models.user import User
    from ..models.admin import Admin
    
    try:
        # Get all admin users
        admin_users = db.session.query(User).join(Admin, User.user_id == Admin.user_id).all()
        
        notifications_created = 0
        for admin_user in admin_users:
            try:
                create_notification(
                    user_id=admin_user.user_id,
                    message=message,
                    notification_type=notification_type,
                    related_event_id=related_event_id,
                    related_club_id=related_club_id,
                    related_user_id=related_user_id
                )
                notifications_created += 1
            except Exception as e:
                print(f"Failed to create admin notification for user {admin_user.user_id}: {str(e)}")
                continue
        
        print(f"Created {notifications_created} admin notifications")
        return notifications_created
        
    except Exception as e:
        print(f"Error creating admin notifications: {str(e)}")
        return 0

def broadcast_notification_realtime(user_id, notification_data):
    """Broadcast notification to user via Socket.IO"""
    try:
        from .. import socketio
        socketio.emit('new_notification', notification_data, room=f'user_{user_id}')
        print(f"Broadcasted notification to user {user_id}")
    except Exception as e:
        print(f"Failed to broadcast notification: {str(e)}")

def create_and_broadcast_notification(user_id, message, notification_type=NotificationType.GENERAL, 
                                    related_club_id=None, related_event_id=None, related_user_id=None):
    """Create notification and broadcast it in real-time"""
    try:
        # Create the notification
        notification = create_notification(
            user_id=user_id,
            message=message,
            notification_type=notification_type,
            related_club_id=related_club_id,
            related_event_id=related_event_id,
            related_user_id=related_user_id
        )
        
        # Prepare notification data for real-time broadcast
        notification_data = {
            'id': notification.notification_id,
            'message': notification.message,
            'type': notification.notification_type.value,
            'read': notification.is_read,
            'time': 'Just now',
            'created_at': notification.created_at.isoformat(),
            'related_club_id': notification.related_club_id,
            'related_event_id': notification.related_event_id,
            'related_user_id': notification.related_user_id
        }
        
        # Broadcast in real-time
        broadcast_notification_realtime(user_id, notification_data)
        
        return notification
        
    except Exception as e:
        print(f"Error creating and broadcasting notification: {str(e)}")
        return None