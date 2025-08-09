from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

# Initialize extensions without app first
db = SQLAlchemy()
load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['TOKEN_EXPIRATION_HOURS'] = int(os.getenv('TOKEN_EXPIRATION_HOURS', 24))

    # Initialize extensions with app
    db.init_app(app)
    
    with app.app_context():
        # Import all models to ensure they're registered
        from Backend.models import init_models
        init_models()
        
        # Create tables
        db.create_all()
        
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
        app.register_blueprint(admin_auth_bp, url_prefix='/api/admin')
        app.register_blueprint(admin_event_bp, url_prefix='/api/admin')
        app.register_blueprint(admin_user_bp, url_prefix='/api/admin')
        app.register_blueprint(admin_logs_bp, url_prefix='/api/admin')
        app.register_blueprint(admin_settings_bp, url_prefix='/api/admin')
        app.register_blueprint(admin_stats_bp, url_prefix='/api/admin')
        app.register_blueprint(events_bp, url_prefix='/api/events')
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(my_club_api, url_prefix='/api/clubs')
        app.register_blueprint(club_dashboard_api,url_prefix='/api/clubs')
    
    return app