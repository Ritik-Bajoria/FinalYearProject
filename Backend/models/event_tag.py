# models/event_tag.py
from .base import db, BaseModel

class EventTag(BaseModel):
    __tablename__ = 'event_tags'

    tag_id = db.Column(db.Integer, primary_key=True)
    tag_name = db.Column(db.String(50), unique=True, nullable=False)

    # Correct relationship definition
    tagged_events = db.relationship('Event', 
                                  secondary='event_tag_map', 
                                  back_populates='event_tags')

class EventTagMap(BaseModel):
    __tablename__ = 'event_tag_map'

    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id', ondelete='CASCADE'), primary_key=True)
    tag_id = db.Column(db.Integer, db.ForeignKey('event_tags.tag_id', ondelete='CASCADE'), primary_key=True)