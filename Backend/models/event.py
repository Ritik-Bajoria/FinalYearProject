from .base import db, BaseModel
from datetime import datetime
from .user import User
from .event_registration import EventRegistration

class Event(BaseModel):
    __tablename__ = 'events'
    
    event_id = db.Column(db.Integer, primary_key=True)

    # Foreign relationships
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.club_id', ondelete='SET NULL'))
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='SET NULL'))

    # Basic details
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.Text)  # ✅ New: Event banner image
    venue = db.Column(db.String(255))
    category = db.Column(db.String(50))
    visibility = db.Column(db.String(30), default='Public')

    # Timing
    date = db.Column(db.Date, nullable=False)  # ✅ Event Date
    time = db.Column(db.Time, nullable=False)  # ✅ Event Time
    end_date = db.Column(db.Date)  # ✅ Optional End Date
    event_date = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer)  # ✅ New: Event duration
    registration_end_date = db.Column(db.DateTime)  # ✅ New
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Status and type
    event_status = db.Column(db.String(30), default='upcoming')  # ✅ e.g., 'upcoming', 'ongoing', 'completed'
    approval_status = db.Column(db.String(30), default='pending')  # ✅ e.g., 'pending', 'approved', etc.
    is_recurring = db.Column(db.Boolean, default=False)
    is_certified = db.Column(db.Boolean, default=False)  # ✅ Certified event?
    qr_check_in_enabled = db.Column(db.Boolean, default=False)  # ✅ QR attendance
    
    # Targeting
    target_audience = db.Column(db.String(100))  # ✅ Students, Faculty, All, etc.
    capacity = db.Column(db.Integer, default=100)

    # Budget
    estimated_budget = db.Column(db.Numeric(10, 2))  # ✅ New
    actual_spent = db.Column(db.Numeric(10, 2), default=0)  # ✅ New

    # Relationships
    event_tags = db.relationship('EventTag', secondary='event_tag_map', back_populates='tagged_events')
    registrations = db.relationship('EventRegistration', backref='event', lazy=True, cascade='all, delete-orphan')
    attendances = db.relationship('Attendance', backref='event', lazy=True, cascade='all, delete-orphan')
    feedbacks = db.relationship('Feedback', backref='event', lazy=True, cascade='all, delete-orphan')
    messages = db.relationship('Message', backref='event', lazy=True, cascade='all, delete-orphan')
    budget = db.relationship('EventBudget', backref='event', uselist=False, lazy=True, cascade='all, delete-orphan')
    documents = db.relationship('EventDocument', backref='event', lazy=True, cascade='all, delete-orphan')  # ✅ New
    budget_allocations = db.relationship('BudgetAllocation', backref='event', lazy=True, cascade='all, delete-orphan')  # ✅ New

    user_associations = db.relationship('UserEventAssociation', back_populates='event')

    __table_args__ = (
        db.Index('idx_event_status', 'event_status'),
        db.Index('idx_event_approval', 'approval_status'),
        db.Index('idx_event_club', 'club_id'),
        db.Index('idx_event_date', 'event_date'),
    )

    @property
    def registration_count(self):
        return self.registrations.count()

    @property
    def attendees(self):
        return User.query.join(EventRegistration).filter(
            EventRegistration.event_id == self.event_id
        ).all()
    
    def __repr__(self):
        return f"<Event {self.title}>"
