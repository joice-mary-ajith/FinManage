import { formatMoney } from "../utils/format";

export const Alert = ({ kind = "error", children }) => (children ? <div className={`alert alert-${kind}`} role="alert">{children}</div> : null);
export const Spinner = ({ label = "Loading..." }) => <div className="center-note">{label}</div>;
export const Empty = ({ children }) => <div className="center-note muted">{children}</div>;

export const StatCard = ({ label, value, tone, raw }) => (
  <div className="card stat">
    <span className="muted">{label}</span>
    <strong className={tone ? `amount-${tone}` : ""}>{raw ? value : formatMoney(value)}</strong>
  </div>
);
