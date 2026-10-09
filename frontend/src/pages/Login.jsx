import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../api/client";
import AuthCard from "../components/AuthCard";
import { Alert } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // On success the user state changes and <PublicRoute> redirects to the right home page.
  const submit = async (e) => {
    e.preventDefault(); setError(""); setBusy(true);
    try { await login(form.email.trim(), form.password); } catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Log in to see your accounts and spending." footer={<>New here? <Link to="/register">Create an account</Link></>}>
      <form onSubmit={submit} className="form">
        <Alert>{error}</Alert>
        <label>Email<input type="email" value={form.email} onChange={set("email")} required autoFocus autoComplete="email" /></label>
        <label>Password<input type="password" value={form.password} onChange={set("password")} required autoComplete="current-password" /></label>
        <Link to="/forgot-password" className="small-link">Forgot password?</Link>
        <button className="btn btn-primary" disabled={busy}>{busy ? "Logging in..." : "Log in"}</button>
      </form>
    </AuthCard>
  );
}
