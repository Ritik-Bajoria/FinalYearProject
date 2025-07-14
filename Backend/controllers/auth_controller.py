from flask import jsonify
from ..services.auth_service import AuthService
from flask import current_app
from ..utils.response_utils import make_response
# from ..utils.auth_utils import validate_registration_data

class AuthController:
    @staticmethod
    def register(data):
        # Registration now handled by AuthService with role-specific logic
        user, role_data, error = AuthService.register_user_with_role(data)
        if error:
            return make_response(error=error, status_code=400)
        
        return AuthController._generate_auth_response(user, role_data)

    @staticmethod
    def login(data):
        if not data or not data.get('email') or not data.get('password'):
            return make_response(error='Email and password required', status_code=400)
        
        # Login now returns both user and role-specific data
        user, role_data, error = AuthService.login_user(data['email'], data['password'])
        if error:
            return make_response(error=error, status_code=401)
        
        return AuthController._generate_auth_response(user, role_data)

    @staticmethod
    def _generate_auth_response(user, role_data):
        token = AuthService.generate_auth_token(user, current_app.config['TOKEN_EXPIRATION_HOURS'])
        
        # Base user response
        response_data = {
            'user': {
                'user_id': user.user_id,
                'email': user.email,
                'created_at': user.created_at.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'is_active': user.is_active
            },
            'token': token.token,
            'expires_at': token.expires_at.isoformat()
        }
        
        # Add role-specific data
        if role_data.get('student'):
            response_data['student'] = {
                'student_id': role_data['student'].student_id,
                'full_name': role_data['student'].full_name,
                'student_id_number': role_data['student'].student_id_number,
                'year_of_study': role_data['student'].year_of_study,
                'major': role_data['student'].major,
                'profile_picture': role_data['student'].profile_picture
            }
        elif role_data.get('faculty'):
            response_data['faculty'] = {
                'faculty_id': role_data['faculty'].faculty_id,
                'full_name': role_data['faculty'].full_name,
                'faculty_id_number': role_data['faculty'].faculty_id_number,
                'department': role_data['faculty'].department,
                'position': role_data['faculty'].position,
                'profile_picture': role_data['faculty'].profile_picture
            }
        elif role_data.get('admin'):
            response_data['admin'] = {
                'admin_id': role_data['admin'].admin_id,
                'full_name': role_data['admin'].full_name,
                'admin_role': role_data['admin'].admin_role,
                'permissions_level': role_data['admin'].permissions_level
            }
        
        return make_response(
            data=response_data,
            message='Authentication successful'
        )