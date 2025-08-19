from flask import request, jsonify
# Import the create_app function and db from package
from Backend import create_app, db
from flask_cors import CORS, cross_origin
from Backend.logger import Logger
import signal
from flask_socketio import SocketIO, emit, join_room, leave_room
import uuid
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

# Initialize extensions
# db.init_app(app)
login_manager = LoginManager(app)
socketio = SocketIO(app, 
                   cors_allowed_origins="*",
                   async_mode='gevent',
                   logger=True,
                   engineio_logger=True)
@socketio.on('connect')
def handle_connect():
    logger.info(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f"Client disconnected: {request.sid}")
# Setup Flask-Login
@login_manager.user_loader
def load_user(user_id):
    from models.user import User
    return User.query.get(int(user_id))

CORS(app, origins=["http://localhost:5173"])

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

@socketio.on('connect')
def handle_connect():
    logger.info(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    user_id = active_users.get(request.sid)
    if user_id:
        logger.info(f"User {user_id} disconnected")
        del active_users[request.sid]
    else:
        logger.info(f"Unknown client disconnected: {request.sid}")

@socketio.on('authenticate')
def handle_authentication(data):
    """Verify user token and register their connection"""
    try:
        from .middlewares.auth_middleware import verify_token
        user_data = verify_token(data.get('token'))
        # print(user_data.user_id)
        if user_data:
            active_users[request.sid] = user_data.user_id
            emit('authenticated', {'success': True})
            return
        emit('error', {'message': 'Invalid token'})
    except Exception as e:
        emit('error', {'message': str(e)})

@socketio.on('joinClubRoom')
def handle_join_room(data):
    try:
        if request.sid not in active_users:
            emit('error', {'message': 'Not authenticated'})
            return
            
        room = f"club_{data['club_id']}"
        join_room(room)
        emit('status', {'msg': f'Joined room: {room}'}, room=request.sid)
    except Exception as e:
        logger.error(f"Error in joinClubRoom: {str(e)}")
        emit('error', {'message': str(e)}, room=request.sid)

@socketio.on('sendMessage')
def handle_send_message(data):
    try:
        if request.sid not in active_users:
            emit('error', {'message': 'Not authenticated'})
            return
            
        user_id = active_users[request.sid]
        room = f"club_{data['club_id']}"
        
        # Save to database
        from Backend.models import ClubChat
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
def handle_typing(data):
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

# API key validator (for external API calls if needed)
def validate_api_key():
    api_key = request.headers.get('X-API-KEY')
    return api_key == API_KEY

# Graceful shutdown handler
def graceful_shutdown(signal, frame):
    logger.info("Shutting down gracefully...")
    sys.exit(0)

# Logging each request
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
    
    Options:
    - force: Boolean - Drops all tables and recreates them
    - alter: Boolean - Attempts to alter tables to match models
    """
    try:
        with app.app_context():
            if options.get('force'):
                # Drop all tables and recreate (DANGEROUS - only for development)
                db.drop_all()
                db.create_all()
                logger.info("All tables dropped and recreated (force=true)")
            elif options.get('alter'):
                # This is more complex in SQLAlchemy
                alter_tables_to_match_models()
            else:
                # Default behavior - create only if not exists
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
                # Create new table if it doesn't exist
                conn.execute(text(str(CreateTable(table))))
                continue
                
            # Compare columns
            existing_columns = {c['name']: c for c in inspector.get_columns(table_name)}
            model_columns = {c.name: c for c in table.columns}
            
            # Add new columns
            for col_name, model_col in model_columns.items():
                if col_name not in existing_columns:
                    stmt = f"ALTER TABLE {table_name} ADD COLUMN {model_col.compile(dialect=db.engine.dialect)}"
                    conn.execute(text(stmt))
    
    logger.info("Tables altered to match models where possible")

if __name__ == '__main__':
    
    # graceful shutdown
    signal.signal(signal.SIGINT, graceful_shutdown)
    signal.signal(signal.SIGTERM, graceful_shutdown)

    # Verify database connection before starting the server
    if not check_db_connection():
        logger.error("Exiting due to database connection failure")
        sys.exit(1)

    # Sync tables based on environment
    # print(os.getenv('FLASK_ENV'))
    # if os.getenv('FLASK_ENV') == 'development':
    #     # In development, you might want to force recreate tables
    #     if not sync_tables({'force': True}):
    #         logger.error("Exiting due to table sync failure")
    #         sys.exit(1)
    # else:
    #     # In production, just ensure tables exist
    #     if not sync_tables():
    #         logger.error("Exiting due to table sync failure")
    #         sys.exit(1)

    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '127.0.0.1')
    logger.info(f"Starting server at {host}:{port}")
    
    # Run with allow_unsafe_werkzeug=True in development
    socketio.run(app, 
                 host=host, 
                 port=port, 
                 debug=True,
                 allow_unsafe_werkzeug=True)