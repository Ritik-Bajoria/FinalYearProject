"""
Database migration to add email_verifications table
Run this script to add the email verification functionality

Usage:
    python -m Backend.migrations.add_email_verification_table
"""

import sys
import os

# Add the Backend directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.insert(0, backend_dir)

def create_email_verification_table():
    """Create the email_verifications table"""
    try:
        from Backend import create_app, db
        from Backend.models.email_verification import EmailVerification
        
        app = create_app()
        with app.app_context():
            # Create the table
            db.create_all()
            print("✅ Email verification table created successfully!")
            print("📧 Email verification functionality is now ready!")
            print("🔧 Don't forget to configure your email settings in Backend/.env file")
            return True
    except Exception as e:
        print(f"❌ Error creating email verification table: {str(e)}")
        print("💡 Make sure you're running this as: python -m Backend.migrations.add_email_verification_table")
        return False

if __name__ == "__main__":
    create_email_verification_table()