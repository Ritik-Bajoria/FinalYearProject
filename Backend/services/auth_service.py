from Backend.models.user import User
from Backend.models.student import Student
from Backend.models.faculty import Faculty
from Backend.models.admin import Admin
from Backend.models.auth_token import AuthToken
from Backend.models import db
from datetime import datetime, timedelta
import uuid

class AuthService:
    @staticmethod
    def register_user_with_role(data):
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return None, None, 'User already exists'

        try:
            # Create base user
            user = User(
                email=data['email'],
                created_at=datetime.utcnow()
            )
            user.set_password(data['password'])
            db.session.add(user)
            db.session.flush()  # Get the user_id before commit

            role_data = None
            role = data.get('role', 'student').lower()

            # Create role-specific record
            if role == 'student' and 'student' in data:
                student_data = data['student']
                student = Student(
                    user_id=user.user_id,
                    full_name=student_data['full_name'],
                    student_id_number=student_data['student_id_number'],
                    year_of_study=student_data.get('year_of_study'),
                    major=student_data.get('major'),
                    profile_picture=student_data.get('profile_picture')
                )
                db.session.add(student)
                role_data = {'student': student}

            elif role == 'faculty' and 'faculty' in data:
                faculty_data = data['faculty']
                faculty = Faculty(
                    user_id=user.user_id,
                    full_name=faculty_data['full_name'],
                    faculty_id_number=faculty_data['faculty_id_number'],
                    department=faculty_data.get('department'),
                    position=faculty_data.get('position'),
                    profile_picture=faculty_data.get('profile_picture')
                )
                db.session.add(faculty)
                role_data = {'faculty': faculty}

            elif role == 'admin' and 'admin' in data:
                admin_data = data['admin']
                admin = Admin(
                    user_id=user.user_id,
                    full_name=admin_data['full_name'],
                    admin_role=admin_data['admin_role'],
                    permissions_level=admin_data.get('permissions_level', 1)
                )
                db.session.add(admin)
                role_data = {'admin': admin}

            else:
                db.session.rollback()
                return None, None, 'Invalid role or missing role data'

            db.session.commit()
            return user, role_data, None

        except Exception as e:
            db.session.rollback()
            return None, None, str(e)

    @staticmethod
    def login_user(email, password):
        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return None, None, 'Invalid credentials'

        # Get role-specific data
        role_data = {}
        if user.student:
            role_data['student'] = user.student
        elif user.faculty:
            role_data['faculty'] = user.faculty
        elif user.admin:
            role_data['admin'] = user.admin

        return user, role_data, None

    @staticmethod
    def generate_auth_token(user, expiration_hours):
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
    def get_role_data(user):
        """Fetch role-specific data for a user"""
        role_data = {}
        if user.student:
            role_data['student'] = {
                'student_id': user.student.student_id,
                'full_name': user.student.full_name,
                'student_id_number': user.student.student_id_number,
                'year_of_study': user.student.year_of_study,
                'major': user.student.major,
                'profile_picture': user.student.profile_picture
            }
        elif user.faculty:
            role_data['faculty'] = {
                'faculty_id': user.faculty.faculty_id,
                'full_name': user.faculty.full_name,
                'faculty_id_number': user.faculty.faculty_id_number,
                'department': user.faculty.department,
                'position': user.faculty.position,
                'profile_picture': user.faculty.profile_picture
            }
        elif user.admin:
            role_data['admin'] = {
                'admin_id': user.admin.admin_id,
                'full_name': user.admin.full_name,
                'admin_role': user.admin.admin_role,
                'permissions_level': user.admin.permissions_level
            }
        return role_data