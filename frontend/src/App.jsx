import { useState } from "react";
import Login from "./Login";
import Chat from "./Chat";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  return user ? <Chat user={user} setUser={setUser} /> : <Login setUser={setUser} />;
}