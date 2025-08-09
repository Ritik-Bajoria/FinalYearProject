from flask import Blueprint, request, jsonify
from ..models import db, Club, Student, User
from datetime import datetime
from sqlalchemy.orm import joinedload

club_dashboard_api = Blueprint('club_dashboard_api', __name__)

# GET: Fetch all clubs
@club_dashboard_api.route('/clubDash', methods=['GET'])
def get_all_clubs():
    clubs = Club.query.options(joinedload(Club.members)).all()

    def serialize_club(club):
        return {
            'club_id': club.club_id,
            'name': club.name,
            'description': club.description,
            'category': club.category,
            'created_by': club.organizer_id,
            'member_count': len(club.members)
        }

    return jsonify([serialize_club(club) for club in clubs])

# POST: Join a club
@club_dashboard_api.route('/clubDash/join', methods=['POST'])
def join_club():
    data = request.get_json()
    club_id = data.get('clubId')
    user_id = data.get('userId')

    user = User.query.get(user_id)
    club = Club.query.get(club_id)

    if not user or not club:
        return jsonify({'message': 'Invalid user or club ID'}), 400

    # ❌ Prevent joining if already in any club
    if user.club_memberships and user.club_memberships.count() > 0:
        return jsonify({'message': 'User is already a member of another club'}), 400

    club.members.append(user)
    db.session.commit()

    return jsonify({'message': 'Joined club successfully'}), 200



@club_dashboard_api.route('/clubDash', methods=['POST'])
def create_club():
    data = request.get_json()
    user_id = data.get('created_by')

    if not user_id:
        return jsonify({'message': 'User ID is required.'}), 400

    # ❌ Check if user is already in a club
    existing = Student.query.filter_by(user_id=user_id).first()
    if existing:
        return jsonify({'message': 'You are already a member of another club. Cannot create a new one.'}), 400

    # ✅ Create club
    new_club = Club(
        name=data.get('name'),
        description=data.get('description'),
        category=data.get('category'),
        created_by=user_id
    )
    db.session.add(new_club)
    db.session.commit()

    # ✅ Add creator as member
    creator_member = Student(user_id=user_id, club_id=new_club.id)
    db.session.add(creator_member)
    db.session.commit()

    return jsonify({
        'club_id': new_club.id,
        'name': new_club.name,
        'description': new_club.description,
        'category': new_club.category
    }), 201