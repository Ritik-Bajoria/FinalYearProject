from .base import db, BaseModel

class EventBudget(BaseModel):
    __tablename__ = 'event_budgets'

    budget_id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id', ondelete='CASCADE'), nullable=False)
    allocated_amount = db.Column(db.Numeric(10, 2))
    total_spent = db.Column(db.Numeric(10, 2), default=0)
    
    # Relationships
    event = db.relationship('Event')
    expenses = db.relationship('Expense', backref='budget', cascade='all, delete-orphan')

    @property
    def remaining_budget(self):
        return self.allocated_amount - self.total_spent if self.allocated_amount else 0

    def update_spent(self):
        from .expense import Expense
        self.total_spent = db.session.query(
            db.func.sum(Expense.amount)
        ).filter(
            Expense.budget_id == self.budget_id
        ).scalar() or 0
        self.save()