from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from Backend import db
from Backend.models import (
    Event, AdminPosting, VolunteerPosting, VolunteerApplication,
    EventRegistration, Notification, SystemLog, User
)
from datetime import datetime

social_bp = Blueprint('social', __name__)

@social_bp.route('/social/posts', methods=['GET'])
@login_required
def get_social_posts():
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
            # Check if user is already registered
            registration = EventRegistration.query.filter_by(
                user_id=current_user.user_id,
                event_id=event.event_id
            ).first()
            
            posts.append({
                'type': 'event',
                'id': event.event_id,
                'title': event.title,
                'description': event.description,
                'event_date': event.event_date.isoformat(),
                'venue': event.venue,
                'image_url': event.image_url,
                'registration_status': registration.status if registration else 'not_registered',
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
                'created_at': posting.created_at.isoformat(),
                'is_pinned': posting.is_pinned,
                'admin_name': posting.admin.full_name if posting.admin else 'Admin'
            })
        
        # Add volunteer postings
        for posting in volunteer_postings:
            # Check if user has already applied
            application = VolunteerApplication.query.filter_by(
                user_id=current_user.user_id,
                posting_id=posting.posting_id
            ).first()
            
            posts.append({
                'type': 'volunteer',
                'id': posting.posting_id,
                'event_id': posting.event_id,
                'event_title': posting.event.title if posting.event else 'Unknown Event',
                'role': posting.role,
                'description': posting.description,
                'slots_available': posting.slots_available,
                'application_status': application.status if application else 'not_applied'
            })
        
        # Sort posts by date (newest first)
        posts.sort(key=lambda x: x.get('event_date', x.get('created_at', '')), reverse=True)
        
        return jsonify(posts)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_bp.route('/events/<int:event_id>/register', methods=['POST'])
@login_required
def register_for_event(event_id):
    """Register for an event"""
    try:
        event = Event.query.get_or_404(event_id)
        
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
            user_id=current_user.user_id,
            action=f'Requested registration for event: {event.title}',
            module='Social',
            details=f'User {current_user.full_name} requested to register for event {event.title}'
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
        return jsonify({'error': str(e)}), 500

@social_bp.route('/volunteer/<int:posting_id>/apply', methods=['POST'])
@login_required
def apply_for_volunteer(posting_id):
    """Apply for a volunteer position"""
    try:
        posting = VolunteerPosting.query.get_or_404(posting_id)
        
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
            user_id=current_user.user_id,
            action=f'Applied for volunteer position: {posting.role}',
            module='Social',
            details=f'User {current_user.full_name} applied for volunteer role {posting.role} for event {posting.event.title if posting.event else "Unknown"}'
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
        return jsonify({'error': str(e)}), 500

@social_bp.route('/user/registrations', methods=['GET'])
@login_required
def get_user_registrations():
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
                'event_date': reg.event.event_date.isoformat(),
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
        
        return jsonify({
            'events': events,
            'volunteers': volunteers
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500