from flask import Blueprint, request, jsonify
from ..models import db, Event, EventAttendance, EventRegistration, User
from ..middlewares.auth_middleware import token_required
from ..models.user_event_association import UserEventAssociation
from datetime import datetime

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/events/<int:event_id>/attendance', methods=['GET'])
@token_required
def get_event_attendance(current_user, event_id):
    try:
        # Verify user is organizer
        user_association = UserEventAssociation.query.filter_by(
            user_id=current_user.user_id,
            event_id=event_id,
            role='organizer'
        ).first()
        
        if not user_association:
            return jsonify({'error': 'Only organizers can view attendance'}), 403
        
        # Get all registrations and their attendance status
        registrations = db.session.query(EventRegistration, EventAttendance, User).outerjoin(
            EventAttendance, 
            (EventRegistration.user_id == EventAttendance.user_id) & 
            (EventRegistration.event_id == EventAttendance.event_id)
        ).join(
            User, EventRegistration.user_id == User.user_id
        ).filter(
            EventRegistration.event_id == event_id,
            EventRegistration.status == 'approved'
        ).all()
        
        attendance_data = []
        for registration, attendance, user in registrations:
            attendance_data.append({
                'user_id': user.user_id,
                'user': {
                    'full_name': user.full_name,
                    'email': user.email
                },
                'attended': attendance is not None,
                'check_in_time': attendance.check_in_time.isoformat() if attendance and attendance.check_in_time else None,
                'qr_checked_in': attendance.qr_checked_in if attendance else False,
                'status': 'present' if attendance else 'absent'
            })
        
        return jsonify(attendance_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@attendance_bp.route('/events/<int:event_id>/attendance', methods=['POST'])
@token_required
def mark_attendance(current_user, event_id):
    try:
        data = request.get_json()
        user_id = data.get('user_id', current_user.user_id)
        
        # Check if user is registered
        registration = EventRegistration.query.filter_by(
            event_id=event_id,
            user_id=user_id,
            status='approved'
        ).first()
        
        if not registration:
            return jsonify({'error': 'User not registered for this event'}), 403
        
        # Check if attendance already exists
        existing_attendance = EventAttendance.query.filter_by(
            event_id=event_id,
            user_id=user_id
        ).first()
        
        if existing_attendance:
            return jsonify({'error': 'Attendance already marked'}), 400
        
        # Create attendance record
        attendance = EventAttendance(
            event_id=event_id,
            user_id=user_id,
            check_in_time=datetime.utcnow(),
            qr_checked_in=data.get('qr_checked_in', False)
        )
        
        db.session.add(attendance)
        db.session.commit()
        
        return jsonify({'message': 'Attendance marked successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@attendance_bp.route('/events/<int:event_id>/attendance/<int:user_id>', methods=['DELETE'])
@token_required
def unmark_attendance(current_user, event_id, user_id):
    try:
        # Verify user is organizer
        user_association = UserEventAssociation.query.filter_by(
            user_id=current_user.user_id,
            event_id=event_id,
            role='organizer'
        ).first()
        
        if not user_association:
            return jsonify({'error': 'Only organizers can manage attendance'}), 403
        
        # Find and delete attendance record
        attendance = EventAttendance.query.filter_by(
            event_id=event_id,
            user_id=user_id
        ).first()
        
        if not attendance:
            return jsonify({'error': 'Attendance record not found'}), 404
        
        db.session.delete(attendance)
        db.session.commit()
        
        return jsonify({'message': 'Attendance unmarked successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500