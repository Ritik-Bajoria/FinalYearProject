from .base import db, BaseModel
from .expense import Expense
class EventBudget(BaseModel):
    __tablename__ = 'event_budgets'

    budget_id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id', ondelete='CASCADE'), nullable=False)
    allocated_amount = db.Column(db.Numeric(10, 2))
    total_spent = db.Column(db.Numeric(10, 2), default=0)

    @property
    def remaining_budget(self):
        return self.allocated_amount - self.total_spent

    def update_spent(self):
        self.total_spent = db.session.query(
            db.func.sum(Expense.amount)
        ).filter(
            Expense.budget_id == self.budget_id
        ).scalar() or 0
        self.save()