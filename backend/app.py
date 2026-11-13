from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import os, uuid

from database import init_db, register_user, login_user, set_online, search_users, save_message, get_messages, get_online_users
from srnet_inference import check_image

app = Flask(__name__)
app.config['SECRET_KEY'] = 'stegochat_secret'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

init_db()

# --- Track connected users ---
connected_users = {}  # username -> socket id

# ============================================================
# REST ENDPOINTS
# ============================================================

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password required'}), 400
    if len(username) < 3:
        return jsonify({'success': False, 'message': 'Username must be at least 3 characters'}), 400
    success = register_user(username, password)
    if success:
        return jsonify({'success': True, 'message': 'Registered successfully'})
    return jsonify({'success': False, 'message': 'Username already exists'}), 409

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = login_user(data.get('username'), data.get('password'))
    if user:
        return jsonify({'success': True, 'username': user['username']})
    return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

@app.route('/search', methods=['GET'])
def search():
    query   = request.args.get('q', '')
    exclude = request.args.get('exclude', '')
    users   = search_users(query, exclude)
    return jsonify({'users': users})

@app.route('/messages', methods=['GET'])
def messages():
    user1 = request.args.get('user1')
    user2 = request.args.get('user2')
    msgs  = get_messages(user1, user2)
    return jsonify({'messages': msgs})

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file'}), 400

    file     = request.files['file']
    sender   = request.form.get('sender')
    receiver = request.form.get('receiver')

    # Save file with unique name
    ext      = os.path.splitext(file.filename)[1].lower()
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    # Check if image — run SRNet
    is_image = ext in ['.png', '.jpg', '.jpeg', '.bmp', '.tiff']
    stego_result = None

    if is_image:
        stego_result = check_image(filepath)

    # Save message to DB
    save_message(sender, receiver, file.filename, msg_type='image' if is_image else 'file', filename=filename)

    # Notify receiver via socket
    msg_data = {
        'sender'      : sender,
        'receiver'    : receiver,
        'content'     : file.filename,
        'msg_type'    : 'image' if is_image else 'file',
        'filename'    : filename,
        'stego_result': stego_result
    }

    if receiver in connected_users:
        socketio.emit('new_message', msg_data, room=connected_users[receiver])

    return jsonify({'success': True, 'filename': filename, 'stego_result': stego_result})

@app.route('/uploads/<filename>')
def serve_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/check_image/<filename>')
def check_stego(filename):
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    result = check_image(filepath)
    return jsonify(result)

# ============================================================
# SOCKET.IO EVENTS
# ============================================================

@socketio.on('connect')
def on_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def on_disconnect():
    # Find and remove disconnected user
    username = None
    for u, sid in connected_users.items():
        if sid == request.sid:
            username = u
            break
    if username:
        del connected_users[username]
        set_online(username, False)
        emit('user_status', {'username': username, 'online': False}, broadcast=True)
        print(f"❌ {username} disconnected")

@socketio.on('user_connected')
def on_user_connected(data):
    username = data['username']
    connected_users[username] = request.sid
    set_online(username, True)
    emit('user_status', {'username': username, 'online': True}, broadcast=True)
    print(f"✅ {username} connected")

@socketio.on('send_message')
def on_send_message(data):
    sender   = data['sender']
    receiver = data['receiver']
    content  = data['content']

    save_message(sender, receiver, content, msg_type='text')

    msg_data = {
        'sender'      : sender,
        'receiver'    : receiver,
        'content'     : content,
        'msg_type'    : 'text',
        'stego_result': None
    }

    # Send to receiver if online
    if receiver in connected_users:
        emit('new_message', msg_data, room=connected_users[receiver])

    # Echo back to sender
    emit('new_message', msg_data, room=request.sid)

if __name__ == '__main__':
    print("🚀 Starting StegoChat server...")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)