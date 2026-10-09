import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/services";
import { errMsg } from "../api/client";
import { validEmail, validPassword, PASSWORD_HINT } from "../utils/format";
import AuthCard from "../components/AuthCard";
import { Alert } from "../components/ui";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (!validEmail(form.email.trim())) return setError("Enter a valid email address");
    if (!validPassword(form.password)) return setError(PASSWORD_HINT);
    if (form.password !== form.confirm) return setError("Passwords do not match");
    setBusy(true);
    try { await authApi.register({ name: form.name.trim(), email: form.email.trim(), password: form.password }); navigate("/login", { replace: true }); }
    catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <AuthCard title="Create your account" subtitle="Track cash, bank and card spending in one place." footer={<>Already registered? <Link to="/login">Log in</Link></>}>
      <form onSubmit={submit} className="form">
        <Alert>{error}</Alert>
        <label>Name<input value={form.name} onChange={set("name")} required autoFocus autoComplete="name" /></label>
        <label>Email<input type="email" value={form.email} onChange={set("email")} required autoComplete="email" /></label>
        <label>Password<input type="password" value={form.password} onChange={set("password")} required autoComplete="new-password" /><small className="muted">{PASSWORD_HINT}</small></label>
        <label>Confirm password<input type="password" value={form.confirm} onChange={set("confirm")} required autoComplete="new-password" /></label>
        <button className="btn btn-primary" disabled={busy}>{busy ? "Creating..." : "Create account"}</button>
      </form>
    </AuthCard>
  );
}
