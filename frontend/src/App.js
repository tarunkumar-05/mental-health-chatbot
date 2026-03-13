import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { supabase } from "./supabase";
import Auth from "./Auth";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm here to support you. How are you feeling today? 💙" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [moodData, setMoodData] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
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
    inputRef.current?.blur();
    try {
      const res = await axios.post("https://mental-health-chatbot-q8i3.onrender.com/chat", { text: input });
      const botMessage = {
        sender: "bot",
        text: res.data.response,
        sentiment: res.data.sentiment,
        confidence: res.data.confidence,
      };
      setMessages((prev) => [...prev, botMessage]);
      setMoodData((prev) => [...prev, {
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        score: res.data.sentiment === "POSITIVE" ? 100 : res.data.sentiment === "NEGATIVE" ? 0 : 50,
        sentiment: res.data.sentiment,
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, I'm having trouble connecting. Please try again!" }]);
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => { if (e.key === "Enter") sendMessage(); };
  const handleLogout = async () => { await supabase.auth.signOut(); };

  if (!session) return <Auth />;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-icon">🧠</div>
        <div style={{ flex: 1 }}>
          <h1>MindEase</h1>
          <p>Your mental health companion</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setShowChart(!showChart)} className="chart-btn">
            {showChart ? "💬 Chat" : "📊 Mood"}
          </button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {showChart ? (
        <div className="chart-container">
          <h2 className="chart-title">Your Mood Today</h2>
          {moodData.length === 0 ? (
            <div className="chart-empty">
              <p>😊 Send some messages to see your mood trend!</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={moodData}>
                  <XAxis dataKey="time" stroke="#666" tick={{ fill: "#888", fontSize: 12 }} />
                  <YAxis domain={[0, 100]} stroke="#666" tick={{ fill: "#888", fontSize: 12 }}
                    tickFormatter={(v) => v === 100 ? "😊" : v === 50 ? "😐" : "😔"} />
                  <Tooltip
                    contentStyle={{ background: "#2f2f2f", border: "1px solid #444", borderRadius: "8px", color: "#fff" }}
                    formatter={(value, name) => [value === 100 ? "Positive 😊" : value === 0 ? "Negative 😔" : "Neutral 😐", "Mood"]}
                  />
                  <Line type="monotone" dataKey="score" stroke="#ffffff" strokeWidth={2} dot={{ fill: "#ffffff", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mood-summary">
                {moodData.filter(d => d.sentiment === "POSITIVE").length} Positive &nbsp;·&nbsp;
                {moodData.filter(d => d.sentiment === "NEUTRAL").length} Neutral &nbsp;·&nbsp;
                {moodData.filter(d => d.sentiment === "NEGATIVE").length} Negative
              </div>
            </>
          )}
        </div>
      ) : (
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
            {loading && <div className="message bot"><div className="bubble typing">typing...</div></div>}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      <div className="input-area">
        <input
          ref={inputRef}
          type="text"
          placeholder="Share how you're feeling..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={sendMessage} disabled={loading}>Send 💙</button>
      </div>
    </div>
  );
}

export default App;