from .base import db, BaseModel

class VolunteerPosting(BaseModel):
    __tablename__ = 'volunteer_postings'
    
    posting_id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id'))
    role = db.Column(db.String(100))
    description = db.Column(db.Text)
    slots_available = db.Column(db.Integer)

    event = db.relationship('Event', backref='volunteer_postings')