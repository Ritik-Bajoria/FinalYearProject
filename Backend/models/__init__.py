from .base import db, BaseModel
from .user import User
from .student import Student
from .faculty import Faculty
from .admin import Admin
from .club import Club
from .event import Event
from .event_tag import EventTag, EventTagMap
from .event_registration import EventRegistration
from .attendance import Attendance
from .notification import Notification
from .message import Message
from .event_budget import EventBudget
from .expense import Expense
from .feedback import Feedback
from .system_log import SystemLog
from .auth_token import AuthToken
from .association_tables import user_club_association

def init_models():
    """Initialize all model relationships"""
    # Import all models to ensure relationships are set up
    from . import (
        user, student, faculty, admin, club, 
        event, event_tag, event_registration, 
        attendance, notification, message,
        event_budget, expense, feedback, system_log,
        association_tables
    )
    db.configure_mappers()

__all__ = [
    'db',
    'BaseModel',
    'User',
    'Student',
    'Faculty',
    'Admin',
    'AuthToken',
    'Club',
    'Event',
    'EventTag',
    'EventTagMap',
    'EventRegistration',
    'Attendance',
    'Notification',
    'Message',
    'EventBudget',
    'Expense',
    'Feedback',
    'SystemLog',
    'user_club_association',
    'init_models'
]