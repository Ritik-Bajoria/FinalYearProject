from .base import db, BaseModel

class Admin(BaseModel):
    __tablename__ = 'admins'
    
    user_id = db.Column(
        db.Integer, 
        db.ForeignKey('users.user_id'), 
        primary_key=True
    )  # user_id and user_id are the same

    full_name = db.Column(db.String(100), nullable=False)
    admin_role = db.Column(db.String(100))  # e.g., System Admin, Department Admin
    permissions_level = db.Column(db.Integer, default=1)
    
    user = db.relationship('User', back_populates='admin')
