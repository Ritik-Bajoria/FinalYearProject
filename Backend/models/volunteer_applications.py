from .base import db, BaseModel

class VolunteerApplication(BaseModel):
    __tablename__ = 'volunteer_applications'
    application_id = db.Column(db.Integer, primary_key=True)
    posting_id = db.Column(db.Integer, db.ForeignKey('volunteer_postings.posting_id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    status = db.Column(db.String(20), default='pending')
    applied_at = db.Column(db.DateTime, default=db.func.now())