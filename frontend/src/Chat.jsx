import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const API    = "http://localhost:5000";
const socket = io(API);

export default function Chat({ user, setUser }) {
  const [search, setSearch]         = useState("");
  const [searchResults, setResults] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [text, setText]             = useState("");
  const [popup, setPopup]           = useState(null);
  const [checking, setChecking]     = useState(false);
  const messagesEndRef              = useRef(null);
  const fileInputRef                = useRef(null);

  // Connect socket
  useEffect(() => {
    socket.emit("user_connected", { username: user });

    socket.on("new_message", (msg) => {
      if (msg.sender === activeChat || msg.receiver === activeChat) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => socket.off("new_message");
  }, [user, activeChat]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Search users with debounce
  useEffect(() => {
    if (search.trim().length < 1) return setResults([]);
    const t = setTimeout(async () => {
      const res = await axios.get(`${API}/search?q=${search}&exclude=${user}`);
      setResults(res.data.users);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const openChat = async (username) => {
    setActiveChat(username);
    setSearch("");
    setResults([]);
    const res = await axios.get(`${API}/messages?user1=${user}&user2=${username}`);
    setMessages(res.data.messages);
  };

  const sendText = () => {
    if (!text.trim() || !activeChat) return;
    socket.emit("send_message", { sender: user, receiver: activeChat, content: text });
    setText("");
  };

  const sendFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat) return;
    const form = new FormData();
    form.append("file", file);
    form.append("sender", user);
    form.append("receiver", activeChat);
    await axios.post(`${API}/upload`, form);
    const res = await axios.get(`${API}/messages?user1=${user}&user2=${activeChat}`);
    setMessages(res.data.messages);
    e.target.value = null;
  };

  const handleDownload = async (msg) => {
    setChecking(true);
    try {
      const res    = await axios.get(`${API}/check_image/${msg.filename}`);
      const result = res.data;

      if (result.is_stego) {
        setPopup({
          type   : "danger",
          title  : "Malicious Content Detected!",
          message: `This image contains hidden malicious data (steganography).\nStego probability: ${result.stego_prob}%\n\nDownload blocked for your safety.`,
          result
        });
      } else {
        setPopup({
          type       : "safe",
          title      : "Image is Safe",
          message    : `No hidden data detected.\nCover probability: ${result.cover_prob}%`,
          result,
          downloadUrl: `${API}/uploads/${msg.filename}`,
          filename   : msg.content
        });
      }
    } catch (e) {
      alert("Error checking image. Try again.");
    }
    setChecking(false);
  };

  const confirmDownload = (url, filename) => {
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    setPopup(null);
  };

  return (
    <div style={styles.app}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.avatar}>{user[0].toUpperCase()}</div>
          <span style={styles.username}>{user}</span>
          <button style={styles.logoutBtn}
                  onClick={() => { socket.disconnect(); setUser(null); }}>
            Exit
          </button>
        </div>

        <div style={styles.searchBox}>
          <input style={styles.searchInput}
                 placeholder="Search users..."
                 value={search}
                 onChange={e => setSearch(e.target.value)} />
        </div>

        {searchResults.length > 0 && (
          <div style={styles.searchResults}>
            {searchResults.map(u => (
              <div key={u.username} style={styles.userItem}
                   onClick={() => openChat(u.username)}>
                <div style={styles.userAvatar}>{u.username[0].toUpperCase()}</div>
                <div>
                  <div style={styles.userName}>{u.username}</div>
                  <div style={{fontSize:"11px",
                               color: u.online ? "#00d4aa" : "#8892a4"}}>
                    {u.online ? "● Online" : "○ Offline"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={styles.sidebarHint}>
          {activeChat
            ? `Chatting with ${activeChat}`
            : "Search a user to start chatting"}
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={styles.chatArea}>
        {activeChat ? (
          <>
            <div style={styles.chatHeader}>
              <div style={styles.userAvatar}>{activeChat[0].toUpperCase()}</div>
              <span style={styles.chatUsername}>{activeChat}</span>
              <span style={styles.srnetBadge}>🛡️ SRNet Protected</span>
            </div>

            <div style={styles.messages}>
              {messages.map((msg, i) => {
                const isMine = msg.sender === user;
                return (
                  <div key={i} style={{
                    ...styles.msgWrapper,
                    justifyContent: isMine ? "flex-end" : "flex-start"
                  }}>
                    <div style={{
                      ...styles.bubble,
                      background: isMine ? "#00d4aa" : "#1e2538",
                      color      : isMine ? "#0a0f1e" : "#fff",
                    }}>
                      {msg.msg_type === "text" ? (
                        <span>{msg.content}</span>
                      ) : (
                        <div style={styles.fileMsg}>
                          <span>🖼️ {msg.content}</span>
                          <button
                            style={{
                              ...styles.downloadBtn,
                              background: isMine ? "#0a0f1e" : "#00d4aa",
                              color      : isMine ? "#00d4aa" : "#0a0f1e",
                              opacity    : checking ? 0.6 : 1
                            }}
                            onClick={() => handleDownload(msg)}
                            disabled={checking}>
                            {checking ? "Checking..." : "⬇ Download"}
                          </button>
                        </div>
                      )}
                      <div style={{
                        ...styles.timestamp,
                        color: isMine ? "rgba(10,15,30,0.6)" : "rgba(255,255,255,0.4)"
                      }}>
                        {new Date(msg.timestamp).toLocaleTimeString([],
                          {hour:'2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={styles.inputBar}>
              <button style={styles.attachBtn}
                      onClick={() => fileInputRef.current.click()}>
                📎
              </button>
              <input type="file" ref={fileInputRef} style={{display:"none"}}
                     accept="image/*,.pdf,.zip,.txt"
                     onChange={sendFile} />
              <input style={styles.textInput}
                     placeholder="Type a message..."
                     value={text}
                     onChange={e => setText(e.target.value)}
                     onKeyDown={e => e.key === "Enter" && sendText()} />
              <button style={styles.sendBtn} onClick={sendText}>➤</button>
            </div>
          </>
        ) : (
          <div style={styles.noChat}>
            <div style={{fontSize:"64px"}}>🛡️</div>
            <h2 style={{color:"#00d4aa", marginBottom:"12px"}}>Welcome to StegoChat</h2>
            <p style={{color:"#8892a4"}}>
              Search for a user to start a secure conversation
            </p>
          </div>
        )}
      </div>

      {/* STEGO CHECK POPUP */}
      {popup && (
        <div style={styles.overlay}>
          <div style={styles.popupBox}>
            <div style={{fontSize:"48px", marginBottom:"12px"}}>
              {popup.type === "danger" ? "⚠️" : "✅"}
            </div>
            <h2 style={{
              color    : popup.type === "danger" ? "#ff6b6b" : "#00d4aa",
              marginTop: 0, marginBottom:"16px"
            }}>
              {popup.title}
            </h2>

            {/* Probability bars */}
            <div style={styles.probBars}>
              <div style={styles.probRow}>
                <span style={{color:"#8892a4", fontSize:"13px", width:"50px"}}>Cover</span>
                <div style={styles.barBg}>
                  <div style={{...styles.barFill,
                               width:`${popup.result.cover_prob}%`,
                               background:"#00d4aa"}} />
                </div>
                <span style={{color:"#00d4aa", fontSize:"13px", width:"50px",
                              textAlign:"right"}}>
                  {popup.result.cover_prob}%
                </span>
              </div>
              <div style={styles.probRow}>
                <span style={{color:"#8892a4", fontSize:"13px", width:"50px"}}>Stego</span>
                <div style={styles.barBg}>
                  <div style={{...styles.barFill,
                               width:`${popup.result.stego_prob}%`,
                               background:"#ff6b6b"}} />
                </div>
                <span style={{color:"#ff6b6b", fontSize:"13px", width:"50px",
                              textAlign:"right"}}>
                  {popup.result.stego_prob}%
                </span>
              </div>
            </div>

            <p style={{color:"#8892a4", whiteSpace:"pre-line",
                       fontSize:"13px", margin:"16px 0"}}>
              {popup.message}
            </p>

            <div style={{display:"flex", gap:"12px", justifyContent:"center"}}>
              {popup.type === "safe" && (
                <button style={{...styles.popupBtn,
                                background:"#00d4aa", color:"#0a0f1e"}}
                        onClick={() => confirmDownload(popup.downloadUrl, popup.filename)}>
                  Download Image
                </button>
              )}
              <button style={{...styles.popupBtn,
                              background:"#2a3142", color:"#fff"}}
                      onClick={() => setPopup(null)}>
                {popup.type === "danger" ? "OK, Block It" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  app          : { display:"flex", height:"100vh", background:"#0a0f1e", color:"#fff" },
  sidebar      : { width:"300px", background:"#111827",
                   borderRight:"1px solid #1e2538", display:"flex",
                   flexDirection:"column" },
  sidebarHeader: { padding:"16px", display:"flex", alignItems:"center", gap:"10px",
                   borderBottom:"1px solid #1e2538" },
  avatar       : { width:"38px", height:"38px", borderRadius:"50%",
                   background:"#00d4aa", display:"flex", alignItems:"center",
                   justifyContent:"center", fontWeight:"bold",
                   color:"#0a0f1e", fontSize:"16px" },
  username     : { flex:1, fontWeight:"bold", color:"#fff" },
  logoutBtn    : { background:"transparent", border:"1px solid #ff6b6b",
                   color:"#ff6b6b", borderRadius:"6px", padding:"4px 10px",
                   cursor:"pointer", fontSize:"12px" },
  searchBox    : { padding:"12px" },
  searchInput  : { width:"100%", padding:"10px", borderRadius:"8px",
                   border:"1px solid #2a3142", background:"#0d1117",
                   color:"#fff", fontSize:"14px", boxSizing:"border-box" },
  searchResults: { padding:"0 12px", maxHeight:"300px", overflowY:"auto" },
  userItem     : { display:"flex", alignItems:"center", gap:"10px", padding:"10px",
                   borderRadius:"8px", cursor:"pointer", marginBottom:"4px",
                   transition:"background 0.2s" },
  userAvatar   : { width:"36px", height:"36px", borderRadius:"50%",
                   background:"#2a3142", display:"flex", alignItems:"center",
                   justifyContent:"center", fontWeight:"bold", color:"#00d4aa" },
  userName     : { fontWeight:"bold", color:"#fff", fontSize:"14px" },
  sidebarHint  : { padding:"16px", color:"#8892a4", fontSize:"12px",
                   textAlign:"center", marginTop:"auto" },
  chatArea     : { flex:1, display:"flex", flexDirection:"column" },
  chatHeader   : { padding:"14px 20px", borderBottom:"1px solid #1e2538",
                   display:"flex", alignItems:"center", gap:"12px",
                   background:"#111827" },
  chatUsername : { fontWeight:"bold", fontSize:"16px", flex:1 },
  srnetBadge   : { fontSize:"12px", color:"#00d4aa", background:"rgba(0,212,170,0.1)",
                   padding:"4px 10px", borderRadius:"20px",
                   border:"1px solid rgba(0,212,170,0.3)" },
  messages     : { flex:1, overflowY:"auto", padding:"20px",
                   display:"flex", flexDirection:"column", gap:"8px" },
  msgWrapper   : { display:"flex" },
  bubble       : { maxWidth:"65%", padding:"10px 14px", borderRadius:"12px",
                   fontSize:"14px", lineHeight:"1.5" },
  fileMsg      : { display:"flex", flexDirection:"column", gap:"8px" },
  downloadBtn  : { padding:"6px 14px", borderRadius:"6px", border:"none",
                   cursor:"pointer", fontWeight:"bold", fontSize:"13px" },
  timestamp    : { fontSize:"10px", marginTop:"4px", textAlign:"right" },
  inputBar     : { padding:"12px 16px", borderTop:"1px solid #1e2538",
                   background:"#111827", display:"flex", gap:"10px",
                   alignItems:"center" },
  attachBtn    : { background:"transparent", border:"none", fontSize:"22px",
                   cursor:"pointer", color:"#8892a4" },
  textInput    : { flex:1, padding:"10px 14px", borderRadius:"20px",
                   border:"1px solid #2a3142", background:"#0d1117",
                   color:"#fff", fontSize:"14px" },
  sendBtn      : { background:"#00d4aa", border:"none", color:"#0a0f1e",
                   borderRadius:"50%", width:"40px", height:"40px",
                   cursor:"pointer", fontSize:"16px", fontWeight:"bold" },
  noChat       : { flex:1, display:"flex", flexDirection:"column",
                   alignItems:"center", justifyContent:"center",
                   color:"#8892a4" },
  overlay      : { position:"fixed", top:0, left:0, right:0, bottom:0,
                   background:"rgba(0,0,0,0.7)", display:"flex",
                   alignItems:"center", justifyContent:"center", zIndex:1000 },
  popupBox     : { background:"#1a1f2e", padding:"32px", borderRadius:"16px",
                   width:"400px", textAlign:"center",
                   boxShadow:"0 8px 32px rgba(0,0,0,0.5)" },
  probBars     : { display:"flex", flexDirection:"column", gap:"10px",
                   margin:"16px 0" },
  probRow      : { display:"flex", alignItems:"center", gap:"10px" },
  barBg        : { flex:1, height:"10px", background:"#2a3142",
                   borderRadius:"5px", overflow:"hidden" },
  barFill      : { height:"100%", borderRadius:"5px",
                   transition:"width 0.5s ease" },
  popupBtn     : { padding:"10px 24px", borderRadius:"8px", border:"none",
                   cursor:"pointer", fontWeight:"bold", fontSize:"14px" },
};