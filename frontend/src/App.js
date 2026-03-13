import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { supabase } from "./supabase";
import Auth from "./Auth";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! I'm here to support you. How are you feeling today? 💙",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await axios.post("https://mental-health-chatbot-q8i3.onrender.com/chat", {
        text: input,
      });
      const botMessage = {
        sender: "bot",
        text: res.data.response,
        sentiment: res.data.sentiment,
        confidence: res.data.confidence,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, I'm having trouble connecting. Please try again!" },
      ]);
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-icon">🧠</div>
        <div style={{flex: 1}}>
          <h1>MindEase</h1>
          <p>Your mental health companion</p>
        </div>
        <div>
          <p style={{fontSize: "12px", color: "#888"}}>{session.user.email}</p>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
      <div className="messages-wrapper">
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender}`}>
              <div className="bubble">{msg.text}</div>
              {msg.sentiment && (
                <div className="sentiment">
                  {msg.sentiment === "NEGATIVE" ? "😔" : "😊"} {msg.sentiment} ({msg.confidence}%)
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="message bot">
              <div className="bubble typing">typing...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="input-area">
        <input
          type="text"
          placeholder="Share how you're feeling..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={sendMessage} disabled={loading}>
          Send 💙
        </button>
      </div>
    </div>
  );
}

export default App;