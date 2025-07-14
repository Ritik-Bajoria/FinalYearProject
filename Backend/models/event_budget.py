from .base import db, BaseModel

class EventBudget(BaseModel):
    __tablename__ = 'event_budgets'

    budget_id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id', ondelete='CASCADE'), nullable=False)
    allocated_amount = db.Column(db.Numeric(10, 2))
    total_spent = db.Column(db.Numeric(10, 2), default=0)