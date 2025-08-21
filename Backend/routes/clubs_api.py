# Backend/routes/my_club_api.py
import os
from datetime import datetime, time as dt_time
from flask import Blueprint, jsonify, request, current_app
from werkzeug.utils import secure_filename
from ..models.user_event_association import UserEventAssociation
from ..models import db, User, Club, Event, Student, ClubChat
from ..models.association_tables import user_club_association, ClubMembershipStatus
from sqlalchemy import and_, select
from sqlalchemy.orm import joinedload

from ..middlewares.auth_middleware import token_required
from ..utils.response_utils import make_response

my_club_api = Blueprint('my_club_api', __name__)

# Configuration
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
# UPLOAD_FOLDER = 'static/uploads/clubs'

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper: check if user is approved member of any club
def is_user_member_of_any_club(user_id):
    stmt = select(user_club_association.c.status).where(
        and_(
            user_club_association.c.user_id == user_id,
            user_club_association.c.status == ClubMembershipStatus.APPROVED
        )
    )
    return db.session.execute(stmt).scalar() is not None

# Helper: membership status for a given club
def get_membership_status(user_id, club_id):
    stmt = select(user_club_association.c.status).where(
        and_(
            user_club_association.c.user_id == user_id,
            user_club_association.c.club_id == club_id
        )
    )
    return db.session.execute(stmt).scalar()

# Helper: check leader
def is_club_leader(user_id, club):
    return club.leader_id == user_id

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

@my_club_api.route('/clubs/my', methods=['GET'])
@token_required
def get_my_club(current_user):
    """Return the club(s) that the current user belongs to with detailed info."""
    try:
        user_id = current_user.user_id
        # print(f"Fetching clubs for user: {user_id}")
        # Fetch all clubs where the user is a member
        clubs = (
            Club.query
            .join(Club.members)
            .filter(User.user_id == user_id,
                 get_membership_status(user_id,Club.club_id) == ClubMembershipStatus.APPROVED
                    )
            .all()
        )
        # print('Fetched clubs:', clubs)

        # Format using the helper
        club_list = [club_to_dict(club, current_user_id=user_id) for club in clubs]
        # print('Club list:', club_list)
        return jsonify(club_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------
# Club events
# ---------------------------
@my_club_api.route('/clubs/<int:club_id>/events', methods=['GET'])
@token_required
def list_club_events(current_user, club_id):
    """
    Returns upcoming and past events for the club.
    Query param `type=past|upcoming|all` optional.
    """
    club = Club.query.get_or_404(club_id)
    qtype = request.args.get('type', 'all')

    # basic permission: allow anyone to view club events. If you want to restrict to members, add checks.
    now = datetime.utcnow()
    if qtype == 'past':
        events = Event.query.filter_by(club_id=club_id).filter(Event.event_date < now).order_by(Event.event_date.desc()).all()
    elif qtype == 'upcoming':
        events = Event.query.filter_by(club_id=club_id).filter(Event.event_date >= now).order_by(Event.event_date.asc()).all()
    else:
        events = Event.query.filter_by(club_id=club_id).order_by(Event.event_date.desc()).all()

    # simple serializer
    def event_to_dict(e):
        return {
            'event_id': getattr(e, 'event_id', None),
            'title': getattr(e, 'title', None),
            'description': getattr(e, 'description', None),
            'image_url': getattr(e, 'image_url', None),
            'venue': getattr(e, 'venue', None),
            'date': getattr(e, 'date', None).isoformat() if getattr(e, 'date', None) else None,
            'event_date': getattr(e, 'event_date', None).isoformat() if getattr(e, 'event_date', None) else None,
            'duration_minutes': getattr(e, 'duration_minutes', None),
            'approval_status': getattr(e, 'approval_status', None),
            'event_status': getattr(e, 'event_status', None),
        }

    return make_response(data=[event_to_dict(e) for e in events], status_code=200)

@my_club_api.route('/clubs/<int:club_id>/events', methods=['POST'])
@token_required
def create_club_event(current_user, club_id):
    """
    Leader-only: create event for the club and enroll all club members as organizers.
    Accepts form fields and optional 'image' file.
    Required: title, event_date (ISO or 'YYYY-MM-DD HH:MM:SS' or separate date/time fields)
    """
    club = Club.query.get_or_404(club_id)
    if not is_club_leader(current_user.user_id, club):
        return make_response(error="Only club leader can create events", status_code=403)
    print(request.form.get('category'))
    # read text fields from form
    title = request.form.get('title') or request.form.get('name')
    description = request.form.get('description')
    venue = request.form.get('venue')
    duration = request.form.get('duration_minutes')
    category = request.form.get('category')
    # Prefer combined ISO event_date if provided, else try date+time
    event_date_str = request.form.get('event_date') or request.form.get('date')
    event_time_str = request.form.get('time')
    if not title or not event_date_str:
        return make_response(error="title and event_date are required", status_code=400)

    # parse event_date
    try:
        if "T" in event_date_str:  # ISO datetime with time included
            event_date = datetime.fromisoformat(event_date_str)
            date = event_date.date()
            time_val = event_date.time()
        else:
            # Handle date string
            date = datetime.strptime(event_date_str, "%Y-%m-%d").date()
            
            # Handle time string if provided
            if event_time_str:
                time_val = datetime.strptime(event_time_str, "%H:%M").time()
                event_date = datetime.combine(date, time_val)
            else:
                # fallback to midnight
                time_val = dt_time(0, 0)
                event_date = datetime.combine(date, time_val)
    except Exception:
        return make_response(error="Invalid event_date/time format", status_code=400)

    # handle image file
    image_path = None
    image_file = request.files.get('image')
    if image_file and image_file.filename:
        if not allowed_file(image_file.filename):
            return make_response(error="Invalid image file type", status_code=400)
        upload_folder='static/uploads/events'
        abs_upload_dir = os.path.join(current_app.root_path, upload_folder)
        os.makedirs(abs_upload_dir, exist_ok=True)
        fname = secure_filename(f"event_{int(datetime.utcnow().timestamp())}_{image_file.filename}")
        save_path = os.path.join(upload_folder, fname)
        image_file.save(save_path)
        # store relative path for serving via static route
        image_path = os.path.join(upload_folder, fname).replace('\\', '/')

    # Create Event object
    event = Event(
        title=title,
        description=description,
        venue=venue,
        date=date,
        time=time_val,
        event_date=event_date,
        duration_minutes=int(duration) if duration else None,
        image_url=image_path,
        category=category if category else 'Other',
        club_id=club_id,
        created_by=current_user.user_id,
        approval_status='pending',
        event_status='upcoming'
    )
    db.session.add(event)
    
    # Flush to get the event ID before creating associations
    db.session.flush()
    
    # Get all club members
    club = Club.query.get_or_404(club_id)
    club_members = club.approved_members  # Uses the property in your model
    
    # Create UserEventAssociation for all club members as organizers
    associations = []
    print("id of event : ",event.event_id)
    for member in club_members:
        association = UserEventAssociation(
            user_id=member.user_id,
            event_id=event.event_id,
            role='organizer'
        )
        associations.append(association)
        db.session.add(association)
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return make_response(error=f"Failed to create event: {str(e)}", status_code=500)

    # Log event creation
    try:
        from ..utils.logging_utils import log_event_creation
        log_event_creation(current_user.user_id, event.event_id, event.title, club.name)
    except Exception as e:
        print(f"Failed to log event creation: {str(e)}")

    # Create notifications for all club members about the new event
    try:
        from ..utils.notification_utils import create_event_notification_for_club_members, create_admin_notification
        from ..socket_handlers import notify_club_realtime
        
        # Notify club members
        create_event_notification_for_club_members(event, club)
        
        # Notify admins about new event
        create_admin_notification(
            f"📅 New event '{event.title}' created by {club.name} requires review",
            related_event_id=event.event_id,
            related_club_id=club.club_id,
            related_user_id=current_user.user_id
        )
        
        # Real-time notification to club members
        notify_club_realtime(club.club_id, {
            'type': 'new_event',
            'message': f"New event '{event.title}' created!",
            'event_id': event.event_id,
            'club_id': club.club_id
        })
        
    except Exception as e:
        print(f"Failed to create notifications: {str(e)}")

    return make_response(
        data={
            'event_id': event.event_id,
            'associations_created': len(associations),
            'message': f"Event created with {len(associations)} members enrolled as organizers"
        },
        status_code=201
    )

@my_club_api.route('/clubs/<int:club_id>/events/<int:event_id>', methods=['GET'])
@token_required
def get_club_event_detail(current_user, club_id, event_id):
    event = Event.query.filter_by(club_id=club_id, event_id=event_id).first_or_404()
    data = {
        'event_id': event.event_id,
        'title': event.title,
        'description': event.description,
        'image_url': event.image_url,
        'venue': event.venue,
        'event_date': event.event_date.isoformat() if event.event_date else None,
        'duration_minutes': event.duration_minutes,
        'registration_count': getattr(event, 'registration_count', None),
    }
    return make_response(data=data, status_code=200)

# ---------------------------
# Club chats
# ---------------------------
@my_club_api.route('/clubs/<int:club_id>/initialchats', methods=['GET'])
@token_required
def get_initial_club_chats(current_user, club_id):
    """
    List club chat messages (ordered ascending). Returns sender info and leader tag.
    """
    club = Club.query.get_or_404(club_id)

    # Optional: restrict to members only to view chats
    # status = get_membership_status(current_user.user_id, club_id)
    # if status != ClubMembershipStatus.APPROVED:
    #     return make_response(error="Only members can view chats", status_code=403)

    chats = ClubChat.query.filter_by(club_id=club_id).order_by(ClubChat.sent_at.asc()).all()
    result = []
    for m in chats:
        sender = getattr(m, 'sender_id', None)
        # attempt to fetch user
        user_obj = User.query.filter_by(user_id=sender).first() if sender else None
        sender_name = getattr(user_obj, 'email', None) or getattr(user_obj, 'user_id', None)
        leader_tag = "(leader)" if club.leader_id == sender else ""
        result.append({
            'message_id': getattr(m, 'message_id', None),
            'sender_id': sender,
            'sender_name': sender_name,
            'leader_tag': leader_tag,
            'message_text': getattr(m, 'message_text', None) or getattr(m, 'message', None),
            'sent_at': getattr(m, 'sent_at', None).isoformat() if getattr(m, 'sent_at', None) else None
        })
    return make_response(data=result, status_code=200)

@my_club_api.route('/clubs/<int:club_id>/chats', methods=['GET'])
@token_required
def get_club_chats(current_user, club_id):
    """Only for initial load - real-time updates come via SocketIO"""
    club = Club.query.get_or_404(club_id)
    chats = ClubChat.query.filter_by(club_id=club_id).order_by(ClubChat.sent_at.asc()).all()
    
    result = []
    for m in chats:
        result.append({
            'message_id': m.message_id,
            'sender_id': m.sender_id,
            'sender_name': m.sender.full_name if m.sender else "Unknown",
            'message_text': m.message_text,
            'sent_at': m.sent_at.isoformat(),
            'is_leader': club.leader_id == m.sender_id
        })
    return make_response(data=result, status_code=200)

@my_club_api.route('/clubs/<int:club_id>/chats', methods=['POST'])
@token_required
def post_club_chat(current_user, club_id):
    """
    Post a chat message in club. Must be approved member.
    JSON body: { "message": "..." }
    """
    club = Club.query.get_or_404(club_id)
    status = get_membership_status(current_user.user_id, club_id)
    # print(status)
    print(ClubMembershipStatus.APPROVED)
    if status != ClubMembershipStatus.APPROVED:
        return make_response(error="Only approved members can send messages", status_code=403)

    data = request.json or {}
    text = data.get('message')
    if not text:
        return make_response(error="Message text required", status_code=400)

    chat = ClubChat(
        club_id=club_id,
        sender_id=current_user.user_id,
        message_text=text,
        sent_at=datetime.utcnow()
    )
    db.session.add(chat)
    db.session.commit()

    return make_response(data={'message_id': chat.message_id}, message="Message sent", status_code=201)

# ---------------------------
# Club management (leader-only)
# ---------------------------
@my_club_api.route('/clubs/<int:club_id>/members', methods=['GET'])
@token_required
def list_members(current_user, club_id):
    """
    List approved members of the club.
    """
    club = Club.query.get_or_404(club_id)
    members = db.session.query(User).join(user_club_association, User.user_id == user_club_association.c.user_id).filter(
        user_club_association.c.club_id == club_id,
        user_club_association.c.status == ClubMembershipStatus.APPROVED
    ).all()

    data = []
    for u in members:
        data.append({
            'user_id': u.user_id,
            'email': getattr(u, 'email', None),
        })
    return make_response(data=data, status_code=200)

@my_club_api.route('/clubs/<int:club_id>/members/<int:member_id>', methods=['DELETE'])
@token_required
def remove_member(current_user, club_id, member_id):
    club = Club.query.get_or_404(club_id)
    if not is_club_leader(current_user.user_id, club):
        return make_response(error="Only leader can remove members", status_code=403)
    if member_id == club.leader_id:
        return make_response(error="Cannot remove the leader", status_code=400)

    db.session.execute(
        user_club_association.delete().where(
            and_(
                user_club_association.c.user_id == member_id,
                user_club_association.c.club_id == club_id
            )
        )
    )
    db.session.commit()
    return make_response(message="Member removed", status_code=200)

@my_club_api.route('/clubs/<int:club_id>/leader', methods=['PUT'])
@token_required
def appoint_new_leader(current_user, club_id):
    """
    Appoint a new leader. JSON body: { "new_leader_id": <id> }.
    """
    club = Club.query.get_or_404(club_id)
    if not is_club_leader(current_user.user_id, club):
        return make_response(error="Only current leader can appoint a new leader", status_code=403)

    data = request.json or {}
    new_leader_id = data.get('new_leader_id')
    if not new_leader_id:
        return make_response(error="new_leader_id is required", status_code=400)

    # ensure the new leader is an approved member
    status = get_membership_status(new_leader_id, club_id)
    if status != ClubMembershipStatus.APPROVED:
        return make_response(error="New leader must be an approved member", status_code=400)

    club.leader_id = new_leader_id
    db.session.commit()
    return make_response(message="Leader changed", status_code=200)

@my_club_api.route('/clubs/<int:club_id>/requests', methods=['GET'])
@token_required
def list_join_requests(current_user, club_id):
    """
    Leader lists pending join requests
    """
    club = Club.query.get_or_404(club_id)
    if not is_club_leader(current_user.user_id, club):
        return make_response(error="Only leader can view join requests", status_code=403)

    pending = db.session.query(User).join(user_club_association, User.user_id == user_club_association.c.user_id).filter(
        user_club_association.c.club_id == club_id,
        user_club_association.c.status == ClubMembershipStatus.PENDING.value
    ).all()

    data = [{'user_id': u.user_id, 'email': getattr(u, 'email', None)} for u in pending]
    return make_response(data=data, status_code=200)

@my_club_api.route('/clubs/<int:club_id>/requests/<int:user_id>/approve', methods=['PUT'])
@token_required
def approve_join_request(current_user, club_id, user_id):
    club = Club.query.get_or_404(club_id)
    if not is_club_leader(current_user.user_id, club):
        return make_response(error="Only leader can approve requests", status_code=403)

    # update status to approved
    db.session.execute(
        user_club_association.update().where(
            and_(
                user_club_association.c.user_id == user_id,
                user_club_association.c.club_id == club_id
            )
        ).values(
            status=ClubMembershipStatus.APPROVED,
            processed_at=datetime.utcnow(),
            processed_by=current_user.user_id
        )
    )
    db.session.commit()

    # Log the approval
    try:
        from ..utils.logging_utils import log_club_join_approval
        log_club_join_approval(current_user.user_id, user_id, club_id, club.name)
    except Exception as e:
        print(f"Failed to log approval: {str(e)}")

    # Create notification for the approved user
    try:
        from ..utils.notification_utils import create_and_broadcast_notification
        from ..models.notification import NotificationType
        create_and_broadcast_notification(
            user_id=user_id,
            message=f"🎉 Your request to join {club.name} has been approved! Welcome to the club!",
            notification_type=NotificationType.CLUB_JOIN_APPROVED,
            related_club_id=club_id,
            related_user_id=current_user.user_id
        )
    except Exception as e:
        print(f"Failed to create approval notification: {str(e)}")

    return make_response(message="Request approved", status_code=200)

@my_club_api.route('/clubs/<int:club_id>/requests/<int:user_id>/reject', methods=['PUT'])
@token_required
def reject_join_request(current_user, club_id, user_id):
    club = Club.query.get_or_404(club_id)
    if not is_club_leader(current_user.user_id, club):
        return make_response(error="Only leader can reject requests", status_code=403)

    db.session.execute(
        user_club_association.update().where(
            and_(
                user_club_association.c.user_id == user_id,
                user_club_association.c.club_id == club_id
            )
        ).values(
            status=ClubMembershipStatus.REJECTED.value,
            processed_at=datetime.utcnow(),
            processed_by=current_user.user_id
        )
    )
    db.session.commit()

    # Log the rejection
    try:
        from ..utils.logging_utils import log_club_join_rejection
        log_club_join_rejection(current_user.user_id, user_id, club_id, club.name)
    except Exception as e:
        print(f"Failed to log rejection: {str(e)}")

    # Create notification for the rejected user
    try:
        from ..utils.notification_utils import create_and_broadcast_notification
        from ..models.notification import NotificationType
        create_and_broadcast_notification(
            user_id=user_id,
            message=f"Your request to join {club.name} has been declined. You can try applying to other clubs.",
            notification_type=NotificationType.CLUB_JOIN_REJECTED,
            related_club_id=club_id,
            related_user_id=current_user.user_id
        )
    except Exception as e:
        print(f"Failed to create rejection notification: {str(e)}")

    return make_response(message="Request rejected", status_code=200)

# ---------------------------
# Club details (view & update & delete)
# ---------------------------
@my_club_api.route('/clubs/<int:club_id>', methods=['GET'])
@token_required
def get_club_details(current_user, club_id):
    club = Club.query.options(joinedload(Club.leader)).get_or_404(club_id)

    data = {
        'club_id': club.club_id,
        'name': club.name,
        'description': club.description,
        'established_date': club.established_date.isoformat() if club.established_date else None,
        'logo_url': club.logo_url,
        'image_url': club.image_url,
        'club_details': club.club_details,
        'category': club.category,
        'leader_id': club.leader_id,
        'leader_name': getattr(club.leader, 'full_name', None),
        'member_count': len(club.approved_members)
    }
    return make_response(data=data, status_code=200)

@my_club_api.route('/clubs/<int:club_id>', methods=['PUT'])
@token_required
def update_club_details(current_user, club_id):
    try:
        # Debug info
        print("=== REQUEST DEBUG ===")
        print("Form data:", request.form.to_dict())
        print("Files:", {key: file.filename for key, file in request.files.items()})
        print("=====================")
        
        club = Club.query.get_or_404(club_id)
        if not is_club_leader(current_user.user_id, club):
            return make_response(error="Only leader can update club details", status_code=403)

        # Process text fields
        text_fields = ['name', 'description', 'category', 'club_details', 'established_date']
        updates = {}
        
        for field in text_fields:
            value = request.form.get(field)
            if value is not None:
                updates[field] = value
                print(f"Setting {field} to: {value}")

        # Handle name uniqueness check
        if 'name' in updates and updates['name'] != club.name:
            existing = Club.query.filter(Club.name == updates['name'], Club.club_id != club_id).first()
            if existing:
                return make_response(error="Club name already in use", status_code=400)
            club.name = updates['name']

        # Update other fields
        if 'description' in updates:
            club.description = updates['description']
        if 'category' in updates:
            club.category = updates['category']
        if 'club_details' in updates:
            club.club_details = updates['club_details']
        if 'established_date' in updates:
            try:
                club.established_date = datetime.fromisoformat(updates['established_date']).date()
            except ValueError:
                return make_response(error="Invalid established_date format", status_code=400)

        # Process files - FIXED PATH HANDLING
        upload_folder = 'static/uploads/clubs'
        abs_upload_dir = os.path.join(current_app.root_path, upload_folder)
        os.makedirs(abs_upload_dir, exist_ok=True)
        
        for file_key in ['logo_url', 'image_url']:
            file = request.files.get(file_key)
            if file and file.filename:
                print(f"Processing {file_key}: {file.filename}")
                if not allowed_file(file.filename):
                    return make_response(error=f"Invalid {file_key} file type", status_code=400)
                
                fname = secure_filename(f"{file_key}_{int(datetime.utcnow().timestamp())}_{file.filename}")
                # Use ABSOLUTE path for saving
                abs_save_path = os.path.join(abs_upload_dir, fname)
                file.save(abs_save_path)
                print(f"File saved to: {abs_save_path}")
                
                # Set the appropriate attribute with RELATIVE path for database
                relative_path = os.path.join(upload_folder, fname).replace('\\', '/')
                setattr(club, file_key, relative_path)

        db.session.commit()
        return make_response(message="Club updated successfully", status_code=200)
        
    except Exception as e:
        print(f"Error in update_club_details: {str(e)}")
        import traceback
        traceback.print_exc()  # This will show the full traceback
        db.session.rollback()
        return make_response(error="Internal server error", status_code=500)

@my_club_api.route('/clubs/<int:club_id>', methods=['DELETE'])
@token_required
def delete_club(current_user, club_id):
    """
    Leader-only deletion. JSON body must include {"confirmation": "DELETE"} (case-sensitive).
    """
    club = Club.query.get_or_404(club_id)
    if not is_club_leader(current_user.user_id, club):
        return make_response(error="Only leader can delete club", status_code=403)

    data = request.get_json() or {}
    confirmation = data.get('confirmation')
    if confirmation != "DELETE":
        return make_response(error="Provide confirmation: 'DELETE' in request body", status_code=400)

    # delete association rows and club (cascade depends on your FK settings)
    db.session.execute(user_club_association.delete().where(user_club_association.c.club_id == club_id))
    db.session.delete(club)
    db.session.commit()
    return make_response(message="Club deleted", status_code=200)

# ---------------------------
# Join/Leave handlers for members (client can call from My Club UI)
# ---------------------------
@my_club_api.route('/clubs/<int:club_id>/leave', methods=['POST'])
@token_required
def leave_club(current_user, club_id):
    club = Club.query.get_or_404(club_id)
    user_id = current_user.user_id

    # leader cannot leave their own club
    if is_club_leader(user_id, club):
        return make_response(error="Leader cannot leave their own club", status_code=400)

    status = get_membership_status(user_id, club_id)
    if status != ClubMembershipStatus.APPROVED:
        return make_response(error="Not an approved member", status_code=400)

    db.session.execute(
        user_club_association.delete().where(
            and_(
                user_club_association.c.user_id == user_id,
                user_club_association.c.club_id == club_id
            )
        )
    )
    db.session.commit()
    return make_response(message="Left the club", status_code=200)
