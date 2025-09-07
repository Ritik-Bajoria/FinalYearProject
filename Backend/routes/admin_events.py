from flask import Blueprint, jsonify, request
from ..models import db, User, Event, EventRegistration, SystemLog, Club, EventTag, EventDocument, EventBudget, BudgetAllocation, Attendance, Feedback, Message
from ..middlewares.auth_middleware import token_required, admin_required
from ..utils.log_action import log_action
from ..utils.response_utils import make_response  # Import the make_response function
from sqlalchemy.orm import joinedload
from datetime import datetime

admin_events_bp = Blueprint('admin_events', __name__, url_prefix='/admin')

@admin_events_bp.route('/events', methods=['GET'])
@token_required
@admin_required
def get_all_events(current_user):
    """
    Get all events with filtering by approval status
    """
    try:
        page = request.args.get('page', default=1, type=int)
        limit = request.args.get('limit', default=10, type=int)
        search = request.args.get('search', default='', type=str)
        approval_status = request.args.get('approval_status', default=None, type=str)
        category = request.args.get('category', default=None, type=str)
        event_status = request.args.get('event_status', default=None, type=str)
        
        query = Event.query.options(
            joinedload(Event.event_tags),
            joinedload(Event.documents),
            joinedload(Event.budget),
            joinedload(Event.budget_allocations)
        )
        
        # Apply filters
        if search:
            query = query.filter(Event.title.ilike(f'%{search}%'))
        
        if approval_status:
            query = query.filter_by(approval_status=approval_status)
        
        if category:
            query = query.filter_by(category=category)
        
        if event_status:
            query = query.filter_by(event_status=event_status)
        
        # Order by creation date (newest first)
        query = query.order_by(Event.created_at.desc())
        
        paginated_events = query.paginate(page=page, per_page=limit, error_out=False)
        
        events = []
        for event in paginated_events.items:
            # Get organizer details
            organizer = User.query.get(event.created_by)
            organizer_name = None
            organizer_email = None
            if organizer:
                if organizer.student:
                    organizer_name = organizer.student.full_name
                    organizer_email = organizer.email
                elif organizer.faculty:
                    organizer_name = organizer.faculty.full_name
                    organizer_email = organizer.email
                elif organizer.admin:
                    organizer_name = organizer.admin.full_name
                    organizer_email = organizer.email
            
            # Get club details
            club_name = None
            if event.club_id:
                club = Club.query.get(event.club_id)
                club_name = club.name if club else None
            
            # Get registration count
            registration_count = EventRegistration.query.filter_by(event_id=event.event_id).count()
            
            # Get attendance count
            attendance_count = Attendance.query.filter_by(event_id=event.event_id).count()
            
            # Get feedback count
            feedback_count = Feedback.query.filter_by(event_id=event.event_id).count()
            
            # Get message count
            message_count = Message.query.filter_by(event_id=event.event_id).count()
            
            event_data = {
                'event_id': event.event_id,
                'title': event.title,
                'description': event.description,
                'image_url': event.image_url,
                'venue': event.venue,
                'category': event.category,
                'visibility': event.visibility,
                'date': event.date.isoformat() if event.date else None,
                'time': event.time.isoformat() if event.time else None,
                'end_date': event.end_date.isoformat() if event.end_date else None,
                'event_date': event.event_date.isoformat() if event.event_date else None,
                'duration_minutes': event.duration_minutes,
                'registration_end_date': event.registration_end_date.isoformat() if event.registration_end_date else None,
                'created_at': event.created_at.isoformat() if event.created_at else None,
                'event_status': event.event_status,
                'approval_status': event.approval_status,
                'is_recurring': event.is_recurring,
                'is_certified': event.is_certified,
                'qr_check_in_enabled': event.qr_check_in_enabled,
                'target_audience': event.target_audience,
                'capacity': event.capacity,
                'estimated_budget': float(event.estimated_budget) if event.estimated_budget else None,
                'actual_spent': float(event.actual_spent) if event.actual_spent else None,
                'organizer': {
                    'id': event.created_by,
                    'name': organizer_name,
                    'email': organizer_email
                },
                'club': {
                    'id': event.club_id,
                    'name': club_name
                },
                'stats': {
                    'registration_count': registration_count,
                    'attendance_count': attendance_count,
                    'feedback_count': feedback_count,
                    'message_count': message_count
                },
                'tags': [tag.name for tag in event.event_tags] if event.event_tags else [],
                'documents_count': len(event.documents) if event.documents else 0,
                'budget_allocations_count': len(event.budget_allocations) if event.budget_allocations else 0
            }
            
            events.append(event_data)
        
        response_data = {
            'events': events,
            'total': paginated_events.total,
            'pages': paginated_events.pages,
            'current_page': page,
            'per_page': limit
        }
        
        return make_response(data=response_data, message="Events retrieved successfully")
    
    except Exception as e:
        return make_response(error=f"Failed to retrieve events: {str(e)}", status_code=500)

@admin_events_bp.route('/events/<int:event_id>', methods=['GET'])
@token_required
@admin_required
def get_event_details(current_user, event_id):
    """
    Get detailed information about a specific event
    """
    try:
        event = Event.query.options(
            joinedload(Event.event_tags),
            joinedload(Event.documents),
            joinedload(Event.budget),
            joinedload(Event.budget_allocations),
            joinedload(Event.registrations),
            joinedload(Event.attendances),
            joinedload(Event.feedbacks),
            joinedload(Event.messages)
        ).get(event_id)
        
        if not event:
            return make_response(error="Event not found", status_code=404)
        
        # Get organizer details
        organizer = User.query.get(event.created_by)
        organizer_name = None
        organizer_email = None
        if organizer:
            if organizer.student:
                organizer_name = organizer.student.full_name
                organizer_email = organizer.email
            elif organizer.faculty:
                organizer_name = organizer.faculty.full_name
                organizer_email = organizer.email
            elif organizer.admin:
                organizer_name = organizer.admin.full_name
                organizer_email = organizer.email
        
        # Get club details
        club_name = None
        if event.club_id:
            club = Club.query.get(event.club_id)
            club_name = club.name if club else None
        
        # Get registrations with user details
        registrations = []
        for reg in event.registrations:
            user = User.query.get(reg.user_id)
            user_name = None
            if user:
                if user.student:
                    user_name = user.student.full_name
                elif user.faculty:
                    user_name = user.faculty.full_name
                elif user.admin:
                    user_name = user.admin.full_name
            
            registrations.append({
                'registration_id': reg.registration_id,
                'user_id': reg.user_id,
                'user_name': user_name,
                'registration_date': reg.registration_date.isoformat() if reg.registration_date else None,
                'status': reg.status
            })
        
        # Get attendances
        attendances = []
        for att in event.attendances:
            user = User.query.get(att.user_id)
            user_name = None
            if user:
                if user.student:
                    user_name = user.student.full_name
                elif user.faculty:
                    user_name = user.faculty.full_name
                elif user.admin:
                    user_name = user.admin.full_name
            
            attendances.append({
                'attendance_id': att.attendance_id,
                'user_id': att.user_id,
                'user_name': user_name,
                'check_in_time': att.check_in_time.isoformat() if att.check_in_time else None,
                'check_out_time': att.check_out_time.isoformat() if att.check_out_time else None
            })
        
        # Get feedbacks
        feedbacks = []
        for fb in event.feedbacks:
            user = User.query.get(fb.user_id)
            user_name = None
            if user:
                if user.student:
                    user_name = user.student.full_name
                elif user.faculty:
                    user_name = user.faculty.full_name
                elif user.admin:
                    user_name = user.admin.full_name
            
            feedbacks.append({
                'feedback_id': fb.feedback_id,
                'user_id': fb.user_id,
                'user_name': user_name,
                'rating': fb.rating,
                'comment': fb.comment,
                'created_at': fb.created_at.isoformat() if fb.created_at else None
            })
        
        # Get documents
        documents = []
        for doc in event.documents:
            documents.append({
                'document_id': doc.document_id,
                'title': doc.title,
                'file_url': doc.file_url,
                'file_type': doc.file_type,
                'uploaded_at': doc.uploaded_at.isoformat() if doc.uploaded_at else None
            })
        
        # Get budget allocations
        budget_allocations = []
        for alloc in event.budget_allocations:
            budget_allocations.append({
                'allocation_id': alloc.allocation_id,
                'amount': float(alloc.amount) if alloc.amount else None,
                'note': alloc.note,
                'allocated_at': alloc.allocated_at.isoformat() if alloc.allocated_at else None
            })
        
        event_data = {
            'event_id': event.event_id,
            'title': event.title,
            'description': event.description,
            'image_url': event.image_url,
            'venue': event.venue,
            'category': event.category,
            'visibility': event.visibility,
            'date': event.date.isoformat() if event.date else None,
            'time': event.time.isoformat() if event.time else None,
            'end_date': event.end_date.isoformat() if event.end_date else None,
            'event_date': event.event_date.isoformat() if event.event_date else None,
            'duration_minutes': event.duration_minutes,
            'registration_end_date': event.registration_end_date.isoformat() if event.registration_end_date else None,
            'created_at': event.created_at.isoformat() if event.created_at else None,
            'event_status': event.event_status,
            'approval_status': event.approval_status,
            'is_recurring': event.is_recurring,
            'is_certified': event.is_certified,
            'qr_check_in_enabled': event.qr_check_in_enabled,
            'target_audience': event.target_audience,
            'capacity': event.capacity,
            'estimated_budget': float(event.estimated_budget) if event.estimated_budget else None,
            'actual_spent': float(event.actual_spent) if event.actual_spent else None,
            'organizer': {
                'id': event.created_by,
                'name': organizer_name,
                'email': organizer_email
            },
            'club': {
                'id': event.club_id,
                'name': club_name
            },
            'tags': [tag.name for tag in event.event_tags] if event.event_tags else [],
            'registrations': registrations,
            'attendances': attendances,
            'feedbacks': feedbacks,
            'documents': documents,
            'budget_allocations': budget_allocations
        }
        
        return make_response(data=event_data, message="Event details retrieved successfully")
    
    except Exception as e:
        return make_response(error=f"Failed to retrieve event details: {str(e)}", status_code=500)

@admin_events_bp.route('/events/<int:event_id>/approval-status', methods=['PATCH'])
@token_required
@admin_required
def update_event_approval_status(current_user, event_id):
    """
    Update event approval status (pending, approved, rejected)
    """
    try:
        data = request.get_json()
        approval_status = data.get('approval_status')
        
        if not approval_status:
            return make_response(error="approval_status is required", status_code=400)
        
        if approval_status not in ['pending', 'approved', 'rejected']:
            return make_response(error="Invalid approval_status. Must be pending, approved, or rejected", status_code=400)
        
        event = Event.query.get(event_id)
        if not event:
            return make_response(error="Event not found", status_code=404)
        
        old_status = event.approval_status
        event.approval_status = approval_status
        
        db.session.commit()
        
        # Log the action
        log_action(
            current_user.user_id, 
            'success', 
            f'Changed event {event_id} approval status from {old_status} to {approval_status}'
        )
        
        response_data = {
            'event_id': event_id,
            'old_status': old_status,
            'new_status': approval_status
        }
        
        return make_response(data=response_data, message=f"Event approval status updated from {old_status} to {approval_status}")
        
    except Exception as e:
        db.session.rollback()
        return make_response(error=f"Failed to update event status: {str(e)}", status_code=500)

@admin_events_bp.route('/events/pending', methods=['GET'])
@token_required
@admin_required
def get_pending_events(current_user):
    """
    Get all events with pending approval status
    """
    try:
        page = request.args.get('page', default=1, type=int)
        limit = request.args.get('limit', default=10, type=int)
        
        query = Event.query.filter_by(approval_status='pending').options(
            joinedload(Event.event_tags)
        ).order_by(Event.created_at.desc())
        
        paginated_events = query.paginate(page=page, per_page=limit, error_out=False)
        
        events = []
        for event in paginated_events.items:
            # Get organizer details
            organizer = User.query.get(event.created_by)
            organizer_name = None
            if organizer:
                if organizer.student:
                    organizer_name = organizer.student.full_name
                elif organizer.faculty:
                    organizer_name = organizer.faculty.full_name
                elif organizer.admin:
                    organizer_name = organizer.admin.full_name
            
            events.append({
                'event_id': event.event_id,
                'title': event.title,
                'description': event.description,
                'venue': event.venue,
                'category': event.category,
                'event_date': event.event_date.isoformat() if event.event_date else None,
                'created_at': event.created_at.isoformat() if event.created_at else None,
                'organizer': {
                    'id': event.created_by,
                    'name': organizer_name
                },
                'tags': [tag.name for tag in event.event_tags] if event.event_tags else []
            })
        
        response_data = {
            'events': events,
            'total': paginated_events.total,
            'pages': paginated_events.pages,
            'current_page': page,
            'per_page': limit
        }
        
        return make_response(data=response_data, message="Pending events retrieved successfully")
    
    except Exception as e:
        return make_response(error=f"Failed to retrieve pending events: {str(e)}", status_code=500)

@admin_events_bp.route('/events/rejected', methods=['GET'])
@token_required
@admin_required
def get_rejected_events(current_user):
    """
    Get all events with rejected approval status
    """
    try:
        page = request.args.get('page', default=1, type=int)
        limit = request.args.get('limit', default=10, type=int)
        
        query = Event.query.filter_by(approval_status='rejected').options(
            joinedload(Event.event_tags)
        ).order_by(Event.created_at.desc())
        
        paginated_events = query.paginate(page=page, per_page=limit, error_out=False)
        
        events = []
        for event in paginated_events.items:
            # Get organizer details
            organizer = User.query.get(event.created_by)
            organizer_name = None
            if organizer:
                if organizer.student:
                    organizer_name = organizer.student.full_name
                elif organizer.faculty:
                    organizer_name = organizer.faculty.full_name
                elif organizer.admin:
                    organizer_name = organizer.admin.full_name
            
            events.append({
                'event_id': event.event_id,
                'title': event.title,
                'description': event.description,
                'venue': event.venue,
                'category': event.category,
                'event_date': event.event_date.isoformat() if event.event_date else None,
                'created_at': event.created_at.isoformat() if event.created_at else None,
                'organizer': {
                    'id': event.created_by,
                    'name': organizer_name
                },
                'tags': [tag.name for tag in event.event_tags] if event.event_tags else []
            })
        
        response_data = {
            'events': events,
            'total': paginated_events.total,
            'pages': paginated_events.pages,
            'current_page': page,
            'per_page': limit
        }
        
        return make_response(data=response_data, message="Rejected events retrieved successfully")
    
    except Exception as e:
        return make_response(error=f"Failed to retrieve rejected events: {str(e)}", status_code=500)

@admin_events_bp.route('/events/approved', methods=['GET'])
@token_required
@admin_required
def get_approved_events(current_user):
    """
    Get all events with approved approval status
    """
    try:
        page = request.args.get('page', default=1, type=int)
        limit = request.args.get('limit', default=10, type=int)
        
        query = Event.query.filter_by(approval_status='approved').options(
            joinedload(Event.event_tags)
        ).order_by(Event.created_at.desc())
        
        paginated_events = query.paginate(page=page, per_page=limit, error_out=False)
        
        events = []
        for event in paginated_events.items:
            # Get organizer details
            organizer = User.query.get(event.created_by)
            organizer_name = None
            if organizer:
                if organizer.student:
                    organizer_name = organizer.student.full_name
                elif organizer.faculty:
                    organizer_name = organizer.faculty.full_name
                elif organizer.admin:
                    organizer_name = organizer.admin.full_name
            
            events.append({
                'event_id': event.event_id,
                'title': event.title,
                'description': event.description,
                'venue': event.venue,
                'category': event.category,
                'event_date': event.event_date.isoformat() if event.event_date else None,
                'created_at': event.created_at.isoformat() if event.created_at else None,
                'organizer': {
                    'id': event.created_by,
                    'name': organizer_name
                },
                'tags': [tag.name for tag in event.event_tags] if event.event_tags else []
            })
        
        response_data = {
            'events': events,
            'total': paginated_events.total,
            'pages': paginated_events.pages,
            'current_page': page,
            'per_page': limit
        }
        
        return make_response(data=response_data, message="Approved events retrieved successfully")
    
    except Exception as e:
        return make_response(error=f"Failed to retrieve approved events: {str(e)}", status_code=500)

@admin_events_bp.route('/events/<int:event_id>/chat', methods=['GET'])
@token_required
@admin_required
def get_event_chat_messages(current_user, event_id):
    """
    Get chat messages for a specific event and chat type
    """
    try:
        chat_type = request.args.get('chat_type', 'organizer_admin')
        
        # Verify the event exists
        event = Event.query.get(event_id)
        if not event:
            return make_response(error="Event not found", status_code=404)
        
        # Get chat messages
        from ..models.event_chat import EventChat
        messages = EventChat.query.filter_by(
            event_id=event_id,
            chat_type=chat_type
        ).order_by(EventChat.timestamp.asc()).all()
        
        # Format messages
        formatted_messages = []
        for msg in messages:
            # Get sender details
            sender = User.query.get(msg.sender_id)
            sender_name = None
            if sender:
                if sender.student:
                    sender_name = sender.student.full_name
                elif sender.faculty:
                    sender_name = sender.faculty.full_name
                elif sender.admin:
                    sender_name = sender.admin.full_name
            
            formatted_messages.append({
                'id': msg.id,
                'event_id': msg.event_id,
                'sender_id': msg.sender_id,
                'sender_name': sender_name,
                'message': msg.message,
                'chat_type': msg.chat_type,
                'timestamp': msg.timestamp.isoformat()
            })
        
        return make_response(data=formatted_messages, message="Chat messages retrieved successfully")
    
    except Exception as e:
        return make_response(error=f"Failed to retrieve chat messages: {str(e)}", status_code=500)

@admin_events_bp.route('/events/<int:event_id>/chat', methods=['POST'])
@token_required
@admin_required
def send_event_chat_message(current_user, event_id):
    """
    Send a message to event chat (admin endpoint)
    """
    try:
        data = request.get_json()
        
        if not data:
            return make_response(error="No data provided", status_code=400)
        
        message_text = data.get('message')
        chat_type = data.get('chat_type', 'organizer_admin')
        
        if not message_text:
            return make_response(error="Message text is required", status_code=400)
        
        # Verify the event exists
        event = Event.query.get(event_id)
        if not event:
            return make_response(error="Event not found", status_code=404)
        
        # Save message to database
        from ..models.event_chat import EventChat
        new_message = EventChat(
            event_id=event_id,
            sender_id=current_user.user_id,
            message=message_text,
            chat_type=chat_type,
            timestamp=datetime.utcnow()
        )
        
        db.session.add(new_message)
        db.session.commit()
        
        # Get sender details
        sender = User.query.get(current_user.user_id)
        sender_name = None
        if sender:
            if sender.student:
                sender_name = sender.student.full_name
            elif sender.faculty:
                sender_name = sender.faculty.full_name
            elif sender.admin:
                sender_name = sender.admin.full_name
        
        # Prepare response
        response_data = {
            'id': new_message.id,
            'event_id': new_message.event_id,
            'sender_id': new_message.sender_id,
            'sender_name': sender_name,
            'message': new_message.message,
            'chat_type': new_message.chat_type,
            'timestamp': new_message.timestamp.isoformat()
        }
        
        return make_response(data=response_data, message="Message sent successfully")
        
    except Exception as e:
        db.session.rollback()
        return make_response(error=f"Failed to send message: {str(e)}", status_code=500)