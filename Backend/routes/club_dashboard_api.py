from flask import Blueprint, request, jsonify, current_app
from ..models import db, Club, Student
from ..models.association_tables import ClubMembershipStatus, user_club_association
from datetime import datetime
from sqlalchemy.orm import joinedload
from ..middlewares.auth_middleware import token_required
from ..utils.response_utils import make_response
from werkzeug.utils import secure_filename
import os

club_dashboard_api = Blueprint('club_dashboard_api', __name__)

UPLOAD_FOLDER = 'static/uploads/clubs'


def is_user_member_of_any_club(user_id):
    status = db.session.execute(
        db.select(user_club_association.c.status).where(
            (user_club_association.c.user_id == user_id) &
            (user_club_association.c.status == ClubMembershipStatus.APPROVED.value)
        )
    ).scalar()
    return status is not None


def club_to_dict(club, current_user_id=None):
    return {
        'club_id': club.club_id,
        'name': club.name,
        'description': club.description,
        'established_date': club.established_date.isoformat() if club.established_date else None,
        'logo_url': club.logo_url,
        'image_url': club.image_url,
        'club_details': club.club_details,
        'category': club.category,
        'leader_id': club.leader_id,
        'leader_name': club.leader.full_name if club.leader else None,
        'member_count': len(club.approved_members),
        'is_member': current_user_id in [u.user_id for u in club.approved_members] if current_user_id else False,
        'membership_status': None
    }


@club_dashboard_api.route('/clubs', methods=['GET'])
@token_required
def get_all_clubs(current_user):
    clubs = Club.query.options(joinedload(Club.leader)).all()
    user_id = current_user.user_id
    result = []

    for club in clubs:
        club_data = club_to_dict(club, current_user_id=user_id)

        status = db.session.execute(
            db.select(user_club_association.c.status).where(
                (user_club_association.c.user_id == user_id) &
                (user_club_association.c.club_id == club.club_id)
            )
        ).scalar()

        club_data['membership_status'] = status.value if status else None
        result.append(club_data)

    return make_response(data=result, status_code=200)


@club_dashboard_api.route('/clubs', methods=['POST'])
@token_required
def create_club(current_user):
    try:
        user_id = current_user.user_id  # From token middleware

        # Check if user is already a member of a club
        if is_user_member_of_any_club(user_id):
            return jsonify({"error": "You are already a member of a club"}), 400

        # Get text fields from FormData
        name = request.form.get('name')
        description = request.form.get('description')
        category = request.form.get('category')
        club_details = request.form.get('club_details', '')

        if not name or not description or not category:
            return jsonify({"error": "Name, description, and category are required"}), 400

        # Handle file uploads
        logo_file = request.files.get('logo_url')
        image_file = request.files.get('image_url')

        logo_path = None
        image_path = None

        # Ensure upload folder exists
        abs_upload_dir = os.path.join(current_app.root_path, UPLOAD_FOLDER)
        os.makedirs(abs_upload_dir, exist_ok=True)

        # Save logo if provided
        if logo_file:
            logo_filename = f"logo_{datetime.utcnow().timestamp()}_{logo_file.filename}"
            logo_path = os.path.join(UPLOAD_FOLDER, logo_filename)  # relative for DB
            logo_file.save(os.path.join(current_app.root_path, logo_path))

        # Save image if provided
        if image_file:
            image_filename = f"image_{datetime.utcnow().timestamp()}_{image_file.filename}"
            image_path = os.path.join(UPLOAD_FOLDER, image_filename)  # relative for DB
            image_file.save(os.path.join(current_app.root_path, image_path))

        # Create the club
        new_club = Club(
            name=name,
            description=description,
            category=category,
            club_details=club_details,
            logo_url=logo_path,
            image_url=image_path,
            established_date=datetime.utcnow(),
            leader_id=user_id
        )
        db.session.add(new_club)
        db.session.commit()

        # Automatically make the leader a member
        student_obj = Student.query.filter_by(user_id=user_id).first()
        if student_obj:
            stmt = user_club_association.insert().values(
                user_id=user_id,
                club_id=new_club.club_id,
                status=ClubMembershipStatus.APPROVED.value,
                requested_at=datetime.utcnow(),
                processed_at=datetime.utcnow(),
                processed_by=user_id
            )
            db.session.execute(stmt)
        db.session.commit()

        return jsonify({
            "message": "Club created successfully",
            "club": club_to_dict(new_club, current_user_id=user_id)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500



@club_dashboard_api.route('/clubs/<int:club_id>/join', methods=['POST'])
@token_required
def request_to_join_club(current_user, club_id):
    user_id = current_user.user_id
    club = Club.query.get_or_404(club_id)

    if is_user_member_of_any_club(user_id):
        return make_response(error='You are already a member of another club. Cannot join a new one.', status_code=400)

    # Check if an association already exists
    existing = db.session.execute(
        db.select(user_club_association)
        .where(
            (user_club_association.c.user_id == user_id) &
            (user_club_association.c.club_id == club_id)
        )
    ).first()

    if existing:
        status = existing.status.value if hasattr(existing.status, "value") else existing.status

        if status == ClubMembershipStatus.APPROVED.value:
            return make_response(error='Already a member', status_code=400)
        elif status == ClubMembershipStatus.PENDING.value:
            return make_response(error='Join request already pending', status_code=400)
        else:
            # Update status back to pending
            db.session.execute(
                user_club_association.update()
                .where(
                    (user_club_association.c.user_id == user_id) &
                    (user_club_association.c.club_id == club_id)
                )
                .values(status=ClubMembershipStatus.PENDING, requested_at=datetime.utcnow())
            )
            db.session.commit()
            return make_response(message='Join request sent again', status_code=200)

    # Insert a new pending membership
    db.session.execute(
        user_club_association.insert().values(
            user_id=user_id,
            club_id=club_id,
            status=ClubMembershipStatus.PENDING,
            requested_at=datetime.utcnow()
        )
    )
    db.session.commit()

    # Log the join request
    try:
        from ..utils.logging_utils import log_club_join_request
        log_club_join_request(user_id, club_id, club.name)
    except Exception as e:
        print(f"Failed to log join request: {str(e)}")

    # Create notification for the club leader about the join request
    try:
        from ..utils.notification_utils import create_and_broadcast_notification
        from ..models.notification import NotificationType
        from ..models.user import User
        
        # Get the requester's name
        requester = User.query.get(user_id)
        requester_name = "A user"
        if requester:
            if hasattr(requester, 'student') and requester.student:
                requester_name = requester.student.full_name
            elif hasattr(requester, 'faculty') and requester.faculty:
                requester_name = requester.faculty.full_name
            elif hasattr(requester, 'admin') and requester.admin:
                requester_name = requester.admin.full_name
        
        create_and_broadcast_notification(
            user_id=club.leader_id,
            message=f"📝 {requester_name} has requested to join {club.name}. Please review their request.",
            notification_type=NotificationType.CLUB_JOIN_REQUEST,
            related_club_id=club_id,
            related_user_id=user_id
        )
    except Exception as e:
        print(f"Failed to create join request notification: {str(e)}")

    return make_response(message='Join request sent', status_code=200)



@club_dashboard_api.route('/clubs/<int:club_id>/leave', methods=['POST'])
@token_required
def leave_club(current_user, club_id):
    user_id = current_user.user_id
    club = Club.query.get_or_404(club_id)

    if club.leader_id == user_id:
        return make_response(error='Leader cannot leave their own club.', status_code=400)

    status = db.session.execute(
        db.select(user_club_association.c.status).where(
            (user_club_association.c.user_id == user_id) &
            (user_club_association.c.club_id == club_id)
        )
    ).scalar()

    if status != ClubMembershipStatus.APPROVED.value:
        return make_response(error='Not a member or cannot leave', status_code=400)

    db.session.execute(
        user_club_association.delete().where(
            (user_club_association.c.user_id == user_id) &
            (user_club_association.c.club_id == club_id)
        )
    )
    db.session.commit()

    return make_response(message='Left the club successfully', status_code=200)
