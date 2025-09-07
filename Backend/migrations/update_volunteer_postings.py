"""
Migration script to update volunteer_postings table structure
"""
from sqlalchemy import text
from Backend import db, create_app

def migrate_volunteer_postings():
    """Update volunteer_postings table to match new model"""
    app = create_app()
    
    with app.app_context():
        try:
            # Check if columns exist and add them if they don't
            inspector = db.inspect(db.engine)
            existing_columns = [col['name'] for col in inspector.get_columns('volunteer_postings')]
            
            migrations = []
            
            # Add title column if it doesn't exist
            if 'title' not in existing_columns:
                migrations.append("ALTER TABLE volunteer_postings ADD COLUMN title VARCHAR(255)")
            
            # Add requirements column if it doesn't exist  
            if 'requirements' not in existing_columns:
                migrations.append("ALTER TABLE volunteer_postings ADD COLUMN requirements TEXT")
            
            # Add positions_available column if it doesn't exist
            if 'positions_available' not in existing_columns:
                migrations.append("ALTER TABLE volunteer_postings ADD COLUMN positions_available INTEGER DEFAULT 1")
            
            # Add created_at column if it doesn't exist
            if 'created_at' not in existing_columns:
                migrations.append("ALTER TABLE volunteer_postings ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            
            # Add updated_at column if it doesn't exist
            if 'updated_at' not in existing_columns:
                migrations.append("ALTER TABLE volunteer_postings ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            
            # Execute migrations
            for migration in migrations:
                print(f"Executing: {migration}")
                db.session.execute(text(migration))
            
            # Update existing records with default values
            if migrations:
                # Set title from role for existing records
                if 'title' in [m for m in migrations if 'title' in m]:
                    db.session.execute(text("UPDATE volunteer_postings SET title = role WHERE title IS NULL"))
                
                # Set positions_available from slots_available for existing records
                if 'positions_available' in [m for m in migrations if 'positions_available' in m]:
                    db.session.execute(text("UPDATE volunteer_postings SET positions_available = COALESCE(slots_available, 1) WHERE positions_available IS NULL"))
            
            db.session.commit()
            print("✅ Volunteer postings table migration completed successfully")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Migration failed: {str(e)}")
            raise e

if __name__ == "__main__":
    migrate_volunteer_postings()