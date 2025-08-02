class ValidationError(Exception):
    """Custom exception for validation errors"""
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        rv['status_code'] = self.status_code
        return rv


class AuthError(Exception):
    """Custom exception for authentication errors"""
    def __init__(self, message, status_code=401):
        super().__init__(message)
        self.status_code = status_code