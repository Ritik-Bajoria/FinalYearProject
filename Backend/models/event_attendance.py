from .base import db, BaseModel
from datetime import datetime

class EventAttendance(BaseModel):
    __tablename__ = 'event_attendance'

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    check_in_time = db.Column(db.DateTime, default=datetime.utcnow)
    qr_checked_in = db.Column(db.Boolean, default=False)
    
    # Relationships
    event = db.relationship('Event')
    user = db.relationship('User')
    
    # Unique constraint to prevent duplicate attendance records
    __table_args__ = (
        db.UniqueConstraint('event_id', 'user_id', name='unique_event_user_attendance'),
    )
