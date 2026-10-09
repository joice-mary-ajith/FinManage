import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PublicNav from "../components/PublicNav";
import SiteFooter from "../components/SiteFooter";
import { Spinner } from "../components/ui";

const features = [
  ["Multiple accounts", "Keep cash, bank, savings and credit cards in one place, each with its own live balance."],
  ["Smart categories", "Start with ready-made categories and add your own for the way you actually spend."],
  ["Powerful filters", "Find any transaction by date range, account, category or type in a click."],
  ["Visual reports", "See income vs expense trends and where your money goes with clear charts."],
  ["CSV export", "Download your transactions any time for spreadsheets or record keeping."],
  ["Private & secure", "Passwords are hashed and every request is verified, so your data stays yours."],
];
const steps = [["Create your account", "Sign up in under a minute with your name and email."], ["Add accounts & transactions", "Record income and expenses as they happen."], ["Understand your money", "Open the dashboard to see balances, trends and savings."]];

export default function Landing() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;

  return (
    <>
      <PublicNav />
      <section className="hero"><div className="wrap hero-grid">
        <div>
          <span className="eyebrow">Personal finance management</span>
          <h1 className="hero-title">Know where every rupee goes.</h1>
          <p className="hero-sub">FinManage helps you track accounts, log transactions and understand your spending with simple, clear reports.</p>
          <div className="hero-cta"><Link to="/register" className="btn btn-primary btn-lg">Start for free</Link><Link to="/login" className="btn btn-outline btn-lg">Log in</Link></div>
        </div>
        <div className="card hero-card" aria-hidden="true">
          <small className="muted">Sample preview</small><div className="hero-balance">₹1,24,500</div><small className="muted">Total balance</small>
          <div className="hero-bars">{[40, 65, 50, 80, 55, 90].map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}</div>
          <div className="hero-row"><span>Groceries</span><strong className="amount-expense">−₹3,200</strong></div><div className="hero-row"><span>Salary</span><strong className="amount-income">+₹60,000</strong></div>
        </div>
      </div></section>

      <section id="features" className="band"><div className="wrap">
        <h2 className="band-title">Everything you need to stay on top of your money</h2>
        <div className="grid grid-3 features">{features.map(([t, d], i) => <div className="card feature" key={t}><span className="feature-no">0{i + 1}</span><h3>{t}</h3><p className="muted">{d}</p></div>)}</div>
      </div></section>

      <section id="how" className="band band-alt"><div className="wrap">
        <h2 className="band-title">How it works</h2>
        <div className="grid grid-3">{steps.map(([t, d], i) => <div className="step" key={t}><span className="step-no">{i + 1}</span><h3>{t}</h3><p className="muted">{d}</p></div>)}</div>
      </div></section>

      <section className="cta-band"><div className="wrap"><h2>Ready to take control of your finances?</h2><Link to="/register" className="btn btn-gold btn-lg">Create your free account</Link></div></section>
      <SiteFooter />
    </>
  );
}
