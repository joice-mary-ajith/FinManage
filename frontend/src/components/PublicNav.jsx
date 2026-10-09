import { Link } from "react-router-dom";

export default function PublicNav() {
  return (
    <header className="site-nav"><div className="wrap row-between">
      <Link to="/" className="brand">Fin<span>Manage</span></Link>
      <nav className="site-links"><a href="/#features">Features</a><a href="/#how">How it works</a></nav>
      <div className="nav-cta"><Link to="/login" className="btn btn-outline">Log in</Link><Link to="/register" className="btn btn-primary">Get started</Link></div>
    </div></header>
  );
}
