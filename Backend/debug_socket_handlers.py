#!/usr/bin/env python3
"""
Debug Socket Handlers
Enhanced socket handlers with comprehensive error logging
"""

from flask_socketio import emit, join_room, leave_room, disconnect
from flask import request
from . import socketio
from .middlewares.auth_middleware import verify_token
from .models import db, User, EventChat
from .models.user_event_association import UserEventAssociation
from datetime import datetime
import traceback
import sys

# Store active user sessions
active_users = {}
print("🔧 Debug Socket.IO handlers initialized")

def log_error(error_msg, exception=None):
    """Enhanced error logging"""
    print(f"❌ SOCKET ERROR: {error_msg}")
    if exception:
        print(f"❌ EXCEPTION: {str(exception)}")
        traceback.print_exc()
    sys.stdout.flush()

def log_info(info_msg):
    """Info logging"""
    print(f"ℹ️ SOCKET INFO: {info_msg}")
    sys.stdout.flush()

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    try:
        log_info(f"Client connected: {request.sid}")
        emit('connected', {'status': 'Connected to server', 'sid': request.sid})
    except Exception as e:
        log_error("Error in handle_connect", e)

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    try:
        log_info(f"Client disconnected: {request.sid}")
        # Remove user from active users if they were authenticated
        if request.sid in active_users:
            user_id = active_users[request.sid]
            leave_room(f'user_{user_id}')
            del active_users[request.sid]
            log_info(f"User {user_id} disconnected and removed from active users")
    except Exception as e:
        log_error("Error in handle_disconnect", e)

@socketio.on('authenticate')
def handle_authentication(data):
    """Authenticate user and join their personal room"""
    try:
        log_info(f"Authentication attempt from {request.sid}")
        
        if not data or not isinstance(data, dict):
            log_error(f"Invalid authentication data: {data}")
            emit('auth_error', {'message': 'Invalid authentication data'})
            return
        
        token = data.get('token')
        if not token:
            log_error("No token provided")
            emit('auth_error', {'message': 'Token required'})
            return
        
        log_info(f"Verifying token: {token[:20]}...")
        user_data = verify_token(token)
        if not user_data:
            log_error("Invalid token verification")
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
        
        log_info(f"User {user_data.user_id} authenticated and joined notification room")
        
    except Exception as e:
        log_error("Authentication error", e)
        emit('auth_error', {'message': 'Authentication failed'})

@socketio.on('join_event_chat')
def handle_join_event_chat(data):
    """Join event-specific chat room"""
    try:
        log_info(f"Join event chat request from {request.sid}")
        
        if request.sid not in active_users:
            log_error("User not authenticated for join_event_chat")
            emit('error', {'message': 'Not authenticated'})
            return
        
        event_id = data.get('event_id')
        chat_type = data.get('chat_type', 'organizer_admin')
        
        if not event_id:
            log_error("No event ID provided")
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
        
        log_info(f"User {active_users[request.sid]} joined event chat room {event_room}")
        
    except Exception as e:
        log_error("Error joining event chat room", e)
        emit('error', {'message': 'Failed to join event chat room'})

@socketio.on('send_event_message')
def handle_send_event_message(data, callback=None):
    """Send message to event chat"""
    try:
        log_info(f"Send event message request from {request.sid}")
        
        if request.sid not in active_users:
            log_error("User not authenticated for send_event_message")
            if callback: 
                callback({'error': 'Not authenticated'})
            return
        
        user_id = active_users[request.sid]
        event_id = data.get('event_id')
        chat_type = data.get('chat_type', 'organizer_admin')
        message_text = data.get('message')

        log_info(f"Sending event message: event_id={event_id}, chat_type={chat_type}, user_id={user_id}")

        if not all([event_id, chat_type, message_text]):
            log_error("Missing required fields for message")
            if callback: 
                callback({'error': 'Missing required fields'})
            return
        
        # Get user object
        user_obj = User.query.get(user_id)
        if not user_obj:
            log_error(f"User {user_id} not found in database")
            if callback:
                callback({'error': 'User not found'})
            return
        
        # Check if user is admin - consistent check
        is_admin = user_obj and hasattr(user_obj, 'admin') and user_obj.admin
        log_info(f"User {user_id} admin status: {is_admin}")
        
        if not is_admin:
            # For non-admin users, check event association
            user_association = UserEventAssociation.query.filter_by(
                user_id=user_id,
                event_id=event_id
            ).first()

            if not user_association:
                log_error(f"User {user_id} not associated with event {event_id}")
                if callback: 
                    callback({'error': 'Access denied - not associated with event'})
                return

            user_role = user_association.role
            log_info(f"User {user_id} role in event {event_id}: {user_role}")

            # Role-based access control
            if chat_type == 'organizer_admin':
                if user_role != 'organizer':
                    log_error(f"User {user_id} denied organizer access")
                    if callback: 
                        callback({'error': 'Access denied - organizer access required'})
                    return
            elif chat_type == 'organizer_volunteer':
                if user_role not in ['organizer', 'volunteer']:
                    log_error(f"User {user_id} denied organizer/volunteer access")
                    if callback: 
                        callback({'error': 'Access denied - organizer or volunteer access required'})
                    return
            elif chat_type == 'attendee_only':
                if user_role not in ['organizer', 'volunteer', 'attendee']:
                    log_error(f"User {user_id} denied attendee access")
                    if callback: 
                        callback({'error': 'Access denied - not registered for event'})
                    return
        
        # Save message to database
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
            
            log_info(f"Message saved to database: {new_message.id}")
            
        except Exception as e:
            db.session.rollback()
            log_error("Failed to save chat message", e)
            if callback:
                callback({'error': 'Failed to save message'})
            return
        
        # Get sender details
        sender_name = None
        if user_obj:
            if hasattr(user_obj, 'student') and user_obj.student:
                sender_name = user_obj.student.full_name
            elif hasattr(user_obj, 'faculty') and user_obj.faculty:
                sender_name = user_obj.faculty.full_name
            elif hasattr(user_obj, 'admin') and user_obj.admin:
                sender_name = user_obj.admin.full_name
            else:
                # Use the full_name property from User model
                sender_name = getattr(user_obj, 'full_name', 'Unknown')

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
        
        log_info(f"Message emitted to room {event_room}")
        
        if callback: 
            callback(message_data)
        
    except Exception as e:
        db.session.rollback()
        log_error("Error in send_event_message", e)
        if callback: 
            callback({'error': str(e)})

@socketio.on('typing_event')
def handle_typing_event(data):
    """Handle typing indicator for event chat"""
    try:
        if request.sid not in active_users:
            return
        
        user_id = active_users[request.sid]
        event_id = data.get('event_id')
        chat_type = data.get('chat_type', 'organizer_admin')
        is_typing = data.get('is_typing', False)
        
        if not event_id:
            return
        
        # Emit typing indicator to event chat room
        event_room = f'event_{event_id}_{chat_type}'
        emit('user_typing_event', {
            'user_id': user_id,
            'is_typing': is_typing
        }, room=event_room, include_self=False)
        
        log_info(f"Typing event: user {user_id}, room {event_room}, typing: {is_typing}")
        
    except Exception as e:
        log_error("Error handling typing event", e)

print("🔧 Debug socket handlers loaded successfully")