from .base import db, BaseModel

class SystemLog(BaseModel):
    __tablename__ = 'system_logs'

    log_id = db.Column(db.Integer, primary_key=True)
    action_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    action_type = db.Column(db.String(50))
    log_type = db.Column(db.String(50)) # info, success, warning, error
    description = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())