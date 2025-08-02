from Backend.models.system_log import SystemLog
from Backend import db
from datetime import datetime

def log_action(user_id, action_type, description, log_type='info'):
    """
    Logs a system action with improved error handling and model alignment
    
    Args:
        user_id: ID of the user performing the action
        action_type: Type of action being performed (e.g., 'user_login', 'data_update')
        description: Detailed description of the action
        log_type: Severity level ('info', 'success', 'warning', 'error') - defaults to 'info'
    """
    try:
        log = SystemLog(
            action_by=user_id,
            action_type=action_type,
            log_type=log_type,
            description=description,
            timestamp=datetime.utcnow()
        )
        db.session.add(log)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        # Consider using a proper logging system instead of print
        print(f"Failed to log system action: {str(e)}")
        return False