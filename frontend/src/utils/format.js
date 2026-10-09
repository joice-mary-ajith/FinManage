// Change CURRENCY / LOCALE here to switch the whole app (e.g. "USD" / "en-US").
const CURRENCY = "INR", LOCALE = "en-IN";
const money = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY });

export const formatMoney = (n) => money.format(Number(n) || 0);
export const toDateInput = (d) => (d ? String(d).slice(0, 10) : "");
export const today = () => new Date().toLocaleDateString("en-CA");
export const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString("en-CA"); };
export const formatDate = (d) => new Date(d).toLocaleDateString(LOCALE, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
export const monthLabel = (key) => { const [y, m] = key.split("-"); return new Date(y, m - 1, 1).toLocaleDateString(LOCALE, { month: "short", year: "2-digit" }); };
export const ACCOUNT_TYPES = { cash: "Cash", bank: "Bank", credit_card: "Credit card", savings: "Savings" };
export const validEmail = (e) => /^\S+@\S+\.\S+$/.test(e);
export const validPassword = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
export const PASSWORD_HINT = "At least 8 characters, with a letter and a number";
