import { useState } from "react";
import { supabase } from "./supabase";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAuth = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) setMessage(error.message);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) setMessage(error.message);
        else setMessage("Check your email for confirmation!");
      }
    } catch (err) {
      setMessage("Something went wrong!");
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleAuth();
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-icon">🧠</div>
        <h1>MindEase</h1>
        <p className="auth-subtitle">Your mental health companion</p>
        <div className="auth-divider" />
        <h2>{isLogin ? "Welcome back" : "Create account"}</h2>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        {message && <p className="auth-message">{message}</p>}
        <button onClick={handleAuth} disabled={loading}>
          {loading ? "Please wait..." : isLogin ? "Continue" : "Create account"}
        </button>
        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? " Sign up" : " Log in"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Auth;