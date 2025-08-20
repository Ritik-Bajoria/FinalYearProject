# event_chat_socket.py (UNUSED)
from flask import request
from flask_socketio import emit, join_room, leave_room
from datetime import datetime
from .. import socketio, db
from .models.event_chat import EventChat
from .models.user import User
from .middlewares.auth_middleware import verify_token

# Store typing status and active users for event chats
event_chat_typing = {}
event_chat_users = {}

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"Client disconnected: {request.sid}")
    # Clean up typing status
    for room in list(event_chat_typing.keys()):
        if request.sid in event_chat_typing[room]:
            del event_chat_typing[room][request.sid]
            emit_typing_status(room)

@socketio.on('authenticate')
def handle_authentication(data):
    """Verify user token and register their connection"""
    try:
        user_data = verify_token(data.get('token'))
        if user_data:
            event_chat_users[request.sid] = user_data.user_id
            emit('authenticated', {'success': True})
            return
        emit('error', {'message': 'Invalid token'})
    except Exception as e:
        emit('error', {'message': str(e)})

@socketio.on('join_event_chat')
def handle_join_event_chat(data):
    """Join a specific event chat room"""
    try:
        if request.sid not in event_chat_users:
            emit('error', {'message': 'Not authenticated'})
            return
            
        event_id = data.get('event_id')
        chat_type = data.get('chat_type')
        
        if not event_id or not chat_type:
            emit('error', {'message': 'Event ID and chat type required'})
            return
        
        room = f"event_{event_id}_{chat_type}"
        join_room(room)
        
        # Initialize typing status for this room if needed
        if room not in event_chat_typing:
            event_chat_typing[room] = {}
        
        emit('joined_chat', {
            'room': room,
            'message': f'Joined {chat_type} chat for event {event_id}'
        })
        
    except Exception as e:
        emit('error', {'message': str(e)})

@socketio.on('send_event_message')
def handle_send_event_message(data):
    """Handle sending a message to event chat"""
    try:
        if request.sid not in event_chat_users:
            emit('error', {'message': 'Not authenticated'})
            return
            
        user_id = event_chat_users[request.sid]
        event_id = data.get('event_id')
        chat_type = data.get('chat_type')
        message_text = data.get('message')
        reply_to_id = data.get('reply_to')
        
        if not all([event_id, chat_type, message_text]):
            emit('error', {'message': 'Missing required fields'})
            return
        
        # Verify user has access to this chat type
        if not verify_chat_access(user_id, event_id, chat_type):
            emit('error', {'message': 'Access denied to this chat'})
            return
        
        # Save to database
        chat_message = EventChat(
            event_id=event_id,
            sender_id=user_id,
            message=message_text,
            chat_type=chat_type,
            timestamp=datetime.utcnow(),
            reply_to_id=reply_to_id
        )
        
        db.session.add(chat_message)
        db.session.commit()
        
        # Get sender info
        sender = User.query.get(user_id)
        
        # Prepare message data for broadcast
        message_data = {
            'id': chat_message.id,
            'event_id': chat_message.event_id,
            'sender_id': chat_message.sender_id,
            'sender_name': sender.full_name if sender else "Unknown",
            'message': chat_message.message,
            'chat_type': chat_message.chat_type,
            'timestamp': chat_message.timestamp.isoformat(),
            'reply_to_id': chat_message.reply_to_id
        }
        
        # Add reply context if available
        if chat_message.reply_to_id:
            reply_message = EventChat.query.get(chat_message.reply_to_id)
            if reply_message:
                reply_sender = User.query.get(reply_message.sender_id)
                message_data['reply_to_message'] = {
                    'id': reply_message.id,
                    'sender_name': reply_sender.full_name if reply_sender else "Unknown",
                    'message': reply_message.message
                }
        
        room = f"event_{event_id}_{chat_type}"
        emit('new_event_message', message_data, room=room)
        
        # Clear typing status for this user
        if room in event_chat_typing and user_id in event_chat_typing[room]:
            del event_chat_typing[room][user_id]
            emit_typing_status(room)
            
    except Exception as e:
        db.session.rollback()
        emit('error', {'message': str(e)})

@socketio.on('typing_event')
def handle_typing_event(data):
    """Handle typing indicators for event chat"""
    try:
        if request.sid not in event_chat_users:
            return
            
        user_id = event_chat_users[request.sid]
        event_id = data.get('event_id')
        chat_type = data.get('chat_type')
        is_typing = data.get('is_typing', False)
        
        if not event_id or not chat_type:
            return
        
        room = f"event_{event_id}_{chat_type}"
        
        if room not in event_chat_typing:
            event_chat_typing[room] = {}
        
        if is_typing:
            event_chat_typing[room][user_id] = datetime.utcnow()
        elif user_id in event_chat_typing[room]:
            del event_chat_typing[room][user_id]
        
        emit_typing_status(room)
        
    except Exception as e:
        print(f"Error handling typing event: {str(e)}")

def emit_typing_status(room):
    """Emit typing status for a room"""
    try:
        if room in event_chat_typing:
            # Remove users who haven't typed in the last 5 seconds
            current_time = datetime.utcnow()
            for user_id, last_typed in list(event_chat_typing[room].items()):
                if (current_time - last_typed).total_seconds() > 5:
                    del event_chat_typing[room][user_id]
            
            # Only emit if someone is actually typing
            if event_chat_typing[room]:
                typing_users = list(event_chat_typing[room].keys())
                emit('user_typing_event', {
                    'users': typing_users,
                    'is_typing': True
                }, room=room)
            else:
                emit('user_typing_event', {'is_typing': False}, room=room)
    except Exception as e:
        print(f"Error emitting typing status: {str(e)}")

def verify_chat_access(user_id, event_id, chat_type):
    """Verify user has access to the specified chat type"""
    from .models.user_event_association import UserEventAssociation
    
    user_association = UserEventAssociation.query.filter_by(
        user_id=user_id,
        event_id=event_id
    ).first()
    
    if not user_association:
        return False
    
    user_role = user_association.role
    
    # Access rules based on role and chat type
    if chat_type == 'organizer_admin':
        return user_role == 'organizer'
    elif chat_type == 'organizer_volunteer':
        return user_role in ['organizer', 'volunteer']
    elif chat_type == 'attendee_only':
        return user_role in ['organizer', 'volunteer', 'attendee']
    
    return False

# API endpoints for initial message loading
from flask import Blueprint, jsonify

event_chat_bp = Blueprint('event_chat', __name__)

@event_chat_bp.route('/api/events/<int:event_id>/chats/<chat_type>/messages')
def get_event_chat_messages(event_id, chat_type):
    """Get messages for a specific event chat"""
    try:
        from .middlewares.auth_middleware import token_required
        from flask import request
        
        # Verify authentication
        user_data = token_required()
        if not user_data:
            return jsonify({'error': 'Unauthorized'}), 401
        
        # Verify chat access
        if not verify_chat_access(user_data.user_id, event_id, chat_type):
            return jsonify({'error': 'Access denied'}), 403
        
        # Get messages with pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        messages = EventChat.query.filter_by(
            event_id=event_id,
            chat_type=chat_type
        ).order_by(EventChat.timestamp.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Format response
        result = []
        for message in messages.items:
            sender = User.query.get(message.sender_id)
            message_data = {
                'id': message.id,
                'sender_id': message.sender_id,
                'sender_name': sender.full_name if sender else "Unknown",
                'message': message.message,
                'timestamp': message.timestamp.isoformat(),
                'reply_to_id': message.reply_to_id
            }
            
            if message.reply_to_id:
                reply_message = EventChat.query.get(message.reply_to_id)
                if reply_message:
                    reply_sender = User.query.get(reply_message.sender_id)
                    message_data['reply_to_message'] = {
                        'sender_name': reply_sender.full_name if reply_sender else "Unknown",
                        'message': reply_message.message
                    }
            
            result.append(message_data)
        
        return jsonify({
            'messages': result,
            'total': messages.total,
            'pages': messages.pages,
            'current_page': page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500