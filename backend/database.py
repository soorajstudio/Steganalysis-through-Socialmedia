import sqlite3
import hashlib
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'chat.db')

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT    UNIQUE NOT NULL,
            password TEXT    NOT NULL,
            online   INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS messages (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            sender      TEXT    NOT NULL,
            receiver    TEXT    NOT NULL,
            content     TEXT,
            msg_type    TEXT    DEFAULT "text",
            filename    TEXT,
            timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    conn.commit()
    conn.close()
    print("✅ Database initialized")

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def register_user(username, password):
    try:
        conn = get_conn()
        conn.execute("INSERT INTO users (username, password) VALUES (?, ?)",
                     (username, hash_password(password)))
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        return False  # username already exists

def login_user(username, password):
    conn = get_conn()
    user = conn.execute(
        "SELECT * FROM users WHERE username=? AND password=?",
        (username, hash_password(password))
    ).fetchone()
    conn.close()
    return dict(user) if user else None

def set_online(username, status):
    conn = get_conn()
    conn.execute("UPDATE users SET online=? WHERE username=?", (1 if status else 0, username))
    conn.commit()
    conn.close()

def get_online_users():
    conn = get_conn()
    users = conn.execute("SELECT username FROM users WHERE online=1").fetchall()
    conn.close()
    return [u['username'] for u in users]

def search_users(query, exclude):
    conn = get_conn()
    users = conn.execute(
        "SELECT username, online FROM users WHERE username LIKE ? AND username != ?",
        (f'%{query}%', exclude)
    ).fetchall()
    conn.close()
    return [dict(u) for u in users]

def save_message(sender, receiver, content, msg_type='text', filename=None):
    conn = get_conn()
    conn.execute(
        "INSERT INTO messages (sender, receiver, content, msg_type, filename) VALUES (?,?,?,?,?)",
        (sender, receiver, content, msg_type, filename)
    )
    conn.commit()
    conn.close()

def get_messages(user1, user2):
    conn = get_conn()
    msgs = conn.execute('''
        SELECT * FROM messages
        WHERE (sender=? AND receiver=?) OR (sender=? AND receiver=?)
        ORDER BY timestamp ASC
    ''', (user1, user2, user2, user1)).fetchall()
    conn.close()
    return [dict(m) for m in msgs]