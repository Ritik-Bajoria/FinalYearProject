from flask import Blueprint, request
from ..middlewares.auth_middleware import token_required
from sqlalchemy.orm import joinedload
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
import os
from werkzeug.utils import secure_filename

from ..models.event import Event
from ..models.user import User
from ..models.club import Club
from ..models.event_chat import EventChat
from ..models.event_document import EventDocument
from ..models.event_budget import EventBudget
from ..models.event_registration import EventRegistration
from ..models.user_event_association import UserEventAssociation
from ..models.attendance import Attendance
from ..models.feedback import Feedback
from ..models.volunteer_posting import VolunteerPosting
from ..models.base import db
from ..utils.response_utils import make_response
from ..utils.notification_utils import create_notification

events_bp = Blueprint('events', __name__)

def event_to_dict(event, include_associations=False):
    if not event:
        return None

    creator = User.query.get(event.created_by)

    event_data = {
        "event_id": event.event_id,
        "title": event.title,
        "description": event.description,
        "venue": event.venue,
        "category": event.category,
        "visibility": event.visibility,
        "image_url": event.image_url,
        "date": event.date.isoformat() if event.date else None,
        "time": event.time.isoformat() if event.time else None,
        "end_date": event.end_date.isoformat() if event.end_date else None,
        "event_date": event.event_date.isoformat() if event.event_date else None,
        "duration_minutes": event.duration_minutes,
        "registration_end_date": event.registration_end_date.isoformat() if event.registration_end_date else None,
        "created_at": event.created_at.isoformat() if event.created_at else None,

        # Status
        "event_status": event.event_status,
        "approval_status": event.approval_status,
        "is_recurring": event.is_recurring,
        "is_certified": event.is_certified,
        "qr_check_in_enabled": event.qr_check_in_enabled,

        # Target
        "target_audience": event.target_audience,
        "capacity": event.capacity,

        # Budget
        "estimated_budget": str(event.estimated_budget) if event.estimated_budget else None,
        "actual_spent": str(event.actual_spent) if event.actual_spent else None,

        # Creator
        "created_by": event.created_by,
        "created_by_name": creator.full_name if creator else None,

        # Meta
        "registration_count": event.registration_count,
    }

    if include_associations:
        # Organizers/Admins
        organizers = UserEventAssociation.query.filter_by(event_id=event.event_id).all()
        event_data["organizers"] = [
            {
                "user_id": assoc.user_id,
                "role": assoc.role,
                "user_name": assoc.user.full_name if assoc.user else None
            }
            for assoc in organizers
        ]

        # Registered attendees
        registrations = EventRegistration.query.filter_by(event_id=event.event_id).all()
        event_data["attendees"] = [
            {
                "user_id": reg.user_id,
                "user_name": reg.user.full_name if reg.user else None,
                "status": reg.status
            }
            for reg in registrations
        ]

    return event_data

# Get event details with all associations
@events_bp.route('/<int:event_id>', methods=['GET'])
@token_required
def get_event_details(current_user, event_id):
    try:
        current_user_id = current_user.user_id
        
        event = Event.query.options(
            joinedload(Event.user_associations).joinedload(UserEventAssociation.user),
            joinedload(Event.budget),
            joinedload(Event.documents),
            joinedload(Event.event_tags),
            joinedload(Event.registrations),
            joinedload(Event.feedbacks)
        ).filter_by(event_id=event_id).first()
        
        if not event:
            return make_response(message="Event not found", error="Event not found", status_code=404)
        
        # Check if user has access to this event
        user_association = UserEventAssociation.query.filter_by(
            user_id=current_user_id, 
            event_id=event_id
        ).first()
        
        # Check if user is either organizer or event creator
        if not (
            (user_association and user_association.role == "organizer") 
            or event.created_by == current_user_id
        ):
            return make_response(message="Access denied", error="Access denied", status_code=403)
        
        # Get user's role in this event
        user_role = user_association.role if user_association else 'creator'
        
        # Serialize event data
        event_data = {
            'event_id': event.event_id,
            'title': event.title,
            'description': event.description,
            'image_url': event.image_url,
            'venue': event.venue,
            'category': event.category,
            'event_date': event.event_date.isoformat() if event.event_date else None,
            'duration_minutes': event.duration_minutes,
            'registration_end_date': event.registration_end_date.isoformat() if event.registration_end_date else None,
            'event_status': event.event_status,
            'approval_status': event.approval_status,
            'is_certified': event.is_certified,
            'qr_check_in_enabled': event.qr_check_in_enabled,
            'target_audience': event.target_audience,
            'capacity': event.capacity,
            'estimated_budget': float(event.estimated_budget) if event.estimated_budget else 0,
            'actual_spent': float(event.actual_spent) if event.actual_spent else 0,
            'registration_count': len(event.registrations),
            'user_role': user_role,
            'club_id': event.club_id,
            'created_by': event.created_by,
            'user_associations': [{
                'user_id': ua.user_id,
                'role': ua.role,
                'user': {
                    'full_name': ua.user.full_name,
                    'email': ua.user.email
                }
            } for ua in event.user_associations],
            'budget': {
                'budget_id': event.budget.budget_id,
                'allocated_amount': float(event.budget.allocated_amount),
                'spent_amount': float(event.budget.spent_amount),
                'remaining_budget': event.budget.remaining_budget
            } if event.budget else None,
            'documents': [{
                'document_id': doc.document_id,
                'file_name': doc.file_name,
                'file_path': doc.file_path,
                'uploaded_by': doc.uploaded_by,
                'uploaded_at': doc.uploaded_at.isoformat()
            } for doc in event.documents],
            'event_tags': [tag.tag_name for tag in event.event_tags]
        }
        
        return make_response(data=event_data)
        
    except Exception as e:
        return make_response(message=f"Failed to get event details: {str(e)}", error=str(e), status_code=500)

# Get event chats based on user role
@events_bp.route('/<int:event_id>/chats/<chat_type>', methods=['GET'])
@token_required
def get_event_chats(current_user, event_id, chat_type):
    try:
        current_user_id = current_user.user_id
        
        # Verify user has access to this event
        user_association = UserEventAssociation.query.filter_by(
            user_id=current_user_id, 
            event_id=event_id
        ).first()
        
        if not user_association:
            return make_response(message="Access denied", error="Access denied", status_code=403)
        
        # Validate chat type based on user role
        valid_chat_types = {
            'organizer': ['organizer_admin', 'organizer_volunteer'],
            'volunteer': ['organizer_volunteer'],
            'attendee': ['attendee_only']
        }
        
        if chat_type not in valid_chat_types.get(user_association.role, []):
            return make_response(message="Access denied to this chat", error="Access denied to this chat", status_code=403)
        
        # Get messages for this chat type
        chats = EventChat.query.filter_by(
            event_id=event_id,
            chat_type=chat_type
        ).order_by(EventChat.timestamp.asc()).all()
        
        messages = [{
            'message_id': chat.id,
            'sender_id': chat.sender_id,
            'sender_name': chat.sender.full_name,
            'message': chat.message,
            'timestamp': chat.timestamp.isoformat(),
            'chat_type': chat.chat_type
        } for chat in chats]
        
        return make_response(data=messages)
        
    except Exception as e:
        return make_response(message=f"Failed to get chats: {str(e)}", error=str(e), status_code=500)

# Send message to event chat
@events_bp.route('/<int:event_id>/chats/<chat_type>', methods=['POST'])
@token_required
def send_event_message(current_user, event_id, chat_type):
    try:
        current_user_id = current_user.user_id
        data = request.get_json()
        
        # Verify user has access
        user_association = UserEventAssociation.query.filter_by(
            user_id=current_user_id, 
            event_id=event_id
        ).first()
        
        if not user_association:
            return make_response(message="Access denied", error="Access denied", status_code=403)
        
        # Validate chat type access
        valid_chat_types = {
            'organizer': ['organizer_admin', 'organizer_volunteer'],
            'volunteer': ['organizer_volunteer'],
            'attendee': ['attendee_only']
        }
        
        if chat_type not in valid_chat_types.get(user_association.role, []):
            return make_response(message="Access denied to this chat", error="Access denied to this chat", status_code=403)
        
        # Check if event has ended and disable chat
        event = Event.query.get(event_id)
        if event.event_status == 'completed':
            return make_response(message="Chat is disabled for completed events", error="Chat is disabled for completed events", status_code=403)
        
        # Create new message
        new_message = EventChat(
            event_id=event_id,
            sender_id=current_user_id,
            message=data.get('message'),
            chat_type=chat_type
        )
        
        db.session.add(new_message)
        db.session.commit()
        
        return make_response(data={
            'message_id': new_message.id,
            'message': 'Message sent successfully'
        })
        
    except Exception as e:
        return make_response(message=f"Failed to send message: {str(e)}", error=str(e), status_code=500)

# Upload event document
@events_bp.route('/<int:event_id>/documents', methods=['POST'])
@token_required
def upload_event_document(current_user,event_id):
    try:
        current_user_id = current_user.user_id
        
        # Verify user is organizer
        user_association = UserEventAssociation.query.filter_by(
            user_id=current_user_id, 
            event_id=event_id,
            role='organizer'
        ).first()
        
        if not user_association:
            return make_response(message="Only organizers can upload documents", error="Only organizers can upload documents", status_code=403)
        
        if 'file' not in request.files:
            return make_response(message="No file provided", error="No file provided", status_code=400)
        
        file = request.files['file']
        if file.filename == '':
            return make_response(message="No file selected", error="No file selected", status_code=400)
        
        # Save file
        filename = secure_filename(file.filename)
        upload_path = os.path.join('uploads', 'events', str(event_id))
        os.makedirs(upload_path, exist_ok=True)
        file_path = os.path.join(upload_path, filename)
        file.save(file_path)
        
        # Create document record
        document = EventDocument(
            event_id=event_id,
            file_name=filename,
            file_path=file_path,
            uploaded_by=current_user_id
        )
        
        db.session.add(document)
        db.session.commit()
        
        return make_response(data={
            'document_id': document.document_id,
            'message': 'Document uploaded successfully'
        })
        
    except Exception as e:
        return make_response(message=f"Failed to upload document: {str(e)}", error=str(e), status_code=500)

# Get event attendance
@events_bp.route('/<int:event_id>/attendance', methods=['GET'])
@token_required
def get_event_attendance(current_user, event_id):
    try:
        current_user_id = current_user.user_id
        
        # Verify user is organizer
        user_association = UserEventAssociation.query.filter_by(
            user_id=current_user_id, 
            event_id=event_id,
            role='organizer'
        ).first()
        
        if not user_association:
            return make_response(message="Only organizers can view attendance", error="Only organizers can view attendance", status_code=403)
        
        attendances = Attendance.query.filter_by(event_id=event_id).all()
        
        attendance_data = [{
            'user_id': att.user_id,
            'user_name': att.user.full_name,
            'check_in_time': att.check_in_time.isoformat() if att.check_in_time else None,
            'check_out_time': att.check_out_time.isoformat() if att.check_out_time else None,
            'status': att.status
        } for att in attendances]
        
        return make_response(data=attendance_data)
        
    except Exception as e:
        return make_response(message=f"Failed to get attendance: {str(e)}", error=str(e), status_code=500)

# Mark attendance (QR scan)
@events_bp.route('/<int:event_id>/attendance', methods=['POST'])
@token_required
def mark_attendance(current_user, event_id):
    try:
        current_user_id = current_user.user_id
        data = request.get_json()
        
        # Check if user is registered for event
        registration = EventRegistration.query.filter_by(
            event_id=event_id,
            user_id=current_user_id
        ).first()
        
        if not registration:
            return make_response(message="User not registered for this event", error="User not registered for this event", status_code=403)
        
        # Check if attendance already exists
        existing_attendance = Attendance.query.filter_by(
            event_id=event_id,
            user_id=current_user_id
        ).first()
        
        if existing_attendance:
            return make_response(message="Attendance already marked", error="Attendance already marked", status_code=400)
        
        # Create attendance record
        attendance = Attendance(
            event_id=event_id,
            user_id=current_user_id,
            check_in_time=datetime.utcnow(),
            status='present'
        )
        
        db.session.add(attendance)
        db.session.commit()
        
        return make_response(data={'message': 'Attendance marked successfully'})
        
    except Exception as e:
        return make_response(message=f"Failed to mark attendance: {str(e)}", error=str(e), status_code=500)

# Submit event feedback
@events_bp.route('/<int:event_id>/feedback', methods=['POST'])
@token_required
def submit_feedback(current_user, event_id):
    try:
        current_user_id = current_user.user_id
        data = request.get_json()
        
        # Check if user attended the event
        attendance = Attendance.query.filter_by(
            event_id=event_id,
            user_id=current_user_id
        ).first()
        
        if not attendance:
            return make_response(message="Only attendees can submit feedback", error="Only attendees can submit feedback", status_code=403)
        
        # Check if feedback already exists
        existing_feedback = Feedback.query.filter_by(
            event_id=event_id,
            user_id=current_user_id
        ).first()
        
        if existing_feedback:
            return make_response(message="Feedback already submitted", error="Feedback already submitted", status_code=400)
        
        # Create feedback
        feedback = Feedback(
            event_id=event_id,
            user_id=current_user_id,
            rating=data.get('rating'),
            comment=data.get('comment')
        )
        
        db.session.add(feedback)
        db.session.commit()
        
        return make_response(data={'message': 'Feedback submitted successfully'})
        
    except Exception as e:
        return make_response(message=f"Failed to submit feedback: {str(e)}", error=str(e), status_code=500)

# Create volunteer posting
@events_bp.route('/<int:event_id>/volunteer-postings', methods=['POST'])
@token_required
def create_volunteer_posting(current_user, event_id):
    try:
        current_user_id = current_user.user_id
        data = request.get_json()
        
        # Verify user is organizer
        user_association = UserEventAssociation.query.filter_by(
            user_id=current_user_id, 
            event_id=event_id,
            role='organizer'
        ).first()
        
        if not user_association:
            return make_response(message="Only organizers can create volunteer postings", error="Only organizers can create volunteer postings", status_code=403)
        
        # Create volunteer posting
        posting = VolunteerPosting(
            event_id=event_id,
            title=data.get('title'),
            description=data.get('description'),
            requirements=data.get('requirements'),
            positions_available=data.get('positions_available'),
            created_by=current_user_id
        )
        
        db.session.add(posting)
        db.session.commit()
        
        return make_response(data={
            'posting_id': posting.posting_id,
            'message': 'Volunteer posting created successfully'
        })
        
    except Exception as e:
        return make_response(message=f"Failed to create volunteer posting: {str(e)}", error=str(e), status_code=500)

# Get event registrations (for organizers)
@events_bp.route('/<int:event_id>/registrations', methods=['GET'])
@token_required
def get_event_registrations(current_user, event_id):
    try:
        current_user_id = current_user.user_id
        
        # Verify user is organizer
        user_association = UserEventAssociation.query.filter_by(
            user_id=current_user_id, 
            event_id=event_id,
            role='organizer'
        ).first()
        
        if not user_association:
            return make_response(message="Only organizers can view registrations", error="Only organizers can view registrations", status_code=403)
        
        registrations = EventRegistration.query.filter_by(event_id=event_id).all()
        
        registration_data = [{
            'registration_id': reg.registration_id,
            'user_id': reg.user_id,
            'user_name': reg.user.full_name,
            'user_email': reg.user.email,
            'registration_date': reg.registration_date.isoformat(),
            'status': reg.status
        } for reg in registrations]
        
        return make_response(data=registration_data)
        
    except Exception as e:
        return make_response(message=f"Failed to get registrations: {str(e)}", error=str(e), status_code=500)

# Update event registration status
@events_bp.route('/<int:event_id>/registrations/<int:registration_id>', methods=['PUT'])
@token_required
def update_registration_status(current_user, event_id, registration_id):
    try:
        current_user_id = current_user.user_id
        data = request.get_json()
        
        # Verify user is organizer
        user_association = UserEventAssociation.query.filter_by(
            user_id=current_user_id, 
            event_id=event_id,
            role='organizer'
        ).first()
        
        if not user_association:
            return make_response(message="Only organizers can manage registrations", error="Only organizers can manage registrations", status_code=403)
        
        registration = EventRegistration.query.get(registration_id)
        if not registration or registration.event_id != event_id:
            return make_response(message="Registration not found", error="Registration not found", status_code=404)
        
        registration.status = data.get('status')
        db.session.commit()
        
        return make_response(data={'message': 'Registration status updated'})
        
    except Exception as e:
        return make_response(message=f"Failed to update registration: {str(e)}", error=str(e), status_code=500)

# Get QR code for event (for attendees)
@events_bp.route('/<int:event_id>/qr-code', methods=['GET'])
@token_required
def get_event_qr_code(current_user, event_id):
    try:
        current_user_id = current_user.user_id
        
        # Check if user is registered
        registration = EventRegistration.query.filter_by(
            event_id=event_id,
            user_id=current_user_id
        ).first()
        
        if not registration:
            return make_response(message="User not registered for this event", error="User not registered for this event", status_code=403)
        
        # Generate QR code data (you can implement QR generation library)
        qr_data = f"event:{event_id}:user:{current_user_id}:reg:{registration.registration_id}"
        
        return make_response(data={
            'qr_data': qr_data,
            'event_id': event_id,
            'user_id': current_user_id
        })
        
    except Exception as e:
        return make_response(message=f"Failed to generate QR code: {str(e)}", error=str(e), status_code=500)

# Admin routes for event management
@events_bp.route('/admin/all', methods=['GET'])
@token_required
def get_all_events_admin(current_user):
    try:
        current_user_id = current_user.user_id
        
        # Check if user is admin
        user = User.query.get(current_user_id)
        if not user or user.role != 'admin':
            return make_response(message="Admin access required", error="Admin access required", status_code=403)
        
        events = Event.query.options(
            joinedload(Event.user_associations).joinedload(UserEventAssociation.user),
            joinedload(Event.budget),
            joinedload(Event.registrations)
        ).all()
        
        events_data = [{
            'event_id': event.event_id,
            'title': event.title,
            'description': event.description,
            'event_date': event.event_date.isoformat() if event.event_date else None,
            'event_status': event.event_status,
            'approval_status': event.approval_status,
            'registration_count': len(event.registrations),
            'organizers_count': len([ua for ua in event.user_associations if ua.role == 'organizer']),
            'volunteers_count': len([ua for ua in event.user_associations if ua.role == 'volunteer']),
            'attendees_count': len([ua for ua in event.user_associations if ua.role == 'attendee']),
            'estimated_budget': float(event.estimated_budget) if event.estimated_budget else 0,
            'actual_spent': float(event.actual_spent) if event.actual_spent else 0,
            'club_id': event.club_id,
            'created_by': event.created_by
        } for event in events]
        
        return make_response(data=events_data)
        
    except Exception as e:
        return make_response(message=f"Failed to get events: {str(e)}", error=str(e), status_code=500)

# Admin approve/reject event
@events_bp.route('/admin/<int:event_id>/approval', methods=['PUT'])
@token_required
def update_event_approval(current_user,event_id):
    try:
        current_user_id = current_user.user_id
        data = request.get_json()
        
        # Check if user is admin
        user = User.query.get(current_user_id)
        if not user or user.role != 'admin':
            return make_response(message="Admin access required", error="Admin access required", status_code=403)
        
        event = Event.query.get(event_id)
        if not event:
            return make_response(message="Event not found", error="Event not found", status_code=404)
        
        event.approval_status = data.get('approval_status')
        db.session.commit()
        
        # Send notification to event creator
        create_notification(
            user_id=event.created_by,
            title=f"Event {event.approval_status}",
            message=f"Your event '{event.title}' has been {event.approval_status}",
            notification_type='event_approval'
        )
        
        return make_response(data={'message': f'Event {event.approval_status} successfully'})
        
    except Exception as e:
        return make_response(message=f"Failed to update event approval: {str(e)}", error=str(e), status_code=500)


@events_bp.route('/<int:event_id>', methods=['PUT'])
@token_required
def update_event(current_user,event_id):
    try:
        current_user_id = current_user.user_id
        
        # Verify user has permission to update
        event = Event.query.get(event_id)
        if not event:
            return make_response(message="Event not found", error="Event not found", status_code=404)
        
        if event.created_by != current_user_id:
            user_association = UserEventAssociation.query.filter_by(
                user_id=current_user_id,
                event_id=event_id,
                role='organizer_admin'
            ).first()
            if not user_association:
                return make_response(message="Unauthorized to update event", error="Unauthorized", status_code=403)

        data = request.form
        
        # Update event fields
        for field in ['title', 'description', 'venue', 'category']:
            if field in data:
                setattr(event, field, data[field])
        
        # Handle file upload if present
        if 'image' in request.files:
            file = request.files['image']
            if file.filename != '':
                filename = secure_filename(file.filename)
                upload_path = os.path.join('uploads', 'events', str(event_id))
                os.makedirs(upload_path, exist_ok=True)
                file_path = os.path.join(upload_path, filename)
                file.save(file_path)
                event.image_url = file_path

        db.session.commit()
        return make_response(data=event_to_dict(event))
        
    except Exception as e:
        return make_response(message=f"Failed to update event: {str(e)}", error=str(e), status_code=500)

@events_bp.route('/<int:event_id>', methods=['DELETE'])
@token_required
def delete_event(current_user, event_id):
    try:
        current_user_id = current_user.user_id
        
        event = Event.query.get(event_id)
        if not event:
            return make_response(message="Event not found", error="Event not found", status_code=404)
        
        # Only creator or admin can delete
        if event.created_by != current_user_id:
            user = User.query.get(current_user_id)
            if not user or user.role != 'admin':
                return make_response(message="Unauthorized to delete event", error="Unauthorized", status_code=403)

        db.session.delete(event)
        db.session.commit()
        return make_response(data={'message': 'Event deleted successfully'})
        
    except Exception as e:
        return make_response(message=f"Failed to delete event: {str(e)}", error=str(e), status_code=500)