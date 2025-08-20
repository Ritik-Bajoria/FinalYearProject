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