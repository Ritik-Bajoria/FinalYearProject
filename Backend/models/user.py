from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from .base import db, BaseModel
from datetime import datetime
from .association_tables import ClubMembershipStatus, user_club_association

class User(BaseModel, UserMixin):
    __tablename__ = 'users'
    
    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)

    # Your other relationships here
    student = db.relationship('Student', back_populates='user', uselist=False)
    faculty = db.relationship('Faculty', back_populates='user', uselist=False)
    admin = db.relationship('Admin', back_populates='user', uselist=False)
    event_participations = db.relationship('UserEventAssociation', back_populates='user')
    auth_tokens = db.relationship('AuthToken', backref='user', lazy=True, cascade='all, delete-orphan')
    created_events = db.relationship('Event', backref='creator', lazy=True)
    registrations = db.relationship('EventRegistration', backref='user', lazy=True, cascade='all, delete-orphan')
    attendances = db.relationship('Attendance', backref='user', lazy=True, cascade='all, delete-orphan')

    clubs = db.relationship(
        'Club',
        secondary=user_club_association,
        primaryjoin=lambda: User.user_id == user_club_association.c.user_id,
        secondaryjoin=lambda: user_club_association.c.club_id == __import__('Backend.models.club', fromlist=['Club']).Club.club_id,
        foreign_keys=[user_club_association.c.user_id, user_club_association.c.club_id],
        back_populates='members',
        lazy='dynamic'
    )
    # Auth methods
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_id(self):
        return str(self.user_id)
    
    def request_to_join_club(self, club):
        return club.request_to_join(self)
    
    def get_club_memberships(self, status=None):
        from Backend.models.club import Club  # local import to avoid circular imports
        query = db.session.query(Club).join(
            user_club_association,
            (Club.club_id == user_club_association.c.club_id) &
            (user_club_association.c.user_id == self.user_id)
        )
        if status:
            query = query.filter(user_club_association.c.status == status.value)
        return query.all()
    
    def is_club_member(self, club, approved_only=True):
        query = db.session.query(user_club_association).filter(
            (user_club_association.c.user_id == self.user_id) &
            (user_club_association.c.club_id == club.club_id)
        )
        if approved_only:
            query = query.filter(user_club_association.c.status == ClubMembershipStatus.APPROVED.value)
        return db.session.query(query.exists()).scalar()  # returns True/False
