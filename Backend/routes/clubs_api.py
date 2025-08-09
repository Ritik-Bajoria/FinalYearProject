from flask import Blueprint, jsonify, request
from ..models import db, User, Club, Event, Message, Student
from sqlalchemy.orm import joinedload
from datetime import datetime
from ..middlewares.auth_middleware import token_required

my_club_api = Blueprint('my_club_api', __name__)

# Helper: serialize club
def serialize_club(club):
    return {
        'club_id': club.club_id,
        'name': club.name,
        'description': club.description,
        'established_date': club.established_date.isoformat() if club.established_date else None,
        'logo_url': club.logo_url
    }

# Helper: serialize student member
def serialize_member(user):
    student = getattr(user, 'student', None)
    return {
        'user_id': user.user_id,
        'full_name': student.full_name,
        'major': student.major,
        'year_of_study': student.year_of_study,
        'profile_picture': student.profile_picture
    }

# Helper: serialize event
def serialize_event(event):
    return {
        'event_id': event.event_id,
        'title': event.title,
        'description': event.description,
        'event_date': event.event_date.isoformat(),
        'end_date': event.end_date.isoformat() if event.end_date else None,
        'venue': event.venue,
        'category': event.category,
        'visibility': event.visibility
    }

# Helper: serialize message
def serialize_message(message):
    return {
        'message_id': message.message_id,
        'message_text': message.message_text,
        'sender_id': message.sender_id,
        'event_id': message.event_id,
        'sent_at': message.sent_at.isoformat()
    }

# GET: /<user_id>/club
@my_club_api.route('/<int:user_id>/club', methods=['GET'])
def get_user_club(user_id):
    student = Student.query.filter_by(user_id=user_id).first()
    if not student or not student.club_memberships:
        return jsonify(None)

    # Assume single club membership for now
    club = student.club_memberships[0]
    return jsonify(serialize_club(club))


# GET: /<club_id>/events
@my_club_api.route('/<int:club_id>/events', methods=['GET'])
def get_club_events(club_id):
    events = Event.query.filter_by(club_id=club_id).all()
    return jsonify([serialize_event(event) for event in events])


# GET: /<club_id>/members
@my_club_api.route('/<int:club_id>/members', methods=['GET'])
def get_club_members(club_id):
    club = Club.query.options(joinedload(Club.members)).filter_by(club_id=club_id).first()
    if not club:
        return jsonify([])

    return jsonify([serialize_member(member) for member in club.members])


# GET: /<club_id>/messages
@my_club_api.route('/<int:club_id>/messages', methods=['GET'])
def get_club_messages(club_id):
    messages = Message.query \
        .join(Event) \
        .filter(Event.club_id == club_id) \
        .order_by(Message.sent_at.desc()) \
        .all()
    return jsonify([serialize_message(msg) for msg in messages])


# POST: /<club_id>/messages
@my_club_api.route('/<int:club_id>/messages', methods=['POST'])
def post_club_message(club_id):
    data = request.get_json()
    message_text = data.get('message_text')
    sender_id = data.get('sender_id')

    # For simplicity, associate message to the latest event
    latest_event = Event.query.filter_by(club_id=club_id).order_by(Event.event_date.desc()).first()
    if not latest_event:
        return jsonify({'message': 'No events found for this club'}), 400

    msg = Message(
        sender_id=sender_id,
        event_id=latest_event.event_id,
        message_text=message_text,
        sent_at=datetime.utcnow()
    )
    db.session.add(msg)
    db.session.commit()

    return jsonify(serialize_message(msg)), 201

@my_club_api.route('/<int:club_id>/events', methods=['POST'])
@token_required
def create_event(current_user, club_id):
    data = request.get_json()

    required_fields = ['title', 'event_date', 'venue']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required.'}), 400

    try:
        # Parse dates
        event_date = datetime.fromisoformat(data['event_date'])
        end_date = datetime.fromisoformat(data['end_date']) if data.get('end_date') else None

        # Validate capacity
        capacity = int(data.get('capacity', 100))
        if capacity <= 0:
            return jsonify({'error': 'Capacity must be a positive number'}), 400

        event = Event(
            club_id=club_id,
            title=data['title'],
            description=data.get('description', ''),
            event_date=event_date,
            end_date=end_date,
            venue=data['venue'],
            created_by=current_user.user_id,  # Use authenticated user
            category=data.get('category'),
            visibility=data.get('visibility', 'Public'),
            capacity=capacity,
            status='pending'  # Default status
        )

        db.session.add(event)
        db.session.commit()

        return jsonify({
            'success': True,
            'event': {
                'event_id': event.event_id,
                'title': event.title,
                'description': event.description,
                'event_date': event.event_date.isoformat(),
                'end_date': event.end_date.isoformat() if event.end_date else None,
                'venue': event.venue,
                'category': event.category,
                'visibility': event.visibility,
                'capacity': event.capacity,
                'club_id': event.club_id,
                'status': event.status
            }
        }), 201

    except ValueError as e:
        return jsonify({'success': False, 'error': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@my_club_api.route('/<int:club_id>/members/<int:user_id>', methods=['DELETE'])
def remove_member(club_id, user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    club = Club.query.get(club_id)
    if not club:
        return jsonify({'message': 'Club not found'}), 404

    if user not in club.members:
        return jsonify({'message': 'User is not a member of this club'}), 400

    club.members.remove(user)
    db.session.commit()
    return jsonify({'message': 'Left the club successfully'}), 200

