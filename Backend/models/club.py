# models/club.py
from .base import db, BaseModel
from datetime import datetime

class Club(BaseModel):
    __tablename__ = 'clubs'
    
    club_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    established_date = db.Column(db.Date)
    logo_url = db.Column(db.Text)
    
    # Relationships
    organizer_id = db.Column(db.Integer, db.ForeignKey('students.student_id'))
    organizer = db.relationship('Student', back_populates='organized_clubs')
    members = db.relationship(
        'User',
        secondary='user_club_association',
        back_populates='club_memberships'
    )
    events = db.relationship('Event', 
                           backref=db.backref('club_ref', lazy=True), 
                           lazy='dynamic')

    def __repr__(self):
        return f'<Club {self.name}>'