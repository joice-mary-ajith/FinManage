import PublicNav from "./PublicNav";
import SiteFooter from "./SiteFooter";

// Login, Register, Forgot and Reset password pages: website navbar on top, centered form card, footer below.
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <>
      <PublicNav />
      <div className="auth-page">
        <div className="card auth-card"><h2>{title}</h2>{subtitle && <p className="muted">{subtitle}</p>}{children}{footer && <div className="auth-foot">{footer}</div>}</div>
      </div>
      <SiteFooter />
    </>
  );
}
