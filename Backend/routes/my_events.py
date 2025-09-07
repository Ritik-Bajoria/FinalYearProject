from flask import Blueprint, jsonify
from ..models import db, Event, UserEventAssociation, EventRegistration
from ..middlewares.auth_middleware import token_required
from datetime import datetime

my_events_bp = Blueprint('my_events', __name__)

@my_events_bp.route('/events/my-events/upcoming', methods=['GET'])
@token_required
def get_upcoming_events(current_user):
    try:
        associations = UserEventAssociation.query.filter_by(
            user_id=current_user.user_id
        ).join(Event).filter(
            Event.event_date > datetime.utcnow()
        ).all()
        
        events = []
        for assoc in associations:
            event = assoc.event
            events.append({
                'event_id': event.event_id,
                'title': event.title,
                'description': event.description,
                'event_date': event.event_date.isoformat(),
                'venue': event.venue,
                'participation_role': assoc.role,
                'status': event.event_status
            })
        
        return jsonify(events)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@my_events_bp.route('/events/my-events/past', methods=['GET'])
@token_required
def get_past_events(current_user):
    try:
        associations = UserEventAssociation.query.filter_by(
            user_id=current_user.user_id
        ).join(Event).filter(
            Event.event_date < datetime.utcnow()
        ).all()
        
        events = []
        for assoc in associations:
            event = assoc.event
            events.append({
                'event_id': event.event_id,
                'title': event.title,
                'description': event.description,
                'event_date': event.event_date.isoformat(),
                'venue': event.venue,
                'participation_role': assoc.role,
                'status': event.event_status
            })
        
        return jsonify(events)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@my_events_bp.route('/events/my-events/volunteer', methods=['GET'])
@token_required
def get_volunteer_events(current_user):
    try:
        associations = UserEventAssociation.query.filter_by(
            user_id=current_user.user_id,
            role='volunteer'
        ).all()
        
        events = []
        for assoc in associations:
            event = assoc.event
            events.append({
                'event_id': event.event_id,
                'title': event.title,
                'description': event.description,
                'event_date': event.event_date.isoformat(),
                'venue': event.venue,
                'volunteer_role': 'Volunteer',
                'volunteer_description': event.description,
                'responsibilities': 'Event support and assistance',
                'status': event.event_status
            })
        
        return jsonify(events)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@my_events_bp.route('/events/my-events/organizer', methods=['GET'])
@token_required
def get_organizer_events(current_user):
    try:
        associations = UserEventAssociation.query.filter_by(
            user_id=current_user.user_id,
            role='organizer'
        ).all()
        
        events = []
        for assoc in associations:
            event = assoc.event
            attendee_count = UserEventAssociation.query.filter_by(
                event_id=event.event_id,
                role='attendee'
            ).count()
            
            events.append({
                'event_id': event.event_id,
                'title': event.title,
                'description': event.description,
                'event_date': event.event_date.isoformat(),
                'venue': event.venue,
                'status': event.approval_status,
                'attendee_count': attendee_count
            })
        
        return jsonify(events)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@my_events_bp.route('/events/my-events', methods=['GET'])
@token_required
def get_my_events(current_user):
    """
    Get all events where the current user is involved as organizer, volunteer, or attendee
    Returns events with participation role and registration count
    """
    try:
        # Get all user event associations
        user_associations = UserEventAssociation.query.filter_by(
            user_id=current_user.user_id
        ).all()
        
        # Get all user registrations for events not in associations
        user_registrations = EventRegistration.query.filter_by(
            user_id=current_user.user_id
        ).all()
        
        # Collect all event IDs and their roles
        event_roles = {}
        
        # Add events from associations (organizer, volunteer roles)
        for assoc in user_associations:
            event_roles[assoc.event_id] = assoc.role
            
        # Add events from registrations (attendee role) if not already added
        for reg in user_registrations:
            if reg.event_id not in event_roles:
                event_roles[reg.event_id] = 'attendee'
        
        if not event_roles:
            return jsonify([]), 200
            
        # Get all events
        events = Event.query.filter(Event.event_id.in_(event_roles.keys())).all()
        
        # Format response to match frontend expectations
        events_data = []
        for event in events:
            # Get registration count for this event
            registration_count = EventRegistration.query.filter_by(
                event_id=event.event_id
            ).count()
            
            event_data = {
                'event_id': event.event_id,
                'title': event.title,
                'description': event.description,
                'venue': event.venue,
                'event_date': event.event_date.isoformat() if event.event_date else None,
                'duration_minutes': event.duration_minutes,
                'capacity': event.capacity,
                'category': event.category,
                'event_status': event.event_status,
                'approval_status': event.approval_status,
                'target_audience': event.target_audience,
                'is_certified': event.is_certified,
                'participation_role': event_roles[event.event_id],
                'registration_count': registration_count,
                'created_at': event.created_at.isoformat() if event.created_at else None,
                'image_url': event.image_url,
                'visibility': event.visibility,
                'club_id': event.club_id,
                'created_by': event.created_by
            }
            events_data.append(event_data)
        
        # Sort events by date (upcoming events first, then past events)
        current_time = datetime.utcnow()
        events_data.sort(key=lambda x: (
            x['event_date'] is None,  # Put events with no date at the end
            datetime.fromisoformat(x['event_date'].replace('Z', '+00:00')) < current_time if x['event_date'] else True,  # Past events after upcoming
            datetime.fromisoformat(x['event_date'].replace('Z', '+00:00')) if x['event_date'] else datetime.max  # Sort by date within each group
        ))
        
        return jsonify(events_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
