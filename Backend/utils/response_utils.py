from flask import jsonify
from datetime import datetime

def make_response(data=None, message=None, error=None, status_code=200):
    response = {
        'success': error is None,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if data is not None:
        response['data'] = data
    if message:
        response['message'] = message
    if error:
        response['error'] = error
    
    return jsonify(response), status_code