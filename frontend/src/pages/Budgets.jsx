import { useEffect, useState, useCallback } from "react";
import { budgetApi, categoryApi } from "../api/services";
import { errMsg } from "../api/client";
import { formatMoney, overBudgetText } from "../utils/format";
import Modal from "../components/Modal";
import { Alert, Spinner, Empty } from "../components/ui";

// Bar fills to the percentage spent (capped at 100%) and turns red once spending passes the limit.
const ProgressBar = ({ spent, limit, label }) => {
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(pct))}>
      <div className={`progress-fill${spent > limit ? " over" : ""}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
};

export default function Budgets() {
  const [budgets, setBudgets] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = new budget, budget = edit
  const [form, setForm] = useState({ categoryId: "", amount: "" });
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => budgetApi.list().then(setBudgets).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { load(); categoryApi.list().then(setCategories).catch((e) => setError(errMsg(e))); }, [load]);

  // only expense categories that don't have a budget yet can be picked for a new one
  const taken = new Set((budgets || []).map((b) => String(b.categoryId)));
  const available = categories.filter((c) => c.type === "expense" && !taken.has(String(c._id)));

  const openForm = (b) => {
    setEditing(b || {}); setFormError("");
    setForm(b ? { categoryId: b.categoryId, amount: String(b.amount) } : { categoryId: available[0]?._id || "", amount: "" });
  };

  const save = async (e) => {
    e.preventDefault(); setFormError("");
    if (!form.categoryId) return setFormError("Choose a category");
    if (!(Number(form.amount) > 0)) return setFormError("Budget must be greater than 0");
    setBusy(true);
    try { await budgetApi.save({ categoryId: form.categoryId, amount: Number(form.amount) }); setEditing(null); await load(); }
    catch (err) { setFormError(errMsg(err)); } finally { setBusy(false); }
  };

  const remove = async (b) => {
    if (!window.confirm(`Remove the ${b.categoryName} budget?`)) return;
    try { await budgetApi.remove(b._id); await load(); } catch (err) { setError(errMsg(err)); }
  };

  const month = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const overCount = (budgets || []).filter((b) => b.spent > b.amount).length;

  return (
    <>
      <div className="page-head">
        <div><h1>Budgets</h1><p className="muted">Monthly limits per category for {month}. Spending starts again from zero each month; your limits stay.</p></div>
        <button className="btn btn-primary" disabled={!budgets || available.length === 0} onClick={() => openForm()}>+ Set budget</button>
      </div>
      <Alert>{error}</Alert>
      {overCount > 0 && <Alert>You are over budget in {overCount} categor{overCount === 1 ? "y" : "ies"} this month.</Alert>}

      {!budgets ? <Spinner /> : budgets.length === 0 ? <Empty>No budgets yet. Set a monthly limit for a category such as Groceries.</Empty> : (
        <div className="grid grid-3 section">
          {budgets.map((b) => {
            const over = b.spent > b.amount;
            return (
              <div className={`card budget${over ? " budget-over" : ""}`} key={b._id}>
                <div className="row-between"><strong>{b.categoryName}</strong>{over && <span className="badge badge-bad">Over budget</span>}</div>
                <div><span className="big-num">{formatMoney(b.spent)}</span> <span className="muted">of {formatMoney(b.amount)}</span></div>
                <ProgressBar spent={b.spent} limit={b.amount} label={`${b.categoryName} budget used`} />
                {over
                  ? <small className="amount-expense"><strong>{overBudgetText(b)}</strong> (over by {formatMoney(b.spent - b.amount)})</small>
                  : <small className="muted">{formatMoney(b.amount - b.spent)} left this month</small>}
                <div className="actions"><button className="btn btn-outline" onClick={() => openForm(b)}>Edit</button><button className="btn btn-danger" onClick={() => remove(b)}>Remove</button></div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <Modal title={editing._id ? `Edit ${editing.categoryName} budget` : "Set a budget"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="form">
            <Alert>{formError}</Alert>
            {!editing._id && (
              <label>Category<select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>{available.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
            )}
            <label>Monthly limit<input type="number" min="1" step="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required autoFocus placeholder="e.g. 5000" /></label>
            <div className="actions"><button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Save budget"}</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}