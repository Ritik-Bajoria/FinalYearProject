from .base import db, BaseModel
from datetime import datetime

class UserEventAssociation(BaseModel):
    __tablename__ = 'user_event_association'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id'))

    role = db.Column(db.Enum('organizer', 'volunteer', 'attendee', name='event_role_enum'))  # ✅ Role in event
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="event_participations")
    event = db.relationship("Event", back_populates="user_associations")

def get_user_role_in_event(user_id, event_id):
    """
    Returns the role of a given user in a specific event.
    If no association is found, returns None.
    # """
    # from app.models.user_event_association import UserEventAssociation  # adjust path as needed

    association = UserEventAssociation.query.filter_by(
        user_id=user_id,
        event_id=event_id
    ).first()

    return association.role if association else None
