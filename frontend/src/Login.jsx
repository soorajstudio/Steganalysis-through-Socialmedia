import { useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

export default function Login({ setUser }) {
  const [mode, setMode]         = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) return setError("Fill in all fields");
    setLoading(true);
    setError("");
    try {
      const url = mode === "login" ? `${API}/login` : `${API}/register`;
      const res = await axios.post(url, { username, password });
      if (res.data.success) {
        if (mode === "register") {
          setMode("login");
          setError("Registered! Please login.");
        } else {
          setUser(res.data.username);
        }
      }
    } catch (e) {
      setError(e.response?.data?.message || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <div style={styles.logo}>🛡️</div>
        <h1 style={styles.title}>StegoChat</h1>
        <p style={styles.subtitle}>Secure Messenger with Steganalysis</p>

        <div style={styles.tabs}>
          <button style={{...styles.tab, ...(mode==="login" ? styles.activeTab : {})}}
                  onClick={() => { setMode("login"); setError(""); }}>Login</button>
          <button style={{...styles.tab, ...(mode==="register" ? styles.activeTab : {})}}
                  onClick={() => { setMode("register"); setError(""); }}>Register</button>
        </div>

        <input style={styles.input} placeholder="Username" value={username}
               onChange={e => setUsername(e.target.value)} />
        <input style={styles.input} placeholder="Password" type="password" value={password}
               onChange={e => setPassword(e.target.value)}
               onKeyDown={e => e.key === "Enter" && handleSubmit()} />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container : { display:"flex", justifyContent:"center", alignItems:"center",
                height:"100vh", background:"#0a0f1e" },
  box       : { background:"#1a1f2e", padding:"40px", borderRadius:"16px",
                width:"360px", textAlign:"center",
                boxShadow:"0 8px 32px rgba(0,0,0,0.4)" },
  logo      : { fontSize:"48px", marginBottom:"8px" },
  title     : { color:"#00d4aa", margin:"0 0 4px", fontSize:"28px" },
  subtitle  : { color:"#8892a4", fontSize:"13px", marginBottom:"28px" },
  tabs      : { display:"flex", marginBottom:"20px", borderRadius:"8px",
                overflow:"hidden", border:"1px solid #2a3142" },
  tab       : { flex:1, padding:"10px", background:"transparent", border:"none",
                color:"#8892a4", cursor:"pointer", fontSize:"14px" },
  activeTab : { background:"#00d4aa", color:"#0a0f1e", fontWeight:"bold" },
  input     : { width:"100%", padding:"12px", marginBottom:"12px", borderRadius:"8px",
                border:"1px solid #2a3142", background:"#0d1117", color:"#fff",
                fontSize:"14px", boxSizing:"border-box" },
  error     : { color:"#ff6b6b", fontSize:"13px", marginBottom:"12px" },
  btn       : { width:"100%", padding:"12px", background:"#00d4aa", border:"none",
                borderRadius:"8px", color:"#0a0f1e", fontWeight:"bold",
                fontSize:"15px", cursor:"pointer" },
};