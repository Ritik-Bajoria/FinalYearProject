from flask import Flask, request, jsonify
from logger import Logger
from flask_cors import CORS
import signal
import sys
import os
from routes.events import events_bp
from routes.auth import auth_bp

# Initialize the Flask app
app = Flask(__name__)
app.register_blueprint(events_bp)
app.register_blueprint(auth_bp)
CORS(app)

# get api key from envioronment 
API_KEY = os.getenv('API_KEY')

# function to validate the API key from the request headers.
def validate_api_key():
    api_key = request.headers.get('X-API-KEY')
    if api_key is None or api_key != API_KEY:
        return False
    return True

# create a Logger instance
logger = Logger()

# function for Graceful shutdown 
def graceful_shutdown(signal, frame):
    logger.info("Shutting down gracefully...")
    # Perform any cleanup here if needed
    sys.exit(0)

# Register signal handlers for graceful shutdown
signal.signal(signal.SIGINT, graceful_shutdown) # trigger: ctrl+c
signal.signal(signal.SIGTERM, graceful_shutdown) # trigger: kill pid

# Middleware: before each request to create logs for every request
@app.before_request
def before_request_func():
    # This will run before every request
    logger.info(f"Request from {request.remote_addr} at {request.method} {request.url}")
    
# Error response(json format) in case of route not found
@app.errorhandler(404)
def not_found_error(e):
    return jsonify({
        "error": True,
        "message": "URL not found"
    }), 404

# Error response(json format) in case of method not allowed
@app.errorhandler(405)
def method_not_allowed_error(e):
    return jsonify({
        "error": True,
        "message": "Method not allowed"
    }), 405

if __name__ == '__main__':
    port = os.getenv('PORT')
    host = os.getenv('HOST')
    app.run(host=host,port=port,debug=True)
    logger.info(f"server is listenting at {host}:{port}")
