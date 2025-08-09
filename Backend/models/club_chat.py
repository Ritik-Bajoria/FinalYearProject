from .base import db, BaseModel
from datetime import datetime

class ClubChat(BaseModel):
    __tablename__ = 'club_chats'

    message_id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.club_id', ondelete='CASCADE'))
    sender_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='SET NULL'))
    message_text = db.Column(db.Text, nullable=False)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_admin_message = db.Column(db.Boolean, default=False)  # distinguish admin messages

