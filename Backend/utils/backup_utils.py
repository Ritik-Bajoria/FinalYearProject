"""
Database backup utilities for safe migrations
Supports both SQLite and PostgreSQL
"""

import os
import subprocess
import psycopg2
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

def parse_database_url(db_url=None):
    """Parse database URL to get connection details"""
    if not db_url:
        db_url = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///event_management.db')
    
    parsed = urlparse(db_url)
    
    return {
        'scheme': parsed.scheme,
        'host': parsed.hostname,
        'port': parsed.port,
        'database': parsed.path.lstrip('/') if parsed.path else None,
        'username': parsed.username,
        'password': parsed.password,
        'full_url': db_url
    }

def create_database_backup(db_url=None):
    """Create a backup of the database before migrations"""
    try:
        db_info = parse_database_url(db_url)
        
        # Create backup directory
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = Path("backups")
        backup_dir.mkdir(exist_ok=True)
        
        if db_info['scheme'].startswith('postgresql'):
            return create_postgresql_backup(db_info, backup_dir, timestamp)
        elif db_info['scheme'].startswith('sqlite'):
            return create_sqlite_backup(db_info, backup_dir, timestamp)
        else:
            print(f"❌ Unsupported database type: {db_info['scheme']}")
            return None
            
    except Exception as e:
        print(f"❌ Failed to create backup: {str(e)}")
        return None

def create_postgresql_backup(db_info, backup_dir, timestamp):
    """Create PostgreSQL backup using pg_dump"""
    try:
        backup_filename = f"database_backup_{timestamp}.sql"
        backup_path = backup_dir / backup_filename
        
        # Set environment variables for pg_dump
        env = os.environ.copy()
        if db_info['password']:
            env['PGPASSWORD'] = db_info['password']
        
        # Build pg_dump command
        cmd = ['pg_dump']
        if db_info['host']:
            cmd.extend(['-h', db_info['host']])
        if db_info['port']:
            cmd.extend(['-p', str(db_info['port'])])
        if db_info['username']:
            cmd.extend(['-U', db_info['username']])
        
        cmd.extend(['-f', str(backup_path), '--no-password', db_info['database']])
        
        # Run pg_dump
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✓ PostgreSQL backup created: {backup_path}")
            return str(backup_path)
        else:
            print(f"❌ pg_dump failed: {result.stderr}")
            return None
            
    except Exception as e:
        print(f"❌ Failed to create PostgreSQL backup: {str(e)}")
        return None

def create_sqlite_backup(db_info, backup_dir, timestamp):
    """Create SQLite backup by copying the file"""
    try:
        import shutil
        
        db_path = db_info['database']
        if not os.path.exists(db_path):
            print(f"❌ SQLite database file not found: {db_path}")
            return None
        
        backup_filename = f"database_backup_{timestamp}.db"
        backup_path = backup_dir / backup_filename
        
        shutil.copy2(db_path, backup_path)
        
        print(f"✓ SQLite backup created: {backup_path}")
        return str(backup_path)
        
    except Exception as e:
        print(f"❌ Failed to create SQLite backup: {str(e)}")
        return None

def verify_database_integrity(db_url=None):
    """Verify database integrity before and after migrations"""
    try:
        db_info = parse_database_url(db_url)
        
        if db_info['scheme'].startswith('postgresql'):
            return verify_postgresql_integrity(db_info)
        elif db_info['scheme'].startswith('sqlite'):
            return verify_sqlite_integrity(db_info)
        else:
            print(f"❌ Unsupported database type: {db_info['scheme']}")
            return False
            
    except Exception as e:
        print(f"❌ Database integrity check error: {str(e)}")
        return False

def verify_postgresql_integrity(db_info):
    """Verify PostgreSQL database integrity"""
    try:
        # For PostgreSQL, we'll just try to connect and run a simple query
        conn = psycopg2.connect(
            host=db_info['host'],
            port=db_info['port'] or 5432,
            database=db_info['database'],
            user=db_info['username'],
            password=db_info['password']
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if result and result[0] == 1:
            print("✓ PostgreSQL database connection successful")
            return True
        else:
            print("❌ PostgreSQL database connection failed")
            return False
            
    except Exception as e:
        print(f"❌ PostgreSQL integrity check failed: {str(e)}")
        return False

def verify_sqlite_integrity(db_info):
    """Verify SQLite database integrity"""
    try:
        import sqlite3
        
        db_path = db_info['database']
        if not os.path.exists(db_path):
            print(f"❌ SQLite database file not found: {db_path}")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("PRAGMA integrity_check")
        result = cursor.fetchone()
        
        conn.close()
        
        if result and result[0] == 'ok':
            print("✓ SQLite database integrity check passed")
            return True
        else:
            print(f"❌ SQLite database integrity check failed: {result}")
            return False
            
    except Exception as e:
        print(f"❌ SQLite integrity check error: {str(e)}")
        return False

def count_table_records(db_url=None):
    """Count records in all tables for verification"""
    try:
        db_info = parse_database_url(db_url)
        
        if db_info['scheme'].startswith('postgresql'):
            return count_postgresql_records(db_info)
        elif db_info['scheme'].startswith('sqlite'):
            return count_sqlite_records(db_info)
        else:
            print(f"❌ Unsupported database type: {db_info['scheme']}")
            return {}
            
    except Exception as e:
        print(f"❌ Error counting records: {str(e)}")
        return {}

def count_postgresql_records(db_info):
    """Count records in PostgreSQL tables"""
    try:
        conn = psycopg2.connect(
            host=db_info['host'],
            port=db_info['port'] or 5432,
            database=db_info['database'],
            user=db_info['username'],
            password=db_info['password']
        )
        
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        """)
        tables = cursor.fetchall()
        
        record_counts = {}
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            record_counts[table_name] = count
        
        cursor.close()
        conn.close()
        
        return record_counts
        
    except Exception as e:
        print(f"❌ Error counting PostgreSQL records: {str(e)}")
        return {}

def count_sqlite_records(db_info):
    """Count records in SQLite tables"""
    try:
        import sqlite3
        
        db_path = db_info['database']
        if not os.path.exists(db_path):
            return {}
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        record_counts = {}
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            record_counts[table_name] = count
        
        conn.close()
        return record_counts
        
    except Exception as e:
        print(f"❌ Error counting SQLite records: {str(e)}")
        return {}

def restore_from_backup(backup_path, db_url=None):
    """Restore database from backup if migration fails"""
    try:
        db_info = parse_database_url(db_url)
        
        if db_info['scheme'].startswith('postgresql'):
            return restore_postgresql_backup(backup_path, db_info)
        elif db_info['scheme'].startswith('sqlite'):
            return restore_sqlite_backup(backup_path, db_info)
        else:
            print(f"❌ Unsupported database type: {db_info['scheme']}")
            return False
            
    except Exception as e:
        print(f"❌ Failed to restore from backup: {str(e)}")
        return False

def restore_postgresql_backup(backup_path, db_info):
    """Restore PostgreSQL backup using psql"""
    try:
        if not os.path.exists(backup_path):
            print(f"❌ Backup file not found: {backup_path}")
            return False
        
        # Set environment variables for psql
        env = os.environ.copy()
        if db_info['password']:
            env['PGPASSWORD'] = db_info['password']
        
        # Build psql command
        cmd = ['psql']
        if db_info['host']:
            cmd.extend(['-h', db_info['host']])
        if db_info['port']:
            cmd.extend(['-p', str(db_info['port'])])
        if db_info['username']:
            cmd.extend(['-U', db_info['username']])
        
        cmd.extend(['-d', db_info['database'], '-f', backup_path])
        
        # Run psql
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✓ PostgreSQL database restored from backup: {backup_path}")
            return True
        else:
            print(f"❌ psql restore failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Failed to restore PostgreSQL backup: {str(e)}")
        return False

def restore_sqlite_backup(backup_path, db_info):
    """Restore SQLite backup by copying the file"""
    try:
        import shutil
        
        if not os.path.exists(backup_path):
            print(f"❌ Backup file not found: {backup_path}")
            return False
        
        shutil.copy2(backup_path, db_info['database'])
        
        print(f"✓ SQLite database restored from backup: {backup_path}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to restore SQLite backup: {str(e)}")
        return False