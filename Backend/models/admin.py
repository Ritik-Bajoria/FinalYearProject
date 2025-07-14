from .base import db, BaseModel

class Admin(BaseModel):
    __tablename__ = 'admins'
    
    admin_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), unique=True)
    full_name = db.Column(db.String(100), nullable=False)
    admin_role = db.Column(db.String(100))  # System Admin, Department Admin, etc.
    permissions_level = db.Column(db.Integer, default=1)
    
    user = db.relationship('User', back_populates='admin')