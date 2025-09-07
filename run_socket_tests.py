#!/usr/bin/env python3
"""
Socket Test Runner
Runs comprehensive socket tests and provides debugging information
"""

import subprocess
import sys
import os
import time
import webbrowser
from pathlib import Path

def run_command(command, cwd=None):
    """Run a command and return the result"""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True, 
            cwd=cwd
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def check_backend_running():
    """Check if backend server is running"""
    print("🔍 Checking if backend server is running...")
    
    try:
        import requests
        response = requests.get("http://127.0.0.1:7000", timeout=5)
        print("✅ Backend server is running")
        return True
    except:
        print("❌ Backend server is not running")
        return False

def install_test_dependencies():
    """Install test dependencies"""
    print("📦 Installing test dependencies...")
    
    backend_dir = Path(__file__).parent / "Backend"
    success, stdout, stderr = run_command(
        "pip install python-socketio[client]==5.13.0", 
        cwd=backend_dir
    )
    
    if success:
        print("✅ Test dependencies installed")
        return True
    else:
        print(f"❌ Failed to install dependencies: {stderr}")
        return False

def run_backend_socket_test():
    """Run the backend socket test"""
    print("\n" + "="*50)
    print("🧪 Running Backend Socket Test")
    print("="*50)
    
    backend_dir = Path(__file__).parent / "Backend"
    test_script = backend_dir / "test_socket_connection.py"
    
    if not test_script.exists():
        print("❌ Test script not found")
        return False
    
    print("🚀 Starting socket connection test...")
    print("Note: You'll need to provide a valid admin token when prompted")
    
    success, stdout, stderr = run_command(
        f"python {test_script}", 
        cwd=backend_dir
    )
    
    print("\n📋 Test Output:")
    print(stdout)
    if stderr:
        print("\n❌ Errors:")
        print(stderr)
    
    return success

def open_frontend_test():
    """Open the frontend test page"""
    print("\n" + "="*50)
    print("🌐 Opening Frontend Socket Test")
    print("="*50)
    
    test_file = Path(__file__).parent / "frontend" / "socket_test.html"
    
    if test_file.exists():
        print("🚀 Opening frontend test page in browser...")
        webbrowser.open(f"file://{test_file.absolute()}")
        print("✅ Frontend test page opened")
        print("📝 Instructions:")
        print("  1. Enter your admin token")
        print("  2. Click 'Connect' to test socket connection")
        print("  3. Enter event ID and click 'Join Event Chat'")
        print("  4. Send test messages")
        print("  5. Check the logs for any errors")
        return True
    else:
        print("❌ Frontend test file not found")
        return False

def show_debugging_tips():
    """Show debugging tips"""
    print("\n" + "="*50)
    print("🔧 Debugging Tips")
    print("="*50)
    
    tips = [
        "1. Check backend terminal for socket error logs",
        "2. Verify admin token is valid and not expired",
        "3. Ensure event ID exists in database",
        "4. Check browser console for frontend errors",
        "5. Verify CORS settings allow frontend domain",
        "6. Check if user has proper permissions for event",
        "7. Monitor network tab for failed requests",
        "8. Restart backend server if needed"
    ]
    
    for tip in tips:
        print(f"  {tip}")

def main():
    print("🧪 Socket.IO Test Suite")
    print("="*50)
    
    # Check if backend is running
    if not check_backend_running():
        print("\n❌ Please start the backend server first:")
        print("  cd Backend")
        print("  python app.py")
        return
    
    # Install dependencies
    if not install_test_dependencies():
        print("\n❌ Failed to install test dependencies")
        return
    
    print("\n🎯 Choose test type:")
    print("1. Backend Socket Test (Python)")
    print("2. Frontend Socket Test (Browser)")
    print("3. Both Tests")
    print("4. Show Debugging Tips")
    
    choice = input("\nEnter choice (1-4): ").strip()
    
    if choice == "1":
        run_backend_socket_test()
    elif choice == "2":
        open_frontend_test()
    elif choice == "3":
        run_backend_socket_test()
        time.sleep(2)
        open_frontend_test()
    elif choice == "4":
        show_debugging_tips()
    else:
        print("❌ Invalid choice")
    
    print("\n" + "="*50)
    print("🏁 Test Suite Complete")
    print("="*50)

if __name__ == "__main__":
    main()