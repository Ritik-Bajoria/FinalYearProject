from .base import db, BaseModel
from datetime import datetime
from .association_tables import ClubMembershipStatus, user_club_association

class Club(BaseModel):
    __tablename__ = 'clubs'
    
    club_id = db.Column(db.Integer, primary_key=True)
    leader_id = db.Column(db.Integer, db.ForeignKey('students.user_id'), nullable=False)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    established_date = db.Column(db.Date)
    logo_url = db.Column(db.Text)
    image_url = db.Column(db.Text)
    club_details = db.Column(db.Text)
    category = db.Column(db.String(50))

    leader = db.relationship('Student', back_populates='clubs_led')

    events = db.relationship(
        'Event',
        backref=db.backref('club_ref', lazy=True),
        lazy='dynamic'
    )

    chats = db.relationship('ClubChat', backref='club', lazy=True, cascade='all, delete-orphan')

    def request_to_join(self, user):
        if user in self.members:
            return False
        stmt = user_club_association.insert().values(
            user_id=user.user_id,
            club_id=self.club_id,
            status=ClubMembershipStatus.PENDING.value,
            requested_at=datetime.utcnow()
        )
        db.session.execute(stmt)
        db.session.commit()
        return True

    def approve_member(self, user, approved_by):
        stmt = user_club_association.update().where(
            (user_club_association.c.user_id == user.user_id) &
            (user_club_association.c.club_id == self.club_id)
        ).values(
            status=ClubMembershipStatus.APPROVED.value,
            processed_at=datetime.utcnow(),
            processed_by=approved_by.user_id
        )
        db.session.execute(stmt)
        db.session.commit()

    def reject_member(self, user, rejected_by):
        stmt = user_club_association.update().where(
            (user_club_association.c.user_id == user.user_id) &
            (user_club_association.c.club_id == self.club_id)
        ).values(
            status=ClubMembershipStatus.REJECTED.value,
            processed_at=datetime.utcnow(),
            processed_by=rejected_by.user_id
        )
        db.session.execute(stmt)
        db.session.commit()

    def get_pending_requests(self):
        from Backend.models.user import User  # local import to avoid circular
        return db.session.query(User).join(
            user_club_association,
            (User.user_id == user_club_association.c.user_id) &
            (user_club_association.c.status == ClubMembershipStatus.PENDING.value)
        ).filter(
            user_club_association.c.club_id == self.club_id
        ).all()

    @property
    def approved_members(self):
        from Backend.models.user import User  # local import to avoid circular
        return db.session.query(User).join(
            user_club_association,
            (User.user_id == user_club_association.c.user_id) &
            (user_club_association.c.status == ClubMembershipStatus.APPROVED.value)
        ).filter(
            user_club_association.c.club_id == self.club_id
        ).all()

    def __repr__(self):
        return f'<Club {self.name}>'

# Relationship for members with explicit joins and foreign_keys
from Backend.models.user import User

Club.members = db.relationship(
    'User',
    secondary=user_club_association,
    primaryjoin=lambda: Club.club_id == user_club_association.c.club_id,
    secondaryjoin=lambda: user_club_association.c.user_id == __import__('Backend.models.user', fromlist=['User']).User.user_id,
    foreign_keys=[user_club_association.c.club_id, user_club_association.c.user_id],
    back_populates='clubs'
)
