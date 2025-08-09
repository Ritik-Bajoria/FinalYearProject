from flask import Blueprint, jsonify, request
from ..models import db, User, Admin
from ..middlewares.auth_middleware import token_required, admin_required
from ..utils.log_action import log_action

admin_auth_bp = Blueprint('admin_auth', __name__, url_prefix='/admin')

# 1. Authentication & Admin Routes
# @admin_auth_bp.route('/login', methods=['POST'])
# def admin_login():
#     data = request.get_json()
#     email = data.get('email')
#     password = data.get('password')
    
#     user = User.query.filter_by(email=email).first()
#     if not user or not user.check_password(password):
#         return jsonify({'error': 'Invalid credentials'}), 401
    
#     admin = Admin.query.filter_by(user_id=user.user_id).first()
#     if not admin:
#         return jsonify({'error': 'Access denied'}), 403
    
#     # Generate token (implement your token generation logic)
#     token = generate_token(user.user_id)
    
#     log_action(user.user_id, 'ADMIN_LOGIN', f'Admin logged in')
    
#     return jsonify({
#         'token': token,
#         'user_id': admin.user_id,
#         'permissions_level': admin.permissions_level
#     })

@admin_auth_bp.route('/verify-session', methods=['GET'])
# @token_required
# @admin_required
def verify_session(current_user):
    admin = Admin.query.filter_by(user_id=current_user.user_id).first()
    return jsonify({
        'user_id': admin.user_id,
        'permissions_level': admin.permissions_level
    })