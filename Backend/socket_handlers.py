"""
Socket.IO event handlers for real-time notifications
"""

from flask_socketio import emit, join_room, leave_room, disconnect
from flask import request
from . import socketio
from .middlewares.auth_middleware import verify_token

# Store active user sessions
active_users = {}
print("Socket.IO handlers initialized")

@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")
    """Handle client connection"""
    print(f"Client connected: {request.sid}")
    emit('connected', {'status': 'Connected to notification server'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"Client disconnected: {request.sid}")
    # Remove user from active users if they were authenticated
    if request.sid in active_users:
        user_id = active_users[request.sid]
        leave_room(f'user_{user_id}')
        del active_users[request.sid]
        print(f"User {user_id} disconnected and removed from active users")

@socketio.on('authenticate')
def handle_authentication(data):
    """Authenticate user and join their personal room"""
    try:
        token = data.get('token')
        if not token:
            emit('auth_error', {'message': 'Token required'})
            return
        
        # Verify the token
        user_data = verify_token(token)
        if not user_data:
            emit('auth_error', {'message': 'Invalid token'})
            return
        
        # Store user session
        active_users[request.sid] = user_data.user_id
        
        # Join user-specific room for targeted notifications
        join_room(f'user_{user_data.user_id}')
        
        emit('authenticated', {
            'success': True,
            'user_id': user_data.user_id,
            'message': 'Successfully authenticated for notifications'
        })
        
        print(f"User {user_data.user_id} authenticated and joined notification room")
        
    except Exception as e:
        print(f"Authentication error: {str(e)}")
        emit('auth_error', {'message': 'Authentication failed'})

@socketio.on('join_club_room')
def handle_join_club_room(data):
    """Join club-specific room for club notifications"""
    try:
        if request.sid not in active_users:
            emit('error', {'message': 'Not authenticated'})
            return
        
        club_id = data.get('club_id')
        if not club_id:
            emit('error', {'message': 'Club ID required'})
            return
        
        # Join club room
        club_room = f'club_{club_id}'
        join_room(club_room)
        
        emit('joined_club_room', {
            'club_id': club_id,
            'room': club_room,
            'message': f'Joined club {club_id} notification room'
        })
        
        print(f"User {active_users[request.sid]} joined club room {club_room}")
        
    except Exception as e:
        print(f"Error joining club room: {str(e)}")
        emit('error', {'message': 'Failed to join club room'})

@socketio.on('leave_club_room')
def handle_leave_club_room(data):
    """Leave club-specific room"""
    try:
        if request.sid not in active_users:
            emit('error', {'message': 'Not authenticated'})
            return
        
        club_id = data.get('club_id')
        if not club_id:
            emit('error', {'message': 'Club ID required'})
            return
        
        # Leave club room
        club_room = f'club_{club_id}'
        leave_room(club_room)
        
        emit('left_club_room', {
            'club_id': club_id,
            'room': club_room,
            'message': f'Left club {club_id} notification room'
        })
        
        print(f"User {active_users[request.sid]} left club room {club_room}")
        
    except Exception as e:
        print(f"Error leaving club room: {str(e)}")
        emit('error', {'message': 'Failed to leave club room'})

# Event Chat Handlers
@socketio.on('join_event_chat')
def handle_join_event_chat(data):
    """Join event-specific chat room"""
    try:
        if request.sid not in active_users:
            emit('error', {'message': 'Not authenticated'})
            return
        
        event_id = data.get('event_id')
        chat_type = data.get('chat_type', 'organizer_admin')
        
        if not event_id:
            emit('error', {'message': 'Event ID required'})
            return
        
        # Join event chat room
        event_room = f'event_{event_id}_{chat_type}'
        join_room(event_room)
        
        emit('joined_chat', {
            'event_id': event_id,
            'chat_type': chat_type,
            'room': event_room,
            'message': f'Joined event {event_id} chat room'
        })
        
        print(f"User {active_users[request.sid]} joined event chat room {event_room}")
        
    except Exception as e:
        print(f"Error joining event chat room: {str(e)}")
        emit('error', {'message': 'Failed to join event chat room'})

@socketio.on('send_event_message')
def handle_send_event_message(data, callback=None):
    """Send message to event chat"""
    try:
        if request.sid not in active_users:
            if callback: 
                callback({'error': 'Not authenticated'})
            return
        
        user_id = active_users[request.sid]
        event_id = data.get('event_id')
        chat_type = data.get('chat_type', 'organizer_admin')
        message_text = data.get('message')

        print(f"Sending event message: event_id={event_id}, chat_type={chat_type}, user_id={user_id}")

        if not all([event_id, chat_type, message_text]):
            if callback: 
                callback({'error': 'Missing required fields'})
            return
        
        # Check access permissions
        from .models.user_event_association import UserEventAssociation
        from .models import User
        
        # Check if user is admin
        user_obj = User.query.get(user_id)
        if user_obj and user_obj.admin:
            # Admins can access all chat types
            pass
        else:
            # Check user's role in the event
            user_association = UserEventAssociation.query.filter_by(
                user_id=user_id,
                event_id=event_id
            ).first()

            if not user_association:
                if callback: 
                    callback({'error': 'Access denied'})
                return

            user_role = user_association.role

            if chat_type == 'organizer_admin':
                if user_role != 'organizer':
                    if callback: 
                        callback({'error': 'Access denied'})
                    return
            elif chat_type == 'organizer_volunteer':
                if user_role not in ['organizer', 'volunteer']:
                    if callback: 
                        callback({'error': 'Access denied'})
                    return
            elif chat_type == 'attendee_only':
                if user_role not in ['organizer', 'volunteer', 'attendee']:
                    if callback: 
                        callback({'error': 'Access denied'})
                    return
        
        # Save message to database
        from .models.event_chat import EventChat
        from .models import db
        from datetime import datetime
        
        try:
            new_message = EventChat(
                event_id=event_id,
                sender_id=user_id,
                message=message_text,
                chat_type=chat_type,
                timestamp=datetime.utcnow()
            )
            
            db.session.add(new_message)
            db.session.commit()
            
            print(f"Message saved to database: {new_message.id}")
            
        except Exception as e:
            db.session.rollback()
            print(f"Failed to save chat message: {str(e)}")
            if callback:
                callback({'error': 'Failed to save message'})
            return
        
        # Get sender details
        sender_name = None
        if user_obj:
            if user_obj.student:
                sender_name = user_obj.student.full_name
            elif user_obj.faculty:
                sender_name = user_obj.faculty.full_name
            elif user_obj.admin:
                sender_name = user_obj.admin.full_name

        # Prepare message data
        message_data = {
            'id': new_message.id,
            'event_id': new_message.event_id,
            'sender_id': new_message.sender_id,
            'sender_name': sender_name or "Unknown",
            'message': new_message.message,
            'chat_type': new_message.chat_type,
            'timestamp': new_message.timestamp.isoformat()
        }
        
        # Emit to event chat room
        event_room = f'event_{event_id}_{chat_type}'
        emit('new_event_message', message_data, room=event_room)
        
        print(f"Message emitted to room {event_room}")
        
        if callback: 
            callback(message_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in send_event_message: {str(e)}")
        if callback: 
            callback({'error': str(e)})

@socketio.on('typing_event')
def handle_typing_event(data):
    """Handle typing indicator for event chat"""
    try:
        if request.sid not in active_users:
            return
        
        event_id = data.get('event_id')
        chat_type = data.get('chat_type', 'organizer_admin')
        is_typing = data.get('is_typing', False)
        
        if not event_id:
            return
        
        # Emit typing indicator to event chat room
        event_room = f'event_{event_id}_{chat_type}'
        emit('user_typing_event', {
            'user_id': active_users[request.sid],
            'is_typing': is_typing
        }, room=event_room, include_self=False)
        
    except Exception as e:
        print(f"Error handling typing event: {str(e)}")

@socketio.on('request_unread_count')
def handle_unread_count_request():
    """Send current unread notification count to user"""
    try:
        if request.sid not in active_users:
            emit('error', {'message': 'Not authenticated'})
            return
        
        user_id = active_users[request.sid]
        
        # Get unread count from database
        from .models.notification import Notification
        unread_count = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).count()
        
        emit('unread_count_update', {'count': unread_count})
        
    except Exception as e:
        print(f"Error getting unread count: {str(e)}")
        emit('error', {'message': 'Failed to get unread count'})

# Utility functions for broadcasting notifications
def broadcast_to_user(user_id, event_name, data):
    """Broadcast event to specific user"""
    try:
        socketio.emit(event_name, data, room=f'user_{user_id}')
        print(f"Broadcasted {event_name} to user {user_id}")
    except Exception as e:
        print(f"Failed to broadcast to user {user_id}: {str(e)}")

def broadcast_to_club(club_id, event_name, data):
    """Broadcast event to all users in a club room"""
    try:
        socketio.emit(event_name, data, room=f'club_{club_id}')
        print(f"Broadcasted {event_name} to club {club_id}")
    except Exception as e:
        print(f"Failed to broadcast to club {club_id}: {str(e)}")

def broadcast_to_all(event_name, data):
    """Broadcast event to all connected users"""
    try:
        socketio.emit(event_name, data, broadcast=True)
        print(f"Broadcasted {event_name} to all users")
    except Exception as e:
        print(f"Failed to broadcast to all users: {str(e)}")

def notify_user_realtime(user_id, notification_data):
    """Send real-time notification to specific user"""
    broadcast_to_user(user_id, 'new_notification', notification_data)
    
    # Also send unread count update
    try:
        from .models.notification import Notification
        unread_count = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).count()
        broadcast_to_user(user_id, 'unread_count_update', {'count': unread_count})
    except Exception as e:
        print(f"Failed to update unread count for user {user_id}: {str(e)}")

def notify_club_realtime(club_id, notification_data):
    """Send real-time notification to all club members"""
    broadcast_to_club(club_id, 'club_notification', notification_data)