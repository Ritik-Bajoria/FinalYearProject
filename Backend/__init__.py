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
    socketio.init_app(app, 
                     cors_allowed_origins="*",
                     async_mode='threading',
                     logger=True,
                     engineio_logger=True,
                     ping_timeout=60,
                     ping_interval=25)
    
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
        # from Backend.routes.admin_event import admin_event_bp
        from Backend.routes.admin_events import admin_events_bp
        from Backend.routes.admin_user_mgmt import admin_user_bp
        from Backend.routes.admin_logs import admin_logs_bp
        from Backend.routes.admin_settings import admin_settings_bp
        from Backend.routes.admin_stats import admin_stats_bp
        from Backend.routes.club_dashboard_api import club_dashboard_api
        from Backend.routes.notifications import notifications_bp
        from Backend.routes.socialApi import social_bp
        
        # Register swagger blueprint
        from Backend.utils.swagger import swagger_blueprint, create_swagger_json
        create_swagger_json()  # Create swagger.json file
        app.register_blueprint(swagger_blueprint)
        
        app.register_blueprint(admin_auth_bp, url_prefix='/api/admin')
        app.register_blueprint(social_bp, url_prefix='/api')
        # app.register_blueprint(admin_event_bp, url_prefix='/api/admin')
        app.register_blueprint(admin_events_bp, url_prefix='/api/admin')
        app.register_blueprint(admin_user_bp, url_prefix='/api/admin')
        app.register_blueprint(admin_logs_bp, url_prefix='/api/admin')
        app.register_blueprint(admin_settings_bp, url_prefix='/api/admin')
        app.register_blueprint(admin_stats_bp, url_prefix='/api/admin')
        app.register_blueprint(events_bp, url_prefix='/api/events')
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(my_club_api, url_prefix='/api')
        app.register_blueprint(club_dashboard_api, url_prefix='/api')
        app.register_blueprint(notifications_bp, url_prefix='/api')
        
        # Import socket handlers after app initialization
        from Backend import socket_handlers
        
        # Start reminder scheduler
        try:
            from .tasks.reminder_scheduler import start_reminder_scheduler
            start_reminder_scheduler()
            print("✓ Reminder scheduler started")
        except Exception as e:
            print(f"Warning: Could not start reminder scheduler: {str(e)}")
    
    return app