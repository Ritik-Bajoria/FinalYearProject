from flask import Blueprint, request
from ..controllers.auth_controller import AuthController
from ..middlewares.auth_middleware import token_required
from ..utils.logging_utils import log_login, log_logout, log_registration

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    result = AuthController.register(data)
    
    # Log registration if successful
    try:
        if result[1] == 201:  # Success status code
            result_data = result[0].get_json()
            if result_data.get('success'):
                user_id = result_data.get('data', {}).get('user_id')
                user_type = data.get('role', 'unknown')
                ip_address = request.remote_addr
                
                if user_id:
                    log_registration(user_id, user_type, ip_address)
    except Exception as e:
        print(f"Failed to log registration: {str(e)}")
    
    return result

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    result = AuthController.login(data)
    
    # Log login if successful
    try:
        if result[1] == 200:  # Success status code
            result_data = result[0].get_json()
            if result_data.get('success'):
                user_id = result_data.get('data', {}).get('user', {}).get('user_id')
                ip_address = request.remote_addr
                user_agent = request.headers.get('User-Agent')
                
                if user_id:
                    log_login(user_id, ip_address, user_agent)
    except Exception as e:
        print(f"Failed to log login: {str(e)}")
    
    return result

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout endpoint"""
    try:
        # Log logout
        ip_address = request.remote_addr
        log_logout(current_user.user_id, ip_address)
        
        from ..utils.response_utils import make_response
        return make_response(message="Logged out successfully")
        
    except Exception as e:
        from ..utils.response_utils import make_response
        return make_response(error=str(e), status_code=500)

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