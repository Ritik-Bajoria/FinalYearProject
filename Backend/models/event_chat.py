from .base import db, BaseModel
from datetime import datetime, timezone

class EventChat(BaseModel):
    __tablename__ = 'event_chats'

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    chat_type = db.Column(
        db.Enum('organizer_admin', 'organizer_volunteer', 'attendee_only', name='chat_type_enum'),
        nullable=False
    )
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    reply_to_id = db.Column(db.Integer, db.ForeignKey('event_chats.id'), nullable=True)  # Added reply support

    # Relationships
    sender = db.relationship('User', backref='event_messages')
    event = db.relationship('Event', backref='event_chats')
    reply_to = db.relationship('EventChat', remote_side=[id], backref='replies')  # Self-referential relationship

    def __repr__(self):
        return f"<EventChat id={self.id} event_id={self.event_id} sender_id={self.sender_id} chat_type={self.chat_type} timestamp={self.timestamp}>"