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
        app.register_blueprint(events_bp, url_prefix='/api/events')
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    return app