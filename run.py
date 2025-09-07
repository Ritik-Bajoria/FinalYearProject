from Backend import create_app, socketio

app = create_app()

if __name__ == '__main__':
    socketio.run(app, debug=True, host='127.0.0.1', port=7000, allow_unsafe_werkzeug=True)