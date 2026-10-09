import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/services";
import { errMsg } from "../api/client";
import { validEmail } from "../utils/format";
import AuthCard from "../components/AuthCard";
import { Alert } from "../components/ui";

// Step 1 of the reset flow: the backend emails a 6-digit OTP (valid 10 minutes). Step 2 is /reset-password.
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (!validEmail(email.trim())) return setError("Enter a valid email address");
    setBusy(true);
    try { await authApi.forgotPassword(email.trim()); navigate("/reset-password", { state: { email: email.trim() } }); }
    catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <AuthCard title="Forgot password" subtitle="We'll email you a 6-digit code to reset it." footer={<Link to="/login">Back to log in</Link>}>
      <form onSubmit={submit} className="form">
        <Alert>{error}</Alert>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>
        <button className="btn btn-primary" disabled={busy}>{busy ? "Sending..." : "Send code"}</button>
      </form>
    </AuthCard>
  );
}
