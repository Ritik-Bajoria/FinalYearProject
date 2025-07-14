from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from .base import db, BaseModel
from datetime import datetime

class User(BaseModel, UserMixin):
    __tablename__ = 'users'
    
    # Core user attributes
    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships to role-specific tables
    club_memberships = db.relationship(
        'Club',
        secondary='user_club_association',
        back_populates='members',
        lazy='dynamic'
    )
    student = db.relationship('Student', back_populates='user', uselist=False)
    faculty = db.relationship('Faculty', back_populates='user', uselist=False)
    admin = db.relationship('Admin', back_populates='user', uselist=False)
    
    # Authentication and events
    auth_tokens = db.relationship('AuthToken', backref='user', lazy=True, cascade='all, delete-orphan')
    created_events = db.relationship('Event', backref='creator', lazy=True)
    registrations = db.relationship('EventRegistration', backref='user', lazy=True, cascade='all, delete-orphan')
    attendances = db.relationship('Attendance', backref='user', lazy=True, cascade='all, delete-orphan')
    
    # Authentication methods
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_id(self):
        return str(self.user_id)