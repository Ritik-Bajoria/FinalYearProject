from flask import request, jsonify
from functools import wraps
from Backend.models.auth_token import AuthToken
from datetime import datetime

def validate_auth_header():
    """Shared validation logic for auth headers"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return None, jsonify({
            "success": False,
            "error": "Authorization header is missing",
            "status_code": 401
        }), 401

    parts = auth_header.split()
    
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None, jsonify({
            "success": False,
            "error": "Authorization header must be 'Bearer <token>'",
            "status_code": 401
        }), 401

    token = parts[1].strip()
    if not token:
        return None, jsonify({
            "success": False,
            "error": "Token cannot be empty",
            "status_code": 401
        }), 401

    return token, None, None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token, error_response, status_code = validate_auth_header()
        if error_response:
            return error_response, status_code

        stored_token = AuthToken.query.filter_by(token=token).first()
        
        if not stored_token:
            return jsonify({
                "success": False,
                "error": "Invalid token",
                "status_code": 401
            }), 401

        if stored_token.expires_at < datetime.utcnow():
            return jsonify({
                "success": False,
                "error": "Token expired",
                "status_code": 401
            }), 401
        
        request.current_user = stored_token.user
        return f(request.current_user, **kwargs)  # Only pass kwargs
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, **kwargs): 
        token, error_response, status_code = validate_auth_header()
        if error_response:
            return error_response, status_code

        stored_token = AuthToken.query.filter_by(token=token).first()
        
        if not stored_token:
            return jsonify({
                "success": False,
                "error": "Invalid token",
                "status_code": 401
            }), 401

        if stored_token.expires_at < datetime.utcnow():
            return jsonify({
                "success": False,
                "error": "Token expired",
                "status_code": 401
            }), 401

        if not stored_token.user.admin:
            return jsonify({
                "success": False,
                "error": "Admin privileges required",
                "status_code": 403
            }), 403

        return f(current_user, **kwargs)  # Only pass kwargs
    return decorated