from .base import db, BaseModel
from datetime import datetime

class EventChat(BaseModel):
    __tablename__ = 'event_chats'

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id'))
    sender_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    message = db.Column(db.Text)
    chat_type = db.Column(db.Enum('organizer_admin', 'organizer_volunteer', 'attendee_only', name='chat_type_enum'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    sender = db.relationship('User', backref='event_messages')
    event = db.relationship('Event', backref='event_chats')