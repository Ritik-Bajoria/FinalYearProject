from flask import Blueprint, jsonify, request, Response
from ..models import db, User, SystemLog
from ..middlewares.auth_middleware import token_required, admin_required
from ..utils.log_action import log_action
from datetime import datetime, timedelta
import csv
from io import StringIO

admin_logs_bp = Blueprint('admin_logs', __name__, url_prefix='/admin')

@admin_logs_bp.route('/logs', methods=['GET'])
@token_required
@admin_required
def get_logs(current_user):  # Add current_user parameter
    try:
        page = request.args.get('page', default=1, type=int)
        limit = request.args.get('limit', default=20, type=int)
        action_type = request.args.get('action_type', default=None, type=str)
        log_type = request.args.get('log_type', default=None, type=str)
        date_from = request.args.get('date_from', default=None, type=str)
        date_to = request.args.get('date_to', default=None, type=str)
        
        query = SystemLog.query
        
        if action_type:
            query = query.filter(SystemLog.action_type.ilike(f'%{action_type}%'))
        
        if log_type:
            query = query.filter_by(log_type=log_type.lower())
        
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d')
                query = query.filter(SystemLog.timestamp >= date_from)
            except ValueError:
                return jsonify({'error': 'Invalid date_from format (YYYY-MM-DD)'}), 400
        
        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1)
                query = query.filter(SystemLog.timestamp <= date_to)
            except ValueError:
                return jsonify({'error': 'Invalid date_to format (YYYY-MM-DD)'}), 400
        
        paginated_logs = query.order_by(SystemLog.timestamp.desc()).paginate(
            page=page, per_page=limit, error_out=False)
        
        logs = []
        for log in paginated_logs.items:
            user = User.query.get(log.action_by)
            
            logs.append({
                'log_id': log.log_id,
                'timestamp': log.timestamp.isoformat(),
                'action_type': log.action_type,
                'log_type': log.log_type,
                'action_by': log.action_by,
                'user_email': user.email if user else 'System',
                'description': log.description
            })
        
        return jsonify({
            'success': True,
            'data': {
                'logs': logs,
                'total': paginated_logs.total,
                'pages': paginated_logs.pages,
                'current_page': page
            }
        })
    
    except Exception as e:
        log_action(current_user.user_id, 'GET_LOGS_ERROR', str(e), 'error')
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_logs_bp.route('/logs/export', methods=['GET'])
@token_required
@admin_required
def export_logs():
    try:
        action_type = request.args.get('action_type', default=None, type=str)
        log_type = request.args.get('log_type', default=None, type=str)
        date_from = request.args.get('date_from', default=None, type=str)
        date_to = request.args.get('date_to', default=None, type=str)
        
        query = SystemLog.query
        
        if action_type:
            query = query.filter(SystemLog.action_type.ilike(f'%{action_type}%'))
        
        if log_type:
            query = query.filter_by(log_type=log_type.lower())
        
        if date_from:
            date_from = datetime.strptime(date_from, '%Y-%m-%d')
            query = query.filter(SystemLog.timestamp >= date_from)
        
        if date_to:
            date_to = datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1)
            query = query.filter(SystemLog.timestamp <= date_to)
        
        logs = query.order_by(SystemLog.timestamp.desc()).all()
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header with all fields
        writer.writerow([
            'Log ID', 'Timestamp', 'Action Type', 'Log Type', 
            'User ID', 'User Email', 'Description'
        ])
        
        # Write data
        for log in logs:
            user = User.query.get(log.action_by)
            
            writer.writerow([
                log.log_id,
                log.timestamp.isoformat(),
                log.action_type,
                log.log_type,
                log.action_by,
                user.email if user else 'System',
                log.description
            ])
        
        output.seek(0)
        
        log_action(current_user.user_id, 'EXPORT_LOGS', 
                  f'Exported {len(logs)} logs', 'success')
        
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-disposition": "attachment; filename=system_logs_export.csv"}
        )
    
    except Exception as e:
        log_action(current_user.user_id, 'EXPORT_LOGS_ERROR', str(e), 'error')
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_logs_bp.route('/logs/clear-old', methods=['DELETE'])
@token_required
@admin_required
def clear_old_logs():
    try:
        retention_days = request.args.get('days', default=90, type=int)
        if retention_days < 1:
            return jsonify({'success': False, 'error': 'Retention days must be at least 1'}), 400
            
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        
        # Get count before deletion for logging
        count = SystemLog.query.filter(SystemLog.timestamp < cutoff_date).count()
        
        # Perform deletion
        SystemLog.query.filter(SystemLog.timestamp < cutoff_date).delete()
        db.session.commit()
        
        log_action(current_user.user_id, 'CLEAR_OLD_LOGS', 
                  f'Cleared {count} logs older than {retention_days} days', 'info')
        
        return jsonify({
            'success': True,
            'data': {
                'logs_deleted': count,
                'retention_days': retention_days,
                'cutoff_date': cutoff_date.isoformat()
            }
        })
    
    except Exception as e:
        db.session.rollback()
        log_action(current_user.user_id, 'CLEAR_OLD_LOGS_ERROR', str(e), 'error')
        return jsonify({'success': False, 'error': str(e)}), 500