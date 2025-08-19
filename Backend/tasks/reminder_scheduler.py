"""
Event reminder scheduler
Sends reminder notifications for upcoming events
"""

import schedule
import time
from datetime import datetime, timedelta
from threading import Thread
from ..models.event import Event
from ..models.event_registration import EventRegistration
from ..utils.notification_utils import create_event_reminder_notifications, create_and_broadcast_notification
from ..models.notification import NotificationType
from .. import db, create_app

def send_event_reminders():
    """Send reminders for events starting in the next 24 hours"""
    try:
        app = create_app()
        with app.app_context():
            # Get events starting in the next 24 hours
            tomorrow = datetime.utcnow() + timedelta(hours=24)
            today = datetime.utcnow()
            
            upcoming_events = Event.query.filter(
                Event.event_date >= today,
                Event.event_date <= tomorrow,
                Event.event_status == 'upcoming'
            ).all()
            
            for event in upcoming_events:
                try:
                    # Check if we already sent a reminder for this event today
                    # (You might want to add a field to track this)
                    
                    # Send reminders to registered users
                    reminder_count = create_event_reminder_notifications(event)
                    
                    if reminder_count > 0:
                        print(f"✓ Sent {reminder_count} reminders for event: {event.title}")
                    
                except Exception as e:
                    print(f"Failed to send reminders for event {event.event_id}: {str(e)}")
            
            print(f"✓ Reminder check completed. Found {len(upcoming_events)} upcoming events.")
            
    except Exception as e:
        print(f"Error in reminder scheduler: {str(e)}")

def send_daily_event_digest():
    """Send daily digest of upcoming events to all users"""
    try:
        app = create_app()
        with app.app_context():
            from ..models.user import User
            
            # Get events for the next 7 days
            next_week = datetime.utcnow() + timedelta(days=7)
            today = datetime.utcnow()
            
            upcoming_events = Event.query.filter(
                Event.event_date >= today,
                Event.event_date <= next_week,
                Event.event_status == 'upcoming'
            ).limit(5).all()  # Limit to 5 events
            
            if not upcoming_events:
                return
            
            # Create digest message
            event_list = "\n".join([f"• {event.title} - {event.event_date.strftime('%m/%d %H:%M')}" 
                                  for event in upcoming_events])
            
            digest_message = f"📅 Upcoming Events This Week:\n{event_list}"
            
            # Send to all active users
            active_users = User.query.filter_by(is_active=True).all()
            
            digest_count = 0
            for user in active_users:
                try:
                    create_and_broadcast_notification(
                        user_id=user.user_id,
                        message=digest_message,
                        notification_type=NotificationType.EVENT_REMINDER
                    )
                    digest_count += 1
                except Exception as e:
                    print(f"Failed to send digest to user {user.user_id}: {str(e)}")
            
            print(f"✓ Sent weekly digest to {digest_count} users")
            
    except Exception as e:
        print(f"Error in daily digest: {str(e)}")

def start_reminder_scheduler():
    """Start the reminder scheduler in a background thread"""
    def run_scheduler():
        # Schedule reminders every hour
        schedule.every().hour.do(send_event_reminders)
        
        # Schedule daily digest at 9 AM
        schedule.every().day.at("09:00").do(send_daily_event_digest)
        
        print("✓ Reminder scheduler started")
        
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    # Run scheduler in background thread
    scheduler_thread = Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    
    return scheduler_thread

def send_immediate_event_reminder(event_id):
    """Send immediate reminder for a specific event"""
    try:
        app = create_app()
        with app.app_context():
            event = Event.query.get(event_id)
            if not event:
                print(f"Event {event_id} not found")
                return False
            
            reminder_count = create_event_reminder_notifications(event)
            print(f"✓ Sent {reminder_count} immediate reminders for event: {event.title}")
            return True
            
    except Exception as e:
        print(f"Error sending immediate reminder: {str(e)}")
        return False