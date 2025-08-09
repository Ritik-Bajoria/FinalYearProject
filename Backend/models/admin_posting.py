from .base import db, BaseModel

class AdminPosting(BaseModel):
    __tablename__ = 'admin_postings'
    
    posting_id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admins.user_id'))
    title = db.Column(db.String(255))
    content = db.Column(db.Text)
    is_pinned = db.Column(db.Boolean, default=False)

    admin = db.relationship('Admin', backref='postings')