from functools import wraps
from flask import request
from ..models.auth_token import AuthToken
from datetime import datetime
from ..utils.response_utils import make_response

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
            
        if not token:
            return make_response(error='Token is missing', status_code=401)
            
        auth_token = AuthToken.query.filter_by(token=token).first()
        
        if not auth_token or auth_token.expires_at < datetime.utcnow():
            return make_response(error='Token is invalid or expired', status_code=401)
            
        return f(auth_token.user, *args, **kwargs)
        
    return decorated