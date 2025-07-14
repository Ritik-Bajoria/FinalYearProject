from .base import db, BaseModel

class Attendance(BaseModel):
    __tablename__ = 'attendance'

    attendance_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id', ondelete='CASCADE'), nullable=False)
    checkin_time = db.Column(db.DateTime)
    method = db.Column(db.String(20))