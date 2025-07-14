from .base import db, BaseModel

class Faculty(BaseModel):
    __tablename__ = 'faculty'
    
    faculty_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), unique=True)
    full_name = db.Column(db.String(100), nullable=False)
    faculty_id_number = db.Column(db.String(50), unique=True)
    department = db.Column(db.String(100))
    position = db.Column(db.String(100))  # Professor, Lecturer, etc.
    profile_picture = db.Column(db.Text)
    
    user = db.relationship('User', back_populates='faculty')