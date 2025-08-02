from flask import Blueprint, jsonify, request
from ..models import db, User, Event, EventRegistration, SystemLog, Club
from ..middlewares.auth_middleware import token_required, admin_required
from ..utils.log_action import log_action

admin_event_bp = Blueprint('admin_event', __name__, url_prefix='/admin')

# 4. Event Management
@admin_event_bp.route('/events', methods=['GET'])
# @token_required
# @admin_required
def get_events():
    page = request.args.get('page', default=1, type=int)
    limit = request.args.get('limit', default=10, type=int)
    search = request.args.get('search', default='', type=str)
    status = request.args.get('status', default=None, type=str)
    category = request.args.get('category', default=None, type=str)
    
    query = Event.query
    
    if search:
        query = query.filter(Event.title.ilike(f'%{search}%'))
    
    if status:
        query = query.filter_by(status=status)
    
    if category:
        query = query.filter_by(category=category)
    
    paginated_events = query.paginate(page=page, per_page=limit, error_out=False)
    
    events = []
    for event in paginated_events.items:
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
            'organizer_name': organizer_name,
            'event_date': event.event_date,
            'venue': event.venue,
            'status': event.status,
            'category': event.category,
            'registered_count': EventRegistration.query.filter_by(event_id=event.event_id).count(),
            'capacity': event.capacity
        })
    
    return jsonify({
        'events': events,
        'total': paginated_events.total,
        'pages': paginated_events.pages,
        'currentPage': page
    })

@admin_event_bp.route('/events/<int:event_id>/status', methods=['PATCH'])
# @token_required
# @admin_required
def update_event_status(current_user, event_id):
    data = request.get_json()
    status = data.get('status')
    
    if status not in ['approved', 'rejected', 'pending']:
        return jsonify({'error': 'Invalid status'}), 400
    
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    event.status = status
    db.session.commit()
    
    log_action(current_user.user_id, 'success', 
                   f'Changed event {event_id} status to {status}')
    
    return jsonify({'message': f'Event {status} successfully'})

@admin_event_bp.route('/events/<int:event_id>', methods=['DELETE'])
# @token_required
# @admin_required
def delete_event(current_user, event_id):
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    db.session.delete(event)
    db.session.commit()
    
    log_action(current_user.user_id, 'success', f'Deleted event {event_id}')
    
    return jsonify({'message': 'Event deleted successfully'})

@admin_event_bp.route('/events/pending', methods=['GET'])
# @token_required
# @admin_required
def pending_events():
    events = Event.query.filter_by(status='pending').all()
    
    result = []
    for event in events:
        result.append({
            'event_id': event.event_id,
            'title': event.title,
            'created_at': event.created_at,
            'organizer_id': event.created_by
        })
    
    return jsonify({'events': result})