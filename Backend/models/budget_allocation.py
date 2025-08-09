from .base import db, BaseModel
from datetime import datetime

class BudgetAllocation(BaseModel):
    __tablename__ = 'budget_allocations'

    allocation_id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id', ondelete='CASCADE'))
    allocated_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    amount = db.Column(db.Numeric(10, 2))
    note = db.Column(db.Text)
    allocated_at = db.Column(db.DateTime, default=datetime.utcnow)
