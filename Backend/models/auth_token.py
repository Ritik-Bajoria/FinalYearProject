from Backend import db
from .base import BaseModel
from datetime import datetime, timedelta
import uuid

class AuthToken(BaseModel):
    __tablename__ = 'auth_tokens'

    token_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    token = db.Column(db.Text, nullable=False)
    issued_at = db.Column(db.DateTime, server_default=db.func.now())
    expires_at = db.Column(db.DateTime)
    token_type = db.Column(db.String(20))

    @staticmethod
    def generate_token():
        import secrets
        return secrets.token_hex(32)

    @classmethod
    def create_token(cls, user_id, expiration_hours):
        return cls(
            user_id=user_id,
            token=cls.generate_token(),
            expires_at=datetime.utcnow() + timedelta(hours=expiration_hours)
        )

    @staticmethod
    def generate_auth_token(user, expiration_hours):
        """Generate authentication token for user"""
        # Delete any existing tokens for this user
        AuthToken.query.filter_by(user_id=user.user_id).delete()
        
        # Create new token
        token = AuthToken(
            user_id=user.user_id,
            token=str(uuid.uuid4()),
            issued_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=expiration_hours),
            token_type='access'
        )
        
        db.session.add(token)
        db.session.commit()
        
        return token

    @staticmethod
    def verify_token(token_string):
        """Verify and return user for given token"""
        token = AuthToken.query.filter_by(token=token_string).first()
        
        if not token:
            return None
        
        # Check if token has expired
        if token.expires_at and datetime.utcnow() > token.expires_at:
            # Delete expired token
            db.session.delete(token)
            db.session.commit()
            return None
        
        # Import User model to avoid circular imports
        from .user import User
        return User.query.get(token.user_id)

    def is_expired(self):
        """Check if token is expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at