import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/services";
import { errMsg } from "../api/client";
import { validPassword, PASSWORD_HINT } from "../utils/format";
import AuthCard from "../components/AuthCard";
import { Alert } from "../components/ui";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ email: state?.email || "", otp: "", newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (!validPassword(form.newPassword)) return setError(PASSWORD_HINT);
    if (form.newPassword !== form.confirm) return setError("Passwords do not match");
    setBusy(true);
    try { await authApi.resetPassword({ email: form.email.trim(), otp: form.otp.trim(), newPassword: form.newPassword }); setDone(true); setTimeout(() => navigate("/login", { replace: true }), 1500); }
    catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <AuthCard title="Reset password" subtitle="Enter the 6-digit code from your email and choose a new password." footer={<><Link to="/forgot-password">Send a new code</Link> · <Link to="/login">Log in</Link></>}>
      {done ? <Alert kind="success">Password updated. Redirecting to log in...</Alert> : (
        <form onSubmit={submit} className="form">
          <Alert>{error}</Alert>
          <label>Email<input type="email" value={form.email} onChange={set("email")} required /></label>
          <label>6-digit code<input value={form.otp} onChange={set("otp")} inputMode="numeric" maxLength={6} pattern="\d{6}" required autoFocus autoComplete="one-time-code" /></label>
          <label>New password<input type="password" value={form.newPassword} onChange={set("newPassword")} required autoComplete="new-password" /><small className="muted">{PASSWORD_HINT}</small></label>
          <label>Confirm new password<input type="password" value={form.confirm} onChange={set("confirm")} required autoComplete="new-password" /></label>
          <button className="btn btn-primary" disabled={busy}>{busy ? "Updating..." : "Reset password"}</button>
        </form>
      )}
    </AuthCard>
  );
}
