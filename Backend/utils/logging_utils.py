"""
Comprehensive logging utilities for the Event Management System
"""

from datetime import datetime
from ..models.system_log import SystemLog
from .. import db

def log_user_action(user_id, action_type, description, log_type='info', related_id=None):
    """
    Enhanced logging function for user actions
    
    Args:
        user_id: ID of the user performing the action
        action_type: Type of action (e.g., 'LOGIN', 'CREATE_EVENT', 'JOIN_CLUB')
        description: Detailed description of the action
        log_type: Severity level ('info', 'success', 'warning', 'error')
        related_id: ID of related entity (event_id, club_id, etc.)
    """
    try:
        log = SystemLog(
            action_by=user_id,
            action_type=action_type,
            log_type=log_type,
            description=description,
            timestamp=datetime.utcnow()
        )
        
        # Add related_id if the SystemLog model supports it
        if hasattr(log, 'related_id') and related_id:
            log.related_id = related_id
            
        db.session.add(log)
        db.session.commit()
        
        print(f"✓ Logged action: {action_type} by user {user_id}")
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"Failed to log action {action_type}: {str(e)}")
        return False

def log_auth_action(user_id, action_type, description, ip_address=None, user_agent=None):
    """Log authentication-related actions"""
    try:
        full_description = description
        if ip_address:
            full_description += f" (IP: {ip_address})"
        if user_agent:
            full_description += f" (Agent: {user_agent[:100]})"
            
        return log_user_action(
            user_id=user_id,
            action_type=f"AUTH_{action_type}",
            description=full_description,
            log_type='info'
        )
    except Exception as e:
        print(f"Failed to log auth action: {str(e)}")
        return False

def log_club_action(user_id, action_type, club_id, description):
    """Log club-related actions"""
    try:
        return log_user_action(
            user_id=user_id,
            action_type=f"CLUB_{action_type}",
            description=description,
            log_type='info',
            related_id=club_id
        )
    except Exception as e:
        print(f"Failed to log club action: {str(e)}")
        return False

def log_event_action(user_id, action_type, event_id, description):
    """Log event-related actions"""
    try:
        return log_user_action(
            user_id=user_id,
            action_type=f"EVENT_{action_type}",
            description=description,
            log_type='info',
            related_id=event_id
        )
    except Exception as e:
        print(f"Failed to log event action: {str(e)}")
        return False

def log_admin_action(user_id, action_type, description, target_user_id=None):
    """Log administrative actions"""
    try:
        full_description = description
        if target_user_id:
            full_description += f" (Target User: {target_user_id})"
            
        return log_user_action(
            user_id=user_id,
            action_type=f"ADMIN_{action_type}",
            description=full_description,
            log_type='info',
            related_id=target_user_id
        )
    except Exception as e:
        print(f"Failed to log admin action: {str(e)}")
        return False

def log_system_action(action_type, description, log_type='info'):
    """Log system-level actions (no specific user)"""
    try:
        log = SystemLog(
            action_by=None,  # System action
            action_type=f"SYSTEM_{action_type}",
            log_type=log_type,
            description=description,
            timestamp=datetime.utcnow()
        )
        
        db.session.add(log)
        db.session.commit()
        
        print(f"✓ Logged system action: {action_type}")
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"Failed to log system action: {str(e)}")
        return False

def log_error_action(user_id, action_type, error_message, context=None):
    """Log error actions with detailed information"""
    try:
        full_description = f"Error: {error_message}"
        if context:
            full_description += f" | Context: {context}"
            
        return log_user_action(
            user_id=user_id,
            action_type=f"ERROR_{action_type}",
            description=full_description,
            log_type='error'
        )
    except Exception as e:
        print(f"Failed to log error action: {str(e)}")
        return False

# Convenience functions for common actions
def log_login(user_id, ip_address=None, user_agent=None):
    """Log user login"""
    return log_auth_action(user_id, 'LOGIN', 'User logged in successfully', ip_address, user_agent)

def log_logout(user_id, ip_address=None):
    """Log user logout"""
    return log_auth_action(user_id, 'LOGOUT', 'User logged out', ip_address)

def log_registration(user_id, user_type, ip_address=None):
    """Log user registration"""
    return log_auth_action(user_id, 'REGISTER', f'New {user_type} registered', ip_address)

def log_club_creation(user_id, club_id, club_name):
    """Log club creation"""
    return log_club_action(user_id, 'CREATE', club_id, f'Created club: {club_name}')

def log_club_join_request(user_id, club_id, club_name):
    """Log club join request"""
    return log_club_action(user_id, 'JOIN_REQUEST', club_id, f'Requested to join club: {club_name}')

def log_club_join_approval(approver_id, user_id, club_id, club_name):
    """Log club join approval"""
    return log_club_action(approver_id, 'APPROVE_MEMBER', club_id, f'Approved user {user_id} to join {club_name}')

def log_club_join_rejection(rejector_id, user_id, club_id, club_name):
    """Log club join rejection"""
    return log_club_action(rejector_id, 'REJECT_MEMBER', club_id, f'Rejected user {user_id} from joining {club_name}')

def log_event_creation(user_id, event_id, event_title, club_name=None):
    """Log event creation"""
    description = f'Created event: {event_title}'
    if club_name:
        description += f' for club: {club_name}'
    return log_event_action(user_id, 'CREATE', event_id, description)

def log_event_registration(user_id, event_id, event_title):
    """Log event registration"""
    return log_event_action(user_id, 'REGISTER', event_id, f'Registered for event: {event_title}')

def log_event_approval(admin_id, event_id, event_title):
    """Log event approval"""
    return log_admin_action(admin_id, 'APPROVE_EVENT', f'Approved event: {event_title}', event_id)

def log_event_rejection(admin_id, event_id, event_title):
    """Log event rejection"""
    return log_admin_action(admin_id, 'REJECT_EVENT', f'Rejected event: {event_title}', event_id)