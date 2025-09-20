from flask import Blueprint, request, jsonify
from ..controllers.auth_controller import AuthController
from ..middlewares.auth_middleware import token_required
from ..utils.logging_utils import log_login, log_logout, log_registration
from ..models.email_verification import EmailVerification
from ..utils.email_service import EmailService
from ..models import db
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Initiate registration process with email verification"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email')
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Check if user already exists
        from ..models.user import User
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 400
        
        # Validate required fields based on role
        role = data.get('role', 'student')
        if role == 'student':
            student_data = data.get('student', {})
            required_fields = ['full_name', 'student_id_number', 'year_of_study', 'major']
            for field in required_fields:
                if not student_data.get(field):
                    return jsonify({'error': f'{field} is required for student registration'}), 400
        
        # Create email verification record
        verification = EmailVerification.create_verification(
            email=email,
            user_data=data,
            expiry_minutes=10
        )
        
        # Send OTP email
        full_name = data.get('student', {}).get('full_name', 'User') if role == 'student' else 'User'
        success, message = EmailService.send_otp_email(email, verification.otp, full_name)
        
        if not success:
            # If email sending fails, still return success but log the error
            print(f"Email sending failed: {message}")
            # For development, you might want to return the OTP in response
            # Remove this in production!
            return jsonify({
                'success': True,
                'message': 'Registration initiated. Please check your email for verification code.',
                'temp_token': verification.temp_token,
                'expires_at': verification.expires_at.isoformat(),
                'dev_otp': verification.otp  # Remove this in production!
            }), 200
        
        return jsonify({
            'success': True,
            'message': 'Registration initiated. Please check your email for verification code.',
            'temp_token': verification.temp_token,
            'expires_at': verification.expires_at.isoformat()
        }), 200
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed. Please try again.'}), 500

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP and complete registration"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        temp_token = data.get('temp_token')
        otp = data.get('otp')
        
        if not temp_token or not otp:
            return jsonify({'error': 'Temporary token and OTP are required'}), 400
        
        # Find verification record
        verification = EmailVerification.query.filter_by(
            temp_token=temp_token,
            is_verified=False
        ).first()
        
        if not verification:
            return jsonify({'error': 'Invalid or expired verification token'}), 400
        
        # Verify OTP
        success, message = verification.verify(otp)
        
        if not success:
            return jsonify({'error': message}), 400
        
        # Complete registration using the stored user data
        from ..services.auth_service import AuthService
        
        user, role_data, error = AuthService.register_user_with_role(verification.user_data)
        
        if error:
            return jsonify({'error': error}), 400
        
        if user:
            user_type = verification.user_data.get('role', 'unknown')
            ip_address = request.remote_addr
            
            # Log registration
            log_registration(user.user_id, user_type, ip_address)
            
            # Send welcome email
            full_name = verification.user_data.get('student', {}).get('full_name', 'User')
            EmailService.send_welcome_email(verification.email, full_name)
            
            # Clean up verification record
            db.session.delete(verification)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Registration completed successfully! You can now login.',
                'user_id': user.user_id
            }), 201
        
        return jsonify({'error': 'Registration failed'}), 500
        
    except Exception as e:
        print(f"OTP verification error: {str(e)}")
        return jsonify({'error': 'Verification failed. Please try again.'}), 500

@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    """Resend OTP for email verification"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        temp_token = data.get('temp_token')
        
        if not temp_token:
            return jsonify({'error': 'Temporary token is required'}), 400
        
        # Find verification record
        verification = EmailVerification.query.filter_by(
            temp_token=temp_token,
            is_verified=False
        ).first()
        
        if not verification:
            return jsonify({'error': 'Invalid or expired verification token'}), 400
        
        # Check if too many attempts
        if verification.attempts >= 5:
            return jsonify({'error': 'Too many failed attempts. Please start registration again.'}), 400
        
        # Generate new OTP and extend expiry
        verification.otp = EmailVerification.generate_otp()
        verification.expires_at = datetime.utcnow() + timedelta(minutes=10)
        verification.attempts = 0  # Reset attempts on resend
        db.session.commit()
        
        # Send new OTP email
        user_data = verification.user_data
        full_name = user_data.get('student', {}).get('full_name', 'User') if user_data.get('role') == 'student' else 'User'
        success, message = EmailService.send_otp_email(verification.email, verification.otp, full_name)
        
        if not success:
            print(f"Email sending failed: {message}")
            # For development, return the OTP in response
            return jsonify({
                'success': True,
                'message': 'New verification code sent to your email.',
                'expires_at': verification.expires_at.isoformat(),
                'dev_otp': verification.otp  # Remove this in production!
            }), 200
        
        return jsonify({
            'success': True,
            'message': 'New verification code sent to your email.',
            'expires_at': verification.expires_at.isoformat()
        }), 200
        
    except Exception as e:
        print(f"Resend OTP error: {str(e)}")
        return jsonify({'error': 'Failed to resend verification code. Please try again.'}), 500

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