# ./models/notification.py
from enum import Enum
from .base import db, BaseModel

class NotificationType(Enum):
    CLUB_JOIN_REQUEST = 'club_join_request'
    CLUB_JOIN_APPROVED = 'club_join_approved'
    CLUB_JOIN_REJECTED = 'club_join_rejected'
    EVENT_INVITATION = 'event_invitation'
    EVENT_REMINDER = 'event_reminder'
    SYSTEM_ALERT = 'system_alert'
    # Add more notification types as needed

class Notification(BaseModel):
    __tablename__ = 'notifications'

    notification_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.Enum(NotificationType), nullable=False)
    related_club_id = db.Column(db.Integer, db.ForeignKey('clubs.club_id'))
    related_user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    related_event_id = db.Column(db.Integer, db.ForeignKey('events.event_id'))
    read = db.Column(db.Boolean, default=False)
    sent_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    # Relationships - specify foreign_keys to avoid ambiguity
    user = db.relationship('User', foreign_keys=[user_id], backref='notifications')
    club = db.relationship('Club', backref='notifications')
    sender = db.relationship('User', foreign_keys=[related_user_id], backref='sent_notifications')
    event = db.relationship('Event', backref='notifications')

    @classmethod
    def create_club_join_request_notification(cls, club, requester):
        """Create a notification for club leaders about join request"""
        message = f"{requester.full_name} has requested to join {club.name}"
        return cls(
            user_id=club.leader_id,
            message=message,
            notification_type=NotificationType.CLUB_JOIN_REQUEST,
            related_club_id=club.club_id,
            related_user_id=requester.user_id
        )

    @classmethod
    def create_club_join_response_notification(cls, user, club, approved=True, processed_by=None):
        """Create a notification for user about their join request status"""
        status = "approved" if approved else "rejected"
        message = f"Your request to join {club.name} has been {status}"
        return cls(
            user_id=user.user_id,
            message=message,
            notification_type=NotificationType.CLUB_JOIN_APPROVED if approved 
                          else NotificationType.CLUB_JOIN_REJECTED,
            related_club_id=club.club_id,
            related_user_id=processed_by.user_id if processed_by else None
        )