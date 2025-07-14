from Backend import db

user_club_association = db.Table(
    'user_club_association',
    db.Column('user_id', db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), primary_key=True),
    db.Column('club_id', db.Integer, db.ForeignKey('clubs.club_id', ondelete='CASCADE'), primary_key=True)
)