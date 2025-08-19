from flask import jsonify

def make_response(data=None, message="Success", error=None, status_code=200):
    """
    Standardized response format for API endpoints
    
    Args:
        data: Response data (dict, list, etc.)
        message: Success message
        error: Error message (if any)
        status_code: HTTP status code
    
    Returns:
        Flask response object
    """
    response_data = {
        "success": error is None,
        "message": message if error is None else error,
        "data": data if error is None else None
    }
    
    if error:
        response_data["error"] = error
    
    return jsonify(response_data), status_code