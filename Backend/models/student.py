from .base import db, BaseModel


# Association table for many-to-many user-club relationship
# user_club_association = db.Table('user_club_association',
#     db.Column('user_id', db.Integer, db.ForeignKey('users.user_id')),
#     db.Column('club_id', db.Integer, db.ForeignKey('clubs.club_id'))
# )

# Role-specific tables
class Student(BaseModel):
    __tablename__ = 'students'
    
    student_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), unique=True)
    full_name = db.Column(db.String(100), nullable=False)
    student_id_number = db.Column(db.String(50), unique=True)
    year_of_study = db.Column(db.Integer)
    major = db.Column(db.String(100))
    profile_picture = db.Column(db.Text)
    
    # Relationships
    user = db.relationship('User', back_populates='student')
    # club_memberships = db.relationship('Club', secondary='user_club_association', back_populates='members')
    organized_clubs = db.relationship(
        'Club',
        back_populates='organizer',
        foreign_keys='Club.organizer_id'
    )
    club_memberships = db.relationship(
        'Club',
        secondary='user_club_association',
        secondaryjoin='user_club_association.c.club_id == Club.club_id',
        primaryjoin='Student.user_id == user_club_association.c.user_id',
        viewonly=True  # since Student doesn't own this relationship
    )