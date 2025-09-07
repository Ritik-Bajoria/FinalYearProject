from .base import db, BaseModel

class Expense(BaseModel):
    __tablename__ = 'expenses'

    expense_id = db.Column(db.Integer, primary_key=True)
    budget_id = db.Column(db.Integer, db.ForeignKey('event_budgets.budget_id', ondelete='CASCADE'), nullable=False)
    description = db.Column(db.Text)
    amount = db.Column(db.Numeric(10, 2))
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    receipt_url = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    # Relationships
    uploader = db.relationship('User', backref='expenses')