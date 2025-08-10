from flask import request, jsonify
# Import the create_app function and db from package
from Backend import create_app, db
from flask_cors import CORS
from Backend.logger import Logger
import signal
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
    logger.info(f"Server is starting at {host}:{port}")
    app.run(host=host, port=port, debug=True)