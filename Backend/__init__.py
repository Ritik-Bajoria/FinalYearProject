from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from dotenv import load_dotenv
import os

# Initialize extensions without app first
db = SQLAlchemy()
socketio = SocketIO()
load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['TOKEN_EXPIRATION_HOURS'] = int(os.getenv('TOKEN_EXPIRATION_HOURS', 24))

    # Initialize extensions with app
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")
    
    with app.app_context():
        # Import all models to ensure they're registered
        from Backend.models import init_models
        init_models()
        
        # Run migrations and create tables safely
        try:
            # First, create all tables (this won't affect existing tables)
            db.create_all()
            
            # Run specific migrations for model updates
            # run_migrations()
            
        except Exception as e:
            print(f"Warning: Database initialization issue: {str(e)}")
            # Fallback to basic table creation
            try:
                db.create_all()
            except Exception as fallback_error:
                print(f"Error: Could not create tables: {str(fallback_error)}")
        
        # Register blueprints
        from Backend.routes.auth import auth_bp
        from Backend.routes.events import events_bp
        from Backend.routes.clubs_api import my_club_api
        from Backend.routes.admin_auth import admin_auth_bp
        from Backend.routes.admin_event import admin_event_bp
        from Backend.routes.admin_user_mgmt import admin_user_bp
        from Backend.routes.admin_logs import admin_logs_bp
        from Backend.routes.admin_settings import admin_settings_bp
        from Backend.routes.admin_stats import admin_stats_bp
        from Backend.routes.club_dashboard_api import club_dashboard_api
        from Backend.routes.notifications import notifications_bp
        app.register_blueprint(admin_auth_bp, url_prefix='/api/admin')
        app.register_blueprint(admin_event_bp, url_prefix='/api/admin')
        app.register_blueprint(admin_user_bp, url_prefix='/api/admin')
        app.register_blueprint(admin_logs_bp, url_prefix='/api/admin')
        app.register_blueprint(admin_settings_bp, url_prefix='/api/admin')
        app.register_blueprint(admin_stats_bp, url_prefix='/api/admin')
        app.register_blueprint(events_bp, url_prefix='/api/events')
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(my_club_api, url_prefix='/api')
        app.register_blueprint(club_dashboard_api, url_prefix='/api')
        app.register_blueprint(notifications_bp, url_prefix='/api')
        
        # Import socket handlers
        from . import socket_handlers
        
        # Start reminder scheduler
        try:
            from .tasks.reminder_scheduler import start_reminder_scheduler
            start_reminder_scheduler()
            print("✓ Reminder scheduler started")
        except Exception as e:
            print(f"Warning: Could not start reminder scheduler: {str(e)}")
    
    return app

# def run_migrations():
#     """Run database migrations safely for PostgreSQL and SQLite"""
#     try:
#         from sqlalchemy import text, inspect
        
#         inspector = inspect(db.engine)
        
#         # Check if notifications table exists and needs migration
#         if inspector.has_table('notifications'):
#             columns = inspector.get_columns('notifications')
#             column_names = [col['name'] for col in columns]
            
#             # Determine database type
#             db_url = db.engine.url
#             is_postgresql = str(db_url).startswith('postgresql')
            
#             # Add missing columns safely
#             migrations_needed = []
            
#             if 'is_read' not in column_names:
#                 if 'read' in column_names:
#                     # For PostgreSQL, we can rename columns directly
#                     if is_postgresql:
#                         migrations_needed.append("ALTER TABLE notifications RENAME COLUMN read TO is_read")
#                     else:
#                         # For SQLite, add new column and copy data
#                         migrations_needed.append("ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE")
#                         migrations_needed.append("UPDATE notifications SET is_read = read WHERE read IS NOT NULL")
#                 else:
#                     migrations_needed.append("ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE")
            
#             if 'read_at' not in column_names:
#                 if is_postgresql:
#                     migrations_needed.append("ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP")
#                 else:
#                     migrations_needed.append("ALTER TABLE notifications ADD COLUMN read_at DATETIME")
            
#             if 'created_at' not in column_names:
#                 if 'sent_at' in column_names:
#                     if is_postgresql:
#                         migrations_needed.append("ALTER TABLE notifications RENAME COLUMN sent_at TO created_at")
#                     else:
#                         # For SQLite, add new column and copy data
#                         migrations_needed.append("ALTER TABLE notifications ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP")
#                         migrations_needed.append("UPDATE notifications SET created_at = sent_at WHERE sent_at IS NOT NULL")
#                 else:
#                     if is_postgresql:
#                         migrations_needed.append("ALTER TABLE notifications ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
#                     else:
#                         migrations_needed.append("ALTER TABLE notifications ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP")
            
#             # Execute migrations
#             for migration in migrations_needed:
#                 try:
#                     print(f"Running migration: {migration}")
#                     db.session.execute(text(migration))
#                     db.session.commit()
#                     print("✓ Migration successful")
#                 except Exception as e:
#                     print(f"Migration warning: {str(e)}")
#                     db.session.rollback()
            
#             # Update any NULL values
#             try:
#                 if is_postgresql:
#                     db.session.execute(text("""
#                         UPDATE notifications 
#                         SET created_at = CURRENT_TIMESTAMP 
#                         WHERE created_at IS NULL
#                     """))
#                     db.session.execute(text("""
#                         UPDATE notifications 
#                         SET is_read = FALSE 
#                         WHERE is_read IS NULL
#                     """))
#                 else:
#                     db.session.execute(text("""
#                         UPDATE notifications 
#                         SET created_at = CURRENT_TIMESTAMP 
#                         WHERE created_at IS NULL
#                     """))
#                     db.session.execute(text("""
#                         UPDATE notifications 
#                         SET is_read = 0 
#                         WHERE is_read IS NULL
#                     """))
#                 db.session.commit()
#                 print("✓ Updated NULL values")
#             except Exception as e:
#                 print(f"Default value update warning: {str(e)}")
#                 db.session.rollback()
        
#         print("✓ Database migrations completed successfully")
        
#     except Exception as e:
#         print(f"Migration warning: {str(e)}")
#         db.session.rollback()