# ./models/association_tables.py
from Backend import db
from enum import Enum

class ClubMembershipStatus(Enum):
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'

user_club_association = db.Table(
    'user_club_association',
    db.Column('user_id', db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), primary_key=True),
    db.Column('club_id', db.Integer, db.ForeignKey('clubs.club_id', ondelete='CASCADE'), primary_key=True),
    db.Column('status', db.Enum(ClubMembershipStatus), default=ClubMembershipStatus.PENDING),
    db.Column('requested_at', db.DateTime, server_default=db.func.now()),
    db.Column('processed_at', db.DateTime),
    db.Column('processed_by', db.Integer, db.ForeignKey('users.user_id')),  # FK to users again - causes ambiguity
    db.Index('idx_club_status', 'status')
)
