from .base import db, BaseModel

# ==== Core user models ====
from .user import User
from .student import Student
from .faculty import Faculty
from .admin import Admin
from .auth_token import AuthToken

# ==== Club-related models ====
from .club import Club
from .club_chat import ClubChat
from .association_tables import user_club_association

# ==== Event-related models ====
from .event import Event
from .event_tag import EventTag, EventTagMap
from .event_registration import EventRegistration
from .attendance import Attendance
from .feedback import Feedback
from .message import Message
from .notification import Notification
from .event_document import EventDocument
from .user_event_association import UserEventAssociation
from .event_chat import EventChat
from .event_attendance import EventAttendance
from .event_feedback import EventFeedback

# ==== Finance and budgeting ====
from .budget_allocation import BudgetAllocation
from .event_budget import EventBudget
from .expense import Expense

# ==== System utilities ====
from .system_log import SystemLog

# ==== Postings ====
from .admin_posting import AdminPosting
from .volunteer_posting import VolunteerPosting 
from .volunteer_applications import VolunteerApplication

def init_models():
    """
    Initialize all model relationships and load mappers.
    This should be called before the first database interaction.
    """
    from . import (
        user, student, faculty, admin, auth_token,
        club, club_chat, association_tables,
        event, event_tag, event_registration,
        attendance, feedback, message, notification,
        event_budget, expense, system_log, event_document, 
        UserEventAssociation, EventAttendance, EventChat,
        AdminPosting, VolunteerPosting, EventFeedback, VolunteerApplication
    )
    db.configure_mappers()


__all__ = [
    # Base
    'db',
    'BaseModel',

    # Core
    'User',
    'Student',
    'Faculty',
    'Admin',
    'AuthToken',

    # Club
    'Club',
    'ClubChat',
    'user_club_association',

    # Event
    'Event',
    'EventTag',
    'EventTagMap',
    'EventRegistration',
    'Attendance',
    'Feedback',
    'Message',
    'Notification',
    'EventDocument',
    'UserEventAssociation',
    'EventChat',
    'EventAttendance',
    'EventFeedback',

    # Budget
    'EventBudget',
    'Expense',
    'BudgetAllocation',

    # System
    'SystemLog',

    # Postings
    'AdminPosting',
    'VolunteerPosting',
    'VolunteerApplication',
    # Init
    'init_models'
]
