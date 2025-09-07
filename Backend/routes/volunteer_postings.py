from flask import Blueprint, request, jsonify
from ..models import db, Event, VolunteerPosting, UserEventAssociation
from ..middlewares.auth_middleware import token_required
from sqlalchemy.exc import SQLAlchemyError

volunteer_postings_bp = Blueprint('volunteer_postings', __name__)

@volunteer_postings_bp.route('/events/<int:event_id>/volunteer-postings', methods=['GET'])
@token_required
def get_volunteer_postings(current_user, event_id):
    try:
        postings = VolunteerPosting.query.filter_by(event_id=event_id).all()
        return jsonify([{
            'posting_id': p.posting_id,
            'title': p.title,
            'description': p.description,
            'requirements': p.requirements,
            'positions_available': p.positions_available,
            'created_at': p.created_at.isoformat()
        } for p in postings])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@volunteer_postings_bp.route('/events/<int:event_id>/volunteer-postings', methods=['POST'])
@token_required
def create_volunteer_posting(current_user, event_id):
    try:
        # Check if event exists and is approved
        event = Event.query.get_or_404(event_id)
        if event.approval_status != 'approved':
            return jsonify({'error': 'Can only create postings for approved events'}), 403
        
        # Check if user is organizer of the event
        association = UserEventAssociation.query.filter_by(
            user_id=current_user.user_id,
            event_id=event_id,
            role='organizer'
        ).first()
        
        if not association:
            return jsonify({'error': 'Only event organizers can create volunteer postings'}), 403
        
        data = request.get_json()
        posting = VolunteerPosting(
            event_id=event_id,
            title=data['title'],
            description=data['description'],
            requirements=data.get('requirements'),
            positions_available=data['positions_available']
        )
        
        db.session.add(posting)
        db.session.commit()
        
        return jsonify({
            'posting_id': posting.posting_id,
            'title': posting.title,
            'description': posting.description,
            'requirements': posting.requirements,
            'positions_available': posting.positions_available,
            'created_at': posting.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@volunteer_postings_bp.route('/events/<int:event_id>/volunteer-postings/<int:posting_id>', methods=['PUT'])
@token_required
def update_volunteer_posting(current_user, event_id, posting_id):
    try:
        # Check if user is organizer
        association = UserEventAssociation.query.filter_by(
            user_id=current_user.user_id,
            event_id=event_id,
            role='organizer'
        ).first()
        
        if not association:
            return jsonify({'error': 'Only event organizers can update volunteer postings'}), 403
        
        posting = VolunteerPosting.query.filter_by(
            posting_id=posting_id,
            event_id=event_id
        ).first_or_404()
        
        data = request.get_json()
        posting.title = data['title']
        posting.description = data['description']
        posting.requirements = data.get('requirements')
        posting.positions_available = data['positions_available']
        
        db.session.commit()
        
        return jsonify({
            'posting_id': posting.posting_id,
            'title': posting.title,
            'description': posting.description,
            'requirements': posting.requirements,
            'positions_available': posting.positions_available,
            'created_at': posting.created_at.isoformat()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@volunteer_postings_bp.route('/events/<int:event_id>/volunteer-postings/<int:posting_id>', methods=['DELETE'])
@token_required
def delete_volunteer_posting(current_user, event_id, posting_id):
    try:
        # Check if user is organizer
        association = UserEventAssociation.query.filter_by(
            user_id=current_user.user_id,
            event_id=event_id,
            role='organizer'
        ).first()
        
        if not association:
            return jsonify({'error': 'Only event organizers can delete volunteer postings'}), 403
        
        posting = VolunteerPosting.query.filter_by(
            posting_id=posting_id,
            event_id=event_id
        ).first_or_404()
        
        db.session.delete(posting)
        db.session.commit()
        
        return jsonify({'message': 'Volunteer posting deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500