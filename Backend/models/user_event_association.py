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
