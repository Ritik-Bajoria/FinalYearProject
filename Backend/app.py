from flask import request, jsonify
from Backend import create_app, db
from Backend.models import User, EventChat
from flask_cors import CORS
from Backend.logger import Logger
import signal
from flask_socketio import emit, join_room, leave_room
from datetime import datetime
import sys
import os
from dotenv import load_dotenv
from sqlalchemy import text, inspect
from flask_login import LoginManager

# Load environment variables
load_dotenv()

# Initialize Flask app
app = create_app()
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024 

# Initialize extensions
login_manager = LoginManager(app)

# Use the socketio instance from __init__.py
from Backend import socketio

# Setup Flask-Login
@login_manager.user_loader
def load_user(user_id):
    from Backend.models.user import User  # Fixed import path
    return User.query.get(int(user_id))

# Enhanced CORS configuration for both HTTP and WebSocket
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

# Logger instance
logger = Logger()

# Get API key from environment
API_KEY = os.getenv('API_KEY')

def check_db_connection():
    """Function to verify database connection"""
    try:
        with app.app_context():
            db.session.execute(text('SELECT 1'))
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        return False

# Store typing status and active users
active_users = {}
typing_status = {}
event_chat_typing = {}

# ==================== SOCKET.IO EVENT HANDLERS ====================

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f"🔌 Client connected: {request.sid}")
    emit('connected', {'status': 'Connected to server', 'sid': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"🔌 Client disconnected: {request.sid}")
    # Remove user from active users if they were authenticated
    if request.sid in active_users:
        user_id = active_users[request.sid]
        leave_room(f'user_{user_id}')
        del active_users[request.sid]
        print(f"👤 User {user_id} disconnected and removed from active users")

@socketio.on('authenticate')
def handle_authentication(data):
    """Verify user token and register their connection"""
    try:
        print(f"🔐 Authentication attempt: {request.sid}")
        
        if not data or not isinstance(data, dict):
            print(f"❌ Invalid authentication data: {data}")
            emit('auth_error', {'message': 'Invalid authentication data'})
            return
            
        from Backend.middlewares.auth_middleware import verify_token  # Fixed import path
        token = data.get('token')
        if not token:
            print(f"❌ No token provided")
            emit('auth_error', {'message': 'Token required'})
            return
            
        print(f"🔐 Verifying token: {token[:20]}...")
        user = verify_token(token)
        if user:
            active_users[request.sid] = user.user_id
            # Join user-specific room for targeted notifications
            join_room(f'user_{user.user_id}')
            emit('authenticated', {
                'success': True,
                'user_id': user.user_id,
                'message': 'Successfully authenticated'
            })
            print(f"✅ User {user.user_id} authenticated for socket connection")
            return
        
        print(f"❌ Invalid token verification")
        emit('auth_error', {'message': 'Invalid token'})
    except Exception as e:
        print(f"❌ Socket authentication error: {str(e)}")
        import traceback
        traceback.print_exc()
        emit('auth_error', {'message': 'Authentication failed'})

# ==================== CLUB CHAT HANDLERS ====================

@socketio.on('joinClubRoom')
def handle_join_club_room(data):
    """Join club-specific room for club chat"""
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
        emit('status', {'msg': f'Joined room: {club_room}'}, room=request.sid)
        print(f"🏢 User {active_users[request.sid]} joined club room {club_room}")
    except Exception as e:
        logger.error(f"Error in joinClubRoom: {str(e)}")
        emit('error', {'message': str(e)}, room=request.sid)

@socketio.on('sendMessage')
def handle_send_club_message(data):
    """Send message to club chat"""
    try:
        if request.sid not in active_users:
            emit('error', {'message': 'Not authenticated'})
            return
            
        user_id = active_users[request.sid]
        room = f"club_{data['club_id']}"
        
        # Save to database
        from Backend.models import ClubChat  # Fixed import path
        chat = ClubChat(
            club_id=data['club_id'],
            sender_id=user_id,
            message_text=data['message_text'],
            sent_at=datetime.utcnow()
        )
        db.session.add(chat)
        db.session.commit()
        
        # Broadcast to room
        message = {
            'message_id': chat.message_id,
            'club_id': chat.club_id,
            'sender_id': chat.sender_id,
            'sender_name': chat.sender.full_name if chat.sender else "Unknown",
            'message_text': chat.message_text,
            'sent_at': chat.sent_at.isoformat(),
            'is_leader': chat.club.leader_id == user_id
        }
        emit('newMessage', message, room=room)
    except Exception as e:
        logger.error(f"Error in sendMessage: {str(e)}")
        emit('error', {'message': str(e)}, room=request.sid)

@socketio.on('typing')
def handle_club_typing(data):
    """Handle typing indicator for club chat"""
    try:
        if request.sid not in active_users:
            return
            
        room = f"club_{data['club_id']}"
        user_id = active_users[request.sid]
        typing_status[room] = typing_status.get(room, {})
        typing_status[room][user_id] = data['isTyping']
        
        # Only emit if someone is actually typing
        if any(typing_status[room].values()):
            emit('userTyping', {
                'users': [uid for uid, typing in typing_status[room].items() if typing],
                'isTyping': True
            }, room=room)
        else:
            emit('userTyping', {'isTyping': False}, room=room)
    except Exception as e:
        logger.error(f"Error in typing: {str(e)}")

# ==================== EVENT CHAT HANDLERS ====================

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
        
        # Initialize typing status for this room
        if event_room not in event_chat_typing:
            event_chat_typing[event_room] = {}
        
        emit('joined_chat', {
            'event_id': event_id,
            'chat_type': chat_type,
            'room': event_room,
            'message': f'Joined event {event_id} chat room'
        })
        
        print(f"🎉 User {active_users[request.sid]} joined event chat room {event_room}")
        
    except Exception as e:
        print(f"❌ Error joining event chat room: {str(e)}")
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
        reply_to_id = data.get('reply_to_id')  # Added support for replies

        print(f"📨 Sending event message: event_id={event_id}, chat_type={chat_type}, user_id={user_id}")

        if not all([event_id, chat_type, message_text]):
            if callback: 
                callback({'error': 'Missing required fields'})
            return
        
        # Check access permissions - FIXED INCONSISTENT ROLE CHECKING
        from Backend.models.user_event_association import UserEventAssociation  # Fixed import
        
        # Get user object
        user_obj = User.query.filter_by(user_id=user_id).first()
        
        # Check if user is admin - consistent check
        is_admin = user_obj and hasattr(user_obj, 'admin') and user_obj.admin
        
        if not is_admin:
            # For non-admin users, check event association
            user_association = UserEventAssociation.query.filter_by(
                user_id=user_id,
                event_id=event_id
            ).first()

            if not user_association:
                if callback: 
                    callback({'error': 'Access denied - not associated with event'})
                return

            user_role = user_association.role

            # Role-based access control
            if chat_type == 'organizer_admin':
                if user_role != 'organizer':
                    if callback: 
                        callback({'error': 'Access denied - organizer access required'})
                    return
            elif chat_type == 'organizer_volunteer':
                if user_role not in ['organizer', 'volunteer']:
                    if callback: 
                        callback({'error': 'Access denied - organizer or volunteer access required'})
                    return
            elif chat_type == 'attendee_only':
                if user_role not in ['organizer', 'volunteer', 'attendee']:
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
                timestamp=datetime.utcnow(),
                reply_to_id=reply_to_id  # Added reply support
            )
            
            db.session.add(new_message)
            db.session.commit()
            
            print(f"💾 Message saved to database: {new_message.id}")
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to save chat message: {str(e)}")
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
                sender_name = user_obj.full_name

        # Prepare message data with reply support
        message_data = {
            'id': new_message.id,
            'event_id': new_message.event_id,
            'sender_id': new_message.sender_id,
            'sender_name': sender_name or "Unknown",
            'message': new_message.message,
            'chat_type': new_message.chat_type,
            'timestamp': new_message.timestamp.isoformat(),
            'reply_to_id': new_message.reply_to_id  # Include reply ID
        }
        
        # Add reply context if available
        if reply_to_id:
            try:
                reply_message = EventChat.query.get(reply_to_id)
                if reply_message:
                    reply_user = User.query.get(reply_message.sender_id)
                    reply_user_name = None
                    if reply_user:
                        if hasattr(reply_user, 'student') and reply_user.student:
                            reply_user_name = reply_user.student.full_name
                        elif hasattr(reply_user, 'faculty') and reply_user.faculty:
                            reply_user_name = reply_user.faculty.full_name
                        elif hasattr(reply_user, 'admin') and reply_user.admin:
                            reply_user_name = reply_user.admin.full_name
                        else:
                            reply_user_name = reply_user.full_name
                    
                    message_data['reply_to'] = {
                        'id': reply_message.id,
                        'sender_name': reply_user_name or "Unknown",
                        'message': reply_message.message
                    }
            except Exception as e:
                print(f"⚠️ Error loading reply context: {str(e)}")
        
        # Emit to event chat room
        event_room = f'event_{event_id}_{chat_type}'
        emit('new_event_message', message_data, room=event_room)
        
        print(f"📤 Message emitted to room {event_room}")
        
        # Clear typing
        if event_room in event_chat_typing and user_id in event_chat_typing[event_room]:
            del event_chat_typing[event_room][user_id]
            emit_typing_status(event_room)
        
        if callback: 
            callback(message_data)
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in send_event_message: {str(e)}")
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
        
        event_room = f'event_{event_id}_{chat_type}'
        if event_room not in event_chat_typing:
            event_chat_typing[event_room] = {}
        
        if is_typing:
            event_chat_typing[event_room][user_id] = datetime.utcnow()
        elif user_id in event_chat_typing[event_room]:
            del event_chat_typing[event_room][user_id]
        
        emit_typing_status(event_room)
        
    except Exception as e:
        print(f"❌ Error handling typing event: {str(e)}")

def emit_typing_status(room):
    """Emit typing status to room"""
    try:
        if room in event_chat_typing:
            current_time = datetime.utcnow()
            for user_id, last_typed in list(event_chat_typing[room].items()):
                if (current_time - last_typed).total_seconds() > 5:
                    del event_chat_typing[room][user_id]

            if event_chat_typing[room]:
                typing_users = list(event_chat_typing[room].keys())
                emit('user_typing_event', {'users': typing_users, 'is_typing': True}, room=room)
            else:
                emit('user_typing_event', {'is_typing': False}, room=room)
    except Exception as e:
        print(f"❌ Error emitting typing status: {str(e)}")

# ==================== NOTIFICATION HANDLERS ====================

@socketio.on('request_unread_count')
def handle_unread_count_request():
    """Send current unread notification count to user"""
    try:
        if request.sid not in active_users:
            emit('error', {'message': 'Not authenticated'})
            return
        
        user_id = active_users[request.sid]
        
        # Get unread count from database
        from Backend.models.notification import Notification  # Fixed import
        unread_count = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).count()
        
        emit('unread_count_update', {'count': unread_count})
        
    except Exception as e:
        print(f"❌ Error getting unread count: {str(e)}")
        emit('error', {'message': 'Failed to get unread count'})

# ==================== UTILITY FUNCTIONS ====================

def validate_api_key():
    api_key = request.headers.get('X-API-KEY')
    return api_key == API_KEY

def graceful_shutdown(signal, frame):
    logger.info("Shutting down gracefully...")
    sys.exit(0)

# ==================== FLASK ROUTES ====================

@app.before_request
def before_request_func():
    logger.info(f"Request from {request.remote_addr} at {request.method} {request.url}")

@app.errorhandler(404)
def not_found_error(e):
    return jsonify({"error": True, "message": "URL not found"}), 404

@app.errorhandler(405)
def method_not_allowed_error(e):
    return jsonify({"error": True, "message": "Method not allowed"}), 405

@app.errorhandler(401)
def unauthorized_error(e):
    return jsonify({"error": True, "message": "Unauthorized access"}), 401

def sync_tables(options={}):
    """
    Sync database tables with models
    """
    try:
        with app.app_context():
            if options.get('force'):
                db.drop_all()
                db.create_all()
                logger.info("All tables dropped and recreated (force=true)")
            elif options.get('alter'):
                alter_tables_to_match_models()
            else:
                db.create_all()
                logger.info("Tables synchronized (created if not exists)")
            return True
    except Exception as e:
        logger.error(f"Failed to sync models: {str(e)}")
        return False

def alter_tables_to_match_models():
    """
    Attempt to alter existing tables to match models
    """
    metadata = db.metadata
    inspector = inspect(db.engine)
    
    with db.engine.begin() as conn:
        for table in metadata.sorted_tables:
            table_name = table.name
            
            if not inspector.has_table(table_name):
                conn.execute(text(str(CreateTable(table))))
                continue
                
            existing_columns = {c['name']: c for c in inspector.get_columns(table_name)}
            model_columns = {c.name: c for c in table.columns}
            
            for col_name, model_col in model_columns.items():
                if col_name not in existing_columns:
                    stmt = f"ALTER TABLE {table_name} ADD COLUMN {model_col.compile(dialect=db.engine.dialect)}"
                    conn.execute(text(stmt))
    
    logger.info("Tables altered to match models where possible")

# ==================== MAIN ENTRY POINT ====================

if __name__ == '__main__':
    
    # Graceful shutdown
    signal.signal(signal.SIGINT, graceful_shutdown)
    signal.signal(signal.SIGTERM, graceful_shutdown)

    # Verify database connection before starting the server
    if not check_db_connection():
        logger.error("Exiting due to database connection failure")
        sys.exit(1)

    port = int(os.getenv('PORT', 7000))
    host = os.getenv('HOST', '127.0.0.1')
    logger.info(f"Starting server at {host}:{port}")
    
    # Run with allow_unsafe_werkzeug=True in development
    socketio.run(app, 
                 host=host, 
                 port=port, 
                 debug=True,
                 allow_unsafe_werkzeug=True)  # Added CORS for Socket.IO