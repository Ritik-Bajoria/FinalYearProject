from Backend import db
from .base import BaseModel
from datetime import datetime, timedelta

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