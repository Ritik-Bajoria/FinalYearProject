from .base import db, BaseModel
from datetime import datetime, timedelta
import secrets
import string
import uuid

class EmailVerification(BaseModel):
    __tablename__ = 'email_verifications'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False)
    otp = db.Column(db.String(6), nullable=False)
    temp_token = db.Column(db.String(255), nullable=False, unique=True)
    user_data = db.Column(db.JSON, nullable=False)  # Store registration data temporarily
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    attempts = db.Column(db.Integer, default=0)
    
    @classmethod
    def generate_otp(cls):
        """Generate a 6-digit OTP"""
        return ''.join(secrets.choice(string.digits) for _ in range(6))
    
    @classmethod
    def generate_temp_token(cls):
        """Generate a temporary token for verification using UUID"""
        return str(uuid.uuid4())
    
    @classmethod
    def create_verification(cls, email, user_data, expiry_minutes=10):
        """Create a new email verification record"""
        otp = cls.generate_otp()
        temp_token = cls.generate_temp_token()
        expires_at = datetime.utcnow() + timedelta(minutes=expiry_minutes)
        
        # Delete any existing verification for this email
        cls.query.filter_by(email=email, is_verified=False).delete()
        
        verification = cls(
            email=email,
            otp=otp,
            temp_token=temp_token,
            user_data=user_data,
            expires_at=expires_at
        )
        
        db.session.add(verification)
        db.session.commit()
        
        return verification
    
    def is_expired(self):
        """Check if the verification has expired"""
        return datetime.utcnow() > self.expires_at
    
    def increment_attempts(self):
        """Increment the number of verification attempts"""
        self.attempts += 1
        db.session.commit()
    
    def verify(self, provided_otp):
        """Verify the OTP"""
        if self.is_expired():
            return False, "OTP has expired"
        
        if self.attempts >= 5:
            return False, "Too many failed attempts"
        
        if self.otp != provided_otp:
            self.increment_attempts()
            return False, "Invalid OTP"
        
        self.is_verified = True
        db.session.commit()
        return True, "OTP verified successfully"
    
    @staticmethod
    def verify_temp_token(temp_token):
        """Verify temporary token and return verification record"""
        verification = EmailVerification.query.filter_by(
            temp_token=temp_token,
            is_verified=False
        ).first()
        
        if not verification:
            return None, "Invalid or expired verification token"
        
        if verification.is_expired():
            return None, "Verification token has expired"
        
        return verification, None