from .base import db, BaseModel
from datetime import datetime

class Event(db.Model):
    __tablename__ = 'events'
    
    event_id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.club_id'))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    event_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime)
    venue = db.Column(db.String(255))
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='SET NULL'))
    category = db.Column(db.String(50))
    visibility = db.Column(db.String(30), default='Public')
    capacity = db.Column(db.Integer, default=100)
    is_recurring = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(30), default='pending')  # e.g., 'pending', 'approved', 'rejected'

    
    # Add club relationship
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.club_id', ondelete='SET NULL'))
    
    # Existing relationships
    event_tags = db.relationship('EventTag', secondary='event_tag_map', back_populates='tagged_events')
    registrations = db.relationship('EventRegistration', backref='event', lazy=True, cascade='all, delete-orphan')
    attendances = db.relationship('Attendance', backref='event', lazy=True, cascade='all, delete-orphan')
    messages = db.relationship('Message', backref='event', lazy=True, cascade='all, delete-orphan')
    budget = db.relationship('EventBudget', backref='event', uselist=False, lazy=True, cascade='all, delete-orphan')
    feedbacks = db.relationship('Feedback', backref='event', lazy=True, cascade='all, delete-orphan')