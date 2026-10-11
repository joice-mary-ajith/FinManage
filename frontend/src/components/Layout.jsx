import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SiteFooter from "./SiteFooter";

const userLinks = [["/dashboard", "Dashboard"], ["/accounts", "Accounts"], ["/transactions", "Transactions"], ["/budgets", "Budgets"], ["/reports", "Reports"]];
const adminLinks = [["/admin", "Users"], ["/admin/categories", "Categories"]];

// Website-style layout: sticky top navigation, centered content, footer.
export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = isAdmin ? [...userLinks, ...adminLinks] : userLinks;

  return (
    <div className="shell">
      <header className="topbar"><div className="wrap row-between">
        <NavLink to="/dashboard" className="brand"><img src="/logo-mark.svg" alt="" className="brand-logo" />Fin<span>Manage</span></NavLink>
        <button className="btn btn-outline menu-btn" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
        <nav className={`top-links${open ? " open" : ""}`} onClick={() => setOpen(false)}>{links.map(([to, label]) => <NavLink key={to} to={to} end>{label}</NavLink>)}</nav>
        <div className="user-box"><span className="avatar">{user?.name?.[0]?.toUpperCase()}</span><span className="who-name">{user?.name}</span><button className="btn btn-outline" onClick={() => { logout(); navigate("/"); }}>Log out</button></div>
      </div></header>
      <main className="content"><Outlet /></main>
      <SiteFooter />
    </div>
  );
}
