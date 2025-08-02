from flask import Blueprint, jsonify, request
from ..middlewares.auth_middleware import token_required, admin_required
from ..utils.log_action import log_action

admin_settings_bp = Blueprint('admin_settings', __name__, url_prefix='/admin')

# 6. Settings
@admin_settings_bp.route('/settings', methods=['GET'])
# @token_required
# @admin_required
def get_settings():
    # This would come from a settings table or config file
    return jsonify({
        'system_name': 'University Event Management',
        'default_event_capacity': 100,
        'auto_approve_events': False,
        'email_notifications': True,
        'push_notifications': True,
        'reminder_hours': 24,
        'session_timeout': 60,
        'require_email_verification': True,
        'max_login_attempts': 5,
        'maintenance_mode': False,
        'log_retention_days': 90
    })

@admin_settings_bp.route('/settings', methods=['PUT'])
# @token_required
# @admin_required
def update_settings():
    data = request.get_json()
    
    # Validate and update settings (would normally save to database)
    # This is a simplified example
    
    log_action(current_user.user_id, 'success', 'Updated system settings')
    
    return jsonify({'message': 'Settings updated successfully'})

@admin_settings_bp.route('/backup', methods=['POST'])
# @token_required
# @admin_required
def create_backup():
    # Implement your backup logic here
    log_action(current_user.user_id, 'success', 'Created system backup')
    return jsonify({'message': 'Backup created successfully'})

@admin_settings_bp.route('/maintenance-mode', methods=['POST'])
# @token_required
# @admin_required
def toggle_maintenance():
    # Implement maintenance mode toggle
    log_action(current_user.user_id, 'success', 'Toggled maintenance mode')
    return jsonify({'message': 'Maintenance mode toggled'})