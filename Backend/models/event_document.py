from .base import db, BaseModel
from datetime import datetime

class EventDocument(BaseModel):
    __tablename__ = 'event_documents'

    document_id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id', ondelete='CASCADE'))
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='SET NULL'))
    file_url = db.Column(db.Text, nullable=False)
    file_name = db.Column(db.String(255))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
