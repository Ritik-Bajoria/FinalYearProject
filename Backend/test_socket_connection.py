#!/usr/bin/env python3
"""
Socket.IO Connection Test Script
Tests all socket connections and handlers
"""

import socketio
import time
import json
import sys
import os

# Add the Backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class SocketTester:
    def __init__(self, server_url='http://127.0.0.1:7000'):
        self.server_url = server_url
        self.sio = socketio.Client()
        self.connected = False
        self.authenticated = False
        self.errors = []
        
        # Setup event handlers
        self.setup_handlers()
    
    def setup_handlers(self):
        @self.sio.event
        def connect():
            print("✅ Connected to server")
            self.connected = True
        
        @self.sio.event
        def disconnect():
            print("❌ Disconnected from server")
            self.connected = False
        
        @self.sio.event
        def connect_error(data):
            print(f"❌ Connection error: {data}")
            self.errors.append(f"Connection error: {data}")
        
        @self.sio.event
        def authenticated(data):
            print(f"✅ Authenticated: {data}")
            self.authenticated = True
        
        @self.sio.event
        def auth_error(data):
            print(f"❌ Authentication error: {data}")
            self.errors.append(f"Auth error: {data}")
        
        @self.sio.event
        def error(data):
            print(f"❌ Socket error: {data}")
            self.errors.append(f"Socket error: {data}")
        
        @self.sio.event
        def joined_chat(data):
            print(f"✅ Joined chat: {data}")
        
        @self.sio.event
        def new_event_message(data):
            print(f"📨 New message: {data}")
    
    def connect_to_server(self):
        try:
            print(f"🔌 Connecting to {self.server_url}...")
            self.sio.connect(self.server_url, transports=['polling', 'websocket'])
            time.sleep(1)
            return self.connected
        except Exception as e:
            print(f"❌ Failed to connect: {e}")
            self.errors.append(f"Connection failed: {e}")
            return False
    
    def authenticate(self, token):
        if not self.connected:
            print("❌ Not connected to server")
            return False
        
        print("🔐 Authenticating...")
        self.sio.emit('authenticate', {'token': token})
        time.sleep(2)
        return self.authenticated
    
    def join_event_chat(self, event_id, chat_type='organizer_admin'):
        if not self.authenticated:
            print("❌ Not authenticated")
            return False
        
        print(f"🎉 Joining event chat: {event_id}, {chat_type}")
        self.sio.emit('join_event_chat', {
            'event_id': event_id,
            'chat_type': chat_type
        })
        time.sleep(1)
        return True
    
    def send_test_message(self, event_id, chat_type='organizer_admin', message="Test message"):
        if not self.authenticated:
            print("❌ Not authenticated")
            return False
        
        print(f"📤 Sending test message...")
        self.sio.emit('send_event_message', {
            'event_id': event_id,
            'chat_type': chat_type,
            'message': message
        }, callback=self.message_callback)
        time.sleep(2)
        return True
    
    def message_callback(self, response):
        if response and 'error' in response:
            print(f"Message send error: {response['error']}")
            self.errors.append(f"Message error: {response['error']}")
        else:
            print(f"Message sent successfully: {response}")
    
    def disconnect_from_server(self):
        if self.connected:
            print("🔌 Disconnecting...")
            self.sio.disconnect()
            time.sleep(1)
    
    def run_full_test(self, token, event_id=1):
        print("=" * 50)
        print("Starting Socket.IO Connection Test")
        print("=" * 50)
        
        # Test 1: Connection
        if not self.connect_to_server():
            print("Test FAILED: Could not connect to server")
            return False
        
        # Test 2: Authentication
        if not self.authenticate(token):
            print("Test FAILED: Could not authenticate")
            return False
        
        # Test 3: Join event chat
        if not self.join_event_chat(event_id):
            print("Test FAILED: Could not join event chat")
            return False
        
        # Test 4: Send message
        if not self.send_test_message(event_id):
            print("Test FAILED: Could not send message")
            return False
        
        # Test 5: Disconnect
        self.disconnect_from_server()
        
        if self.errors:
            print("\nTest completed with errors:")
            for error in self.errors:
                print(f"  - {error}")
            return False
        else:
            print("\nAll tests passed successfully!")
            return True

def main():
    # Test token - replace with a valid admin token
    test_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3MzQ3ODI0MzV9.example"
    
    print("Please provide a valid admin token for testing:")
    token_input = input("Token (or press Enter to use default): ").strip()
    if token_input:
        test_token = token_input
    
    tester = SocketTester()
    success = tester.run_full_test(test_token, event_id=5)
    
    if success:
        print("\nSocket.IO is working correctly!")
        sys.exit(0)
    else:
        print("\nSocket.IO has issues that need to be fixed!")
        sys.exit(1)

if __name__ == "__main__":
    main()