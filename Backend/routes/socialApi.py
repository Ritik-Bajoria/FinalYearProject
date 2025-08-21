from flask import Blueprint, request, jsonify
from flask_login import current_user
from ..middlewares.auth_middleware import token_required
from Backend import db
from Backend.models import (
    Event, AdminPosting, VolunteerPosting, VolunteerApplication,
    EventRegistration, Notification, SystemLog, User, UserEventAssociation
)
from datetime import datetime

social_bp = Blueprint('social', __name__)

@social_bp.route('/social/posts', methods=['GET'])
@token_required
def get_social_posts(current_user):
    """Get all events, admin postings, and volunteer postings"""
    try:
        # Get events
        events = Event.query.filter(
            Event.approval_status == 'approved'
        ).all()
        
        # Get admin postings
        admin_postings = AdminPosting.query.filter(
            AdminPosting.is_pinned == True
        ).all()
        
        # Get volunteer postings
        volunteer_postings = VolunteerPosting.query.join(
            Event, VolunteerPosting.event_id == Event.event_id
        ).filter(
            Event.approval_status == 'approved'
        ).all()
        
        # Combine all posts
        posts = []
        
        # Add events
        for event in events:
            # Check user's role in the event
            user_role = get_user_role_in_event(current_user.user_id, event.event_id)
            
            # Check if user is already registered
            registration = EventRegistration.query.filter_by(
                user_id=current_user.user_id,
                event_id=event.event_id
            ).first()
            
            # Determine registration status based on user role
            if user_role == 'organizer':
                registration_status = 'organizer'
            elif user_role == 'volunteer':
                registration_status = 'volunteer'
            elif registration:
                registration_status = registration.status
            else:
                registration_status = 'not_registered'
            
            posts.append({
                'type': 'event',
                'id': event.event_id,
                'title': event.title,
                'description': event.description,
                'event_date': event.event_date.isoformat() if event.event_date else None,
                'venue': event.venue,
                'image_url': event.image_url,
                'registration_status': registration_status,
                'user_role': user_role,  # Add user's role for frontend
                'capacity': event.capacity,
                'current_registrations': event.registration_count
            })
        
        # Add admin postings
        for posting in admin_postings:
            posts.append({
                'type': 'admin',
                'id': posting.posting_id,
                'title': posting.title,
                'content': posting.content,
                'created_at': posting.created_at.isoformat() if posting.created_at else None,
                'is_pinned': posting.is_pinned,
                'admin_name': posting.admin.full_name if posting.admin else 'Admin'
            })
        
        # Add volunteer postings
        for posting in volunteer_postings:
            # Check user's role in the event
            user_role = get_user_role_in_event(current_user.user_id, posting.event_id)
            
            # Check if user has already applied
            application = VolunteerApplication.query.filter_by(
                user_id=current_user.user_id,
                posting_id=posting.posting_id
            ).first()
            
            # Determine application status based on user role
            if user_role == 'organizer':
                application_status = 'organizer'
            elif application:
                application_status = application.status
            else:
                application_status = 'not_applied'
            
            posts.append({
                'type': 'volunteer',
                'id': posting.posting_id,
                'event_id': posting.event_id,
                'event_title': posting.event.title if posting.event else 'Unknown Event',
                'role': posting.role,
                'description': posting.description,
                'slots_available': posting.slots_available,
                'application_status': application_status,
                'user_role': user_role  # Add user's role for frontend
            })
        
        # Sort posts by date (newest first)
        posts.sort(key=lambda x: x.get('event_date', x.get('created_at', '')), reverse=True)
        
        return jsonify(posts)
    
    except Exception as e:
        # Create error system log
        log = SystemLog(
            action_by=current_user.user_id if current_user and hasattr(current_user, 'user_id') else None,
            action_type='error',
            log_type='error',
            description=f'Error fetching social posts: {str(e)}'
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({'error': str(e)}), 500

@social_bp.route('/events/<int:event_id>/register', methods=['POST'])
@token_required
def register_for_event(current_user, event_id):
    """Register for an event"""
    try:
        event = Event.query.get_or_404(event_id)
        
        # Check user's current role in the event
        user_role = get_user_role_in_event(current_user.user_id, event_id)
        
        if user_role in ['organizer', 'volunteer']:
            return jsonify({
                'error': f'Cannot register - you are already a {user_role} for this event',
                'user_role': user_role
            }), 400
        
        # Check if already registered
        existing_registration = EventRegistration.query.filter_by(
            user_id=current_user.user_id,
            event_id=event_id
        ).first()
        
        if existing_registration:
            return jsonify({
                'message': f'Already {existing_registration.status} for this event',
                'status': existing_registration.status
            }), 400
        
        # Check if event is at capacity
        if event.capacity and event.registration_count >= event.capacity:
            return jsonify({
                'error': 'Event is at full capacity'
            }), 400
        
        # Create new registration with pending status
        registration = EventRegistration(
            user_id=current_user.user_id,
            event_id=event_id,
            status='pending',
            registration_time=datetime.utcnow()
        )
        
        db.session.add(registration)
        
        # Create system log
        log = SystemLog(
            action_by=current_user.user_id,
            action_type='event_registration_request',
            log_type='info',
            description=f'User {current_user.full_name} requested registration for event: {event.title}'
        )
        db.session.add(log)
        
        # Create notification for event organizers
        notification = Notification(
            user_id=event.created_by,  # Notify event creator
            message=f'{current_user.full_name} has requested to register for your event "{event.title}"',
            notification_type='event_registration_request',
            related_event_id=event_id,
            related_user_id=current_user.user_id
        )
        db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Registration request sent successfully',
            'status': 'pending'
        })
    
    except Exception as e:
        db.session.rollback()
        
        # Create error system log
        log = SystemLog(
            action_by=current_user.user_id,
            action_type='error',
            log_type='error',
            description=f'Error in event registration: {str(e)}'
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({'error': str(e)}), 500

@social_bp.route('/volunteer/<int:posting_id>/apply', methods=['POST'])
@token_required
def apply_for_volunteer(current_user, posting_id):
    """Apply for a volunteer position"""
    try:
        posting = VolunteerPosting.query.get_or_404(posting_id)
        
        # Check user's current role in the event
        user_role = get_user_role_in_event(current_user.user_id, posting.event_id)
        
        if user_role == 'organizer':
            return jsonify({
                'error': 'Cannot apply - you are already an organizer for this event',
                'user_role': user_role
            }), 400
        
        # Check if already applied
        existing_application = VolunteerApplication.query.filter_by(
            user_id=current_user.user_id,
            posting_id=posting_id
        ).first()
        
        if existing_application:
            return jsonify({
                'message': f'Application already {existing_application.status}',
                'status': existing_application.status
            }), 400
        
        # Check if user is already a volunteer for this event
        if user_role == 'volunteer':
            return jsonify({
                'error': 'You are already a volunteer for this event',
                'user_role': user_role
            }), 400
        
        # Check if there are available slots
        if posting.slots_available <= 0:
            return jsonify({
                'error': 'No volunteer slots available'
            }), 400
        
        # Create new application
        application = VolunteerApplication(
            user_id=current_user.user_id,
            posting_id=posting_id,
            status='pending',
            applied_at=datetime.utcnow()
        )
        
        db.session.add(application)
        
        # Create system log
        log = SystemLog(
            action_by=current_user.user_id,
            action_type='volunteer_application',
            log_type='info',
            description=f'User {current_user.full_name} applied for volunteer role: {posting.role} for event: {posting.event.title if posting.event else "Unknown"}'
        )
        db.session.add(log)
        
        # Create notification for event organizers
        if posting.event and posting.event.created_by:
            notification = Notification(
                user_id=posting.event.created_by,
                message=f'{current_user.full_name} has applied for the volunteer role "{posting.role}" for your event "{posting.event.title}"',
                notification_type='volunteer_application',
                related_event_id=posting.event_id,
                related_user_id=current_user.user_id
            )
            db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Volunteer application submitted successfully',
            'status': 'pending'
        })
    
    except Exception as e:
        db.session.rollback()
        
        # Create error system log
        log = SystemLog(
            action_by=current_user.user_id,
            action_type='error',
            log_type='error',
            description=f'Error in volunteer application: {str(e)}'
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({'error': str(e)}), 500

@social_bp.route('/user/registrations', methods=['GET'])
@token_required
def get_user_registrations(current_user):
    """Get user's event registrations and volunteer applications"""
    try:
        # Get event registrations
        event_registrations = EventRegistration.query.filter_by(
            user_id=current_user.user_id
        ).join(Event).all()
        
        events = []
        for reg in event_registrations:
            events.append({
                'event_id': reg.event.event_id,
                'title': reg.event.title,
                'event_date': reg.event.event_date.isoformat() if reg.event.event_date else None,
                'status': reg.status,
                'type': 'event'
            })
        
        # Get volunteer applications
        volunteer_applications = VolunteerApplication.query.filter_by(
            user_id=current_user.user_id
        ).join(VolunteerPosting).join(Event).all()
        
        volunteers = []
        for app in volunteer_applications:
            volunteers.append({
                'posting_id': app.posting_id,
                'event_title': app.posting.event.title if app.posting and app.posting.event else 'Unknown',
                'role': app.posting.role if app.posting else 'Unknown',
                'status': app.status,
                'type': 'volunteer'
            })
        
        # Get user's event roles (organizer/volunteer)
        user_associations = UserEventAssociation.query.filter_by(
            user_id=current_user.user_id
        ).join(Event).all()
        
        roles = []
        for assoc in user_associations:
            roles.append({
                'event_id': assoc.event.event_id,
                'title': assoc.event.title,
                'event_date': assoc.event.event_date.isoformat() if assoc.event.event_date else None,
                'role': assoc.role,
                'type': 'role_association'
            })
        
        return jsonify({
            'events': events,
            'volunteers': volunteers,
            'roles': roles
        })
    
    except Exception as e:
        # Create error system log
        log = SystemLog(
            action_by=current_user.user_id,
            action_type='error',
            log_type='error',
            description=f'Error fetching user registrations: {str(e)}'
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({'error': str(e)}), 500

def get_user_role_in_event(user_id, event_id):
    """
    Returns the role of a given user in a specific event.
    If no association is found, returns None.
    """
    association = UserEventAssociation.query.filter_by(
        user_id=user_id,
        event_id=event_id
    ).first()

    return association.role if association else None