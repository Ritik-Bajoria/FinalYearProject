from .base import db, BaseModel
from datetime import datetime

class EventAttendance(BaseModel):
    __tablename__ = 'event_attendance'

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    check_in_time = db.Column(db.DateTime)
    qr_checked_in = db.Column(db.Boolean, default=False)
