from flask import request, jsonify
from functools import wraps
from Backend.models.auth_token import AuthToken
from datetime import datetime

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Check if Authorization header exists
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({
                "success": False,
                "error": "Authorization header is missing",
                "status_code": 401
            }), 401

        # Split header and validate format
        parts = auth_header.split()
        
        # Must have exactly 2 parts: 'Bearer' and the token
        if len(parts) != 2:
            return jsonify({
                "success": False,
                "error": "Authorization header must be Bearer token",
                "status_code": 401
            }), 401

        # First part must be 'Bearer'
        if parts[0].lower() != 'bearer':
            return jsonify({
                "success": False,
                "error": "Authorization header must start with 'Bearer'",
                "status_code": 401
            }), 401

        token = parts[1]
        
        # Token must not be empty
        if not token.strip():
            return jsonify({
                "success": False,
                "error": "Token cannot be empty",
                "status_code": 401
            }), 401

        # Verify token in database
        stored_token = AuthToken.query.filter_by(token=token).first()
        
        if not stored_token:
            return jsonify({
                "success": False,
                "error": "Invalid token",
                "status_code": 401
            }), 401

        # Check token expiration
        if stored_token.expires_at < datetime.utcnow():
            return jsonify({
                "success": False,
                "error": "Token expired",
                "status_code": 401
            }), 401
        
        # Pass current_user as first argument
        # Attach user to request context
        request.current_user = stored_token.user
        return f(request.current_user, *args, **kwargs)
    return decorated