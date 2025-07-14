from .base import db, BaseModel

class Feedback(BaseModel):
    __tablename__ = 'feedback'

    feedback_id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='SET NULL'))
    rating = db.Column(db.Integer)
    comments = db.Column(db.Text)
    submitted_at = db.Column(db.DateTime, default=db.func.current_timestamp())