from flask import Blueprint, jsonify
from flask_swagger_ui import get_swaggerui_blueprint

# Swagger configuration
SWAGGER_URL = '/api/docs'
API_URL = '/static/swagger.json'

# Create swagger blueprint
swagger_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "Event Management System API"
    }
)

# Swagger JSON specification
swagger_spec = {
    "swagger": "2.0",
    "info": {
        "title": "Event Management System API",
        "description": "API documentation for Event Management System Admin Events",
        "version": "1.0.0",
        "contact": {
            "name": "API Support",
            "email": "support@eventmanagement.com"
        }
    },
    "host": "localhost:7000",
    "basePath": "/api",
    "schemes": ["http", "https"],
    "consumes": ["application/json"],
    "produces": ["application/json"],
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT token in format: Bearer <token>"
        }
    },
    "security": [
        {
            "Bearer": []
        }
    ],
    "paths": {
        "/admin/events": {
            "get": {
                "tags": ["Admin Events"],
                "summary": "Get all events with filtering",
                "description": "Retrieve all events with optional filtering by approval status, category, and search terms",
                "parameters": [
                    {
                        "name": "page",
                        "in": "query",
                        "type": "integer",
                        "default": 1,
                        "description": "Page number for pagination"
                    },
                    {
                        "name": "limit",
                        "in": "query",
                        "type": "integer",
                        "default": 10,
                        "description": "Number of events per page"
                    },
                    {
                        "name": "search",
                        "in": "query",
                        "type": "string",
                        "description": "Search term for event title"
                    },
                    {
                        "name": "approval_status",
                        "in": "query",
                        "type": "string",
                        "enum": ["pending", "approved", "rejected"],
                        "description": "Filter by approval status"
                    },
                    {
                        "name": "category",
                        "in": "query",
                        "type": "string",
                        "description": "Filter by event category"
                    },
                    {
                        "name": "event_status",
                        "in": "query",
                        "type": "string",
                        "description": "Filter by event status"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successfully retrieved events",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "success": {
                                    "type": "boolean",
                                    "example": True
                                },
                                "events": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "event_id": {"type": "integer"},
                                            "title": {"type": "string"},
                                            "description": {"type": "string"},
                                            "venue": {"type": "string"},
                                            "category": {"type": "string"},
                                            "approval_status": {"type": "string"},
                                            "event_date": {"type": "string", "format": "date-time"},
                                            "organizer": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {"type": "integer"},
                                                    "name": {"type": "string"},
                                                    "email": {"type": "string"}
                                                }
                                            },
                                            "stats": {
                                                "type": "object",
                                                "properties": {
                                                    "registration_count": {"type": "integer"},
                                                    "attendance_count": {"type": "integer"},
                                                    "feedback_count": {"type": "integer"},
                                                    "message_count": {"type": "integer"}
                                                }
                                            }
                                        }
                                    }
                                },
                                "total": {"type": "integer"},
                                "pages": {"type": "integer"},
                                "current_page": {"type": "integer"},
                                "per_page": {"type": "integer"}
                            }
                        }
                    },
                    "401": {
                        "description": "Unauthorized - Invalid or missing token"
                    },
                    "403": {
                        "description": "Forbidden - Admin access required"
                    }
                }
            }
        },
        "/admin/events/{event_id}": {
            "get": {
                "tags": ["Admin Events"],
                "summary": "Get detailed event information",
                "description": "Retrieve comprehensive details about a specific event including registrations, attendances, feedbacks, and documents",
                "parameters": [
                    {
                        "name": "event_id",
                        "in": "path",
                        "required": True,
                        "type": "integer",
                        "description": "ID of the event"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successfully retrieved event details",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "success": {"type": "boolean"},
                                "event": {
                                    "type": "object",
                                    "properties": {
                                        "event_id": {"type": "integer"},
                                        "title": {"type": "string"},
                                        "description": {"type": "string"},
                                        "venue": {"type": "string"},
                                        "category": {"type": "string"},
                                        "approval_status": {"type": "string"},
                                        "event_date": {"type": "string", "format": "date-time"},
                                        "organizer": {
                                            "type": "object",
                                            "properties": {
                                                "id": {"type": "integer"},
                                                "name": {"type": "string"},
                                                "email": {"type": "string"}
                                            }
                                        },
                                        "registrations": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "registration_id": {"type": "integer"},
                                                    "user_id": {"type": "integer"},
                                                    "user_name": {"type": "string"},
                                                    "registration_date": {"type": "string", "format": "date-time"},
                                                    "status": {"type": "string"}
                                                }
                                            }
                                        },
                                        "attendances": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "attendance_id": {"type": "integer"},
                                                    "user_id": {"type": "integer"},
                                                    "user_name": {"type": "string"},
                                                    "check_in_time": {"type": "string", "format": "date-time"},
                                                    "check_out_time": {"type": "string", "format": "date-time"}
                                                }
                                            }
                                        },
                                        "feedbacks": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "feedback_id": {"type": "integer"},
                                                    "user_id": {"type": "integer"},
                                                    "user_name": {"type": "string"},
                                                    "rating": {"type": "integer"},
                                                    "comment": {"type": "string"},
                                                    "created_at": {"type": "string", "format": "date-time"}
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Event not found"
                    },
                    "401": {
                        "description": "Unauthorized - Invalid or missing token"
                    },
                    "403": {
                        "description": "Forbidden - Admin access required"
                    }
                }
            }
        },
        "/admin/events/{event_id}/approval-status": {
            "patch": {
                "tags": ["Admin Events"],
                "summary": "Update event approval status",
                "description": "Change the approval status of an event (pending, approved, rejected)",
                "parameters": [
                    {
                        "name": "event_id",
                        "in": "path",
                        "required": True,
                        "type": "integer",
                        "description": "ID of the event"
                    },
                    {
                        "name": "body",
                        "in": "body",
                        "required": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "approval_status": {
                                    "type": "string",
                                    "enum": ["pending", "approved", "rejected"],
                                    "description": "New approval status"
                                }
                            },
                            "required": ["approval_status"]
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successfully updated event approval status",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "success": {"type": "boolean"},
                                "message": {"type": "string"},
                                "event_id": {"type": "integer"},
                                "old_status": {"type": "string"},
                                "new_status": {"type": "string"}
                            }
                        }
                    },
                    "400": {
                        "description": "Bad request - Invalid approval status"
                    },
                    "404": {
                        "description": "Event not found"
                    },
                    "401": {
                        "description": "Unauthorized - Invalid or missing token"
                    },
                    "403": {
                        "description": "Forbidden - Admin access required"
                    },
                    "500": {
                        "description": "Internal server error"
                    }
                }
            }
        },
        "/admin/events/pending": {
            "get": {
                "tags": ["Admin Events"],
                "summary": "Get pending events",
                "description": "Retrieve all events with pending approval status",
                "parameters": [
                    {
                        "name": "page",
                        "in": "query",
                        "type": "integer",
                        "default": 1,
                        "description": "Page number for pagination"
                    },
                    {
                        "name": "limit",
                        "in": "query",
                        "type": "integer",
                        "default": 10,
                        "description": "Number of events per page"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successfully retrieved pending events",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "success": {"type": "boolean"},
                                "events": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "event_id": {"type": "integer"},
                                            "title": {"type": "string"},
                                            "description": {"type": "string"},
                                            "venue": {"type": "string"},
                                            "category": {"type": "string"},
                                            "event_date": {"type": "string", "format": "date-time"},
                                            "created_at": {"type": "string", "format": "date-time"},
                                            "organizer": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {"type": "integer"},
                                                    "name": {"type": "string"}
                                                }
                                            }
                                        }
                                    }
                                },
                                "total": {"type": "integer"},
                                "pages": {"type": "integer"},
                                "current_page": {"type": "integer"},
                                "per_page": {"type": "integer"}
                            }
                        }
                    },
                    "401": {
                        "description": "Unauthorized - Invalid or missing token"
                    },
                    "403": {
                        "description": "Forbidden - Admin access required"
                    }
                }
            }
        },
        "/admin/events/rejected": {
            "get": {
                "tags": ["Admin Events"],
                "summary": "Get rejected events",
                "description": "Retrieve all events with rejected approval status",
                "parameters": [
                    {
                        "name": "page",
                        "in": "query",
                        "type": "integer",
                        "default": 1,
                        "description": "Page number for pagination"
                    },
                    {
                        "name": "limit",
                        "in": "query",
                        "type": "integer",
                        "default": 10,
                        "description": "Number of events per page"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successfully retrieved rejected events",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "success": {"type": "boolean"},
                                "events": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "event_id": {"type": "integer"},
                                            "title": {"type": "string"},
                                            "description": {"type": "string"},
                                            "venue": {"type": "string"},
                                            "category": {"type": "string"},
                                            "event_date": {"type": "string", "format": "date-time"},
                                            "created_at": {"type": "string", "format": "date-time"},
                                            "organizer": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {"type": "integer"},
                                                    "name": {"type": "string"}
                                                }
                                            }
                                        }
                                    }
                                },
                                "total": {"type": "integer"},
                                "pages": {"type": "integer"},
                                "current_page": {"type": "integer"},
                                "per_page": {"type": "integer"}
                            }
                        }
                    },
                    "401": {
                        "description": "Unauthorized - Invalid or missing token"
                    },
                    "403": {
                        "description": "Forbidden - Admin access required"
                    }
                }
            }
        },
        "/admin/events/approved": {
            "get": {
                "tags": ["Admin Events"],
                "summary": "Get approved events",
                "description": "Retrieve all events with approved approval status",
                "parameters": [
                    {
                        "name": "page",
                        "in": "query",
                        "type": "integer",
                        "default": 1,
                        "description": "Page number for pagination"
                    },
                    {
                        "name": "limit",
                        "in": "query",
                        "type": "integer",
                        "default": 10,
                        "description": "Number of events per page"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successfully retrieved approved events",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "success": {"type": "boolean"},
                                "events": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "event_id": {"type": "integer"},
                                            "title": {"type": "string"},
                                            "description": {"type": "string"},
                                            "venue": {"type": "string"},
                                            "category": {"type": "string"},
                                            "event_date": {"type": "string", "format": "date-time"},
                                            "created_at": {"type": "string", "format": "date-time"},
                                            "organizer": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {"type": "integer"},
                                                    "name": {"type": "string"}
                                                }
                                            }
                                        }
                                    }
                                },
                                "total": {"type": "integer"},
                                "pages": {"type": "integer"},
                                "current_page": {"type": "integer"},
                                "per_page": {"type": "integer"}
                            }
                        }
                    },
                    "401": {
                        "description": "Unauthorized - Invalid or missing token"
                    },
                    "403": {
                        "description": "Forbidden - Admin access required"
                    }
                }
            }
                 },
         "/admin/events/{event_id}/chat": {
             "get": {
                 "tags": ["Admin Events"],
                 "summary": "Get event chat messages",
                 "description": "Retrieve chat messages for a specific event and chat type",
                 "parameters": [
                     {
                         "name": "event_id",
                         "in": "path",
                         "required": True,
                         "type": "integer",
                         "description": "ID of the event"
                     },
                     {
                         "name": "chat_type",
                         "in": "query",
                         "type": "string",
                         "default": "organizer_admin",
                         "description": "Type of chat to retrieve"
                     }
                 ],
                 "responses": {
                     "200": {
                         "description": "Successfully retrieved chat messages",
                         "schema": {
                             "type": "object",
                             "properties": {
                                 "success": {"type": "boolean"},
                                 "messages": {
                                     "type": "array",
                                     "items": {
                                         "type": "object",
                                         "properties": {
                                             "id": {"type": "integer"},
                                             "event_id": {"type": "integer"},
                                             "sender_id": {"type": "integer"},
                                             "sender_name": {"type": "string"},
                                             "message": {"type": "string"},
                                             "chat_type": {"type": "string"},
                                             "timestamp": {"type": "string", "format": "date-time"}
                                         }
                                     }
                                 }
                             }
                         }
                     },
                     "404": {
                         "description": "Event not found"
                     },
                     "401": {
                         "description": "Unauthorized - Invalid or missing token"
                     },
                     "403": {
                         "description": "Forbidden - Admin access required"
                     }
                 }
             }
         }
     },
     "definitions": {
         "Event": {
             "type": "object",
             "properties": {
                 "event_id": {"type": "integer"},
                 "title": {"type": "string"},
                 "description": {"type": "string"},
                 "venue": {"type": "string"},
                 "category": {"type": "string"},
                 "approval_status": {
                     "type": "string",
                     "enum": ["pending", "approved", "rejected"]
                 },
                 "event_date": {"type": "string", "format": "date-time"},
                 "created_at": {"type": "string", "format": "date-time"}
             }
         },
         "ChatMessage": {
             "type": "object",
             "properties": {
                 "id": {"type": "integer"},
                 "event_id": {"type": "integer"},
                 "sender_id": {"type": "integer"},
                 "sender_name": {"type": "string"},
                 "message": {"type": "string"},
                 "chat_type": {"type": "string"},
                 "timestamp": {"type": "string", "format": "date-time"}
             }
         },
         "Error": {
             "type": "object",
             "properties": {
                 "error": {"type": "boolean"},
                 "message": {"type": "string"}
             }
         }
     }
}

def create_swagger_json():
    """Create swagger.json file in static directory"""
    import os
    import json
    
    # Create static directory if it doesn't exist
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')
    os.makedirs(static_dir, exist_ok=True)
    
    # Write swagger spec to JSON file
    swagger_file = os.path.join(static_dir, 'swagger.json')
    with open(swagger_file, 'w') as f:
        json.dump(swagger_spec, f, indent=2)
    
    return swagger_file
