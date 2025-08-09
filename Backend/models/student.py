from .base import db, BaseModel

# Role-specific tables
class Student(BaseModel):
    __tablename__ = 'students'
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    student_id_number = db.Column(db.String(50), unique=True)
    year_of_study = db.Column(db.Integer)
    major = db.Column(db.String(100))
    profile_picture = db.Column(db.Text)
    # Add this in Student model
    clubs_led = db.relationship('Club', back_populates='leader')
    
    # Relationships
    user = db.relationship('User', back_populates='student')

    club_memberships = db.relationship(
        'Club',
        secondary='user_club_association',
        secondaryjoin='user_club_association.c.club_id == Club.club_id',
        primaryjoin='Student.user_id == user_club_association.c.user_id',
        viewonly=True  # since Student doesn't own this relationship
    )