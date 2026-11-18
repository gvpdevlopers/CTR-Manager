import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import BrandLogo from "../components/BrandLogo";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await login({ username: username.trim(), password: password.replace(/\s/g, "") });
    setLoading(false);
    if (result.ok) navigate(result.user.role === "admin" ? "/admin" : "/employee");
    else setError(result.error || "Login failed");
  };

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-intro" aria-labelledby="login-intro-title">
          <div className="login-brand"><BrandLogo variant="dark" /><strong>CTR Monitor</strong></div>
          <div className="login-intro-copy">
            <p className="login-kicker">YOUR WORKSPACE</p>
            <h1 id="login-intro-title">Your work,<br/><span>all in one place.</span></h1>
            <p>Keep track of your accounts, daily tasks and CTR activity in one organized workspace.</p>
          </div>
          <p className="login-intro-footer">Accounts &middot; Activity &middot; Progress</p>
        </section>
        <section className="login-form-panel" aria-labelledby="login-title">
          <div className="login-form-content">
            <p className="login-form-eyebrow">CTR MONITOR</p>
            <h2 id="login-title">Welcome back</h2>
            <p className="login-description">Sign in to access your workspace.</p>
            <form className="login-card" onSubmit={handleLogin}>
              {error && <div className="login-error" role="alert">{error}</div>}
              <label htmlFor="username">Username</label>
              <input id="username" autoComplete="username" placeholder="Enter your username" value={username} onChange={(event) => setUsername(event.target.value)} required />
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button>
              </div>
              <button className="login-submit" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={18}/> Signing in...</> : <>Sign in <ArrowRight size={18}/></>}</button>
            </form>
            <p className="login-note">Authorized access only</p>
          </div>
        </section>
      </div>
    </main>
  );
}
