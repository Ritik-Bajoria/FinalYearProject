from flask import Blueprint, request
from ..controllers.auth_controller import AuthController
from ..middlewares.auth_middleware import token_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    return AuthController.register(data)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    return AuthController.login(data)

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    from ..utils.response_utils import make_response
    from ..services.auth_service import AuthService
    
    # Get role-specific data
    role_data = AuthService.get_role_data(current_user)
    
    response_data = {
        'user': {
            'user_id': current_user.user_id,
            'email': current_user.email,
            'created_at': current_user.created_at.isoformat(),
            'last_login': current_user.last_login.isoformat() if current_user.last_login else None,
            'is_active': current_user.is_active
        }
    }
    
    # Add role-specific data
    if role_data.get('student'):
        response_data['student'] = role_data['student']
    elif role_data.get('faculty'):
        response_data['faculty'] = role_data['faculty']
    elif role_data.get('admin'):
        response_data['admin'] = role_data['admin']
    
    return make_response(data=response_data)