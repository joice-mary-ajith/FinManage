import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { accountApi, categoryApi, transactionApi } from "../api/services";
import { errMsg } from "../api/client";
import { formatMoney, formatDate, overBudgetText } from "../utils/format";
import Modal from "../components/Modal";
import TransactionForm from "../components/TransactionForm";
import { Alert, Spinner, Empty } from "../components/ui";

const noFilters = { from: "", to: "", type: "", accountId: "", categoryId: "" };

export default function Transactions() {
  const [txns, setTxns] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(noFilters);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = new, txn = edit
  const [budgetAlert, setBudgetAlert] = useState(null); // set when a saved expense pushes a category over its monthly budget

  const loadTxns = useCallback(() => transactionApi.list(filters).then(setTxns).catch((e) => setError(errMsg(e))), [filters]);
  const loadCategories = useCallback(() => categoryApi.list().then(setCategories), []);
  useEffect(() => { Promise.all([accountApi.list(), categoryApi.list()]).then(([a, c]) => { setAccounts(a); setCategories(c); }).catch((e) => setError(errMsg(e))); }, []);
  useEffect(() => { loadTxns(); }, [loadTxns]);

  const setFilter = (k) => (e) => setFilters({ ...filters, [k]: e.target.value, ...(k === "type" ? { categoryId: "" } : {}) });
  const filterCats = categories.filter((c) => !filters.type || c.type === filters.type);

  const remove = async (t) => {
    if (!window.confirm("Delete this transaction?")) return;
    try { await transactionApi.remove(t._id); await loadTxns(); } catch (err) { setError(errMsg(err)); }
  };

  const income = (txns || []).filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = (txns || []).filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <div className="page-head"><h1>Transactions</h1><button className="btn btn-primary" disabled={accounts.length === 0} onClick={() => setEditing({})}>+ Add transaction</button></div>
      <Alert>{error}</Alert>
      {budgetAlert && (
        <div className="alert alert-error budget-warning" role="alert">
          <strong>{overBudgetText(budgetAlert)}</strong>
          <span><Link to="/budgets" className="small-link">View budgets</Link><button className="btn btn-ghost" onClick={() => setBudgetAlert(null)} aria-label="Dismiss">✕</button></span>
        </div>
      )}
      {accounts.length === 0 && !error && <Alert kind="info">You need an account before adding transactions. <Link to="/accounts">Create one</Link></Alert>}

      <div className="card filters">
        <label>From<input type="date" value={filters.from} onChange={setFilter("from")} /></label>
        <label>To<input type="date" value={filters.to} onChange={setFilter("to")} /></label>
        <label>Type<select value={filters.type} onChange={setFilter("type")}><option value="">All</option><option value="income">Income</option><option value="expense">Expense</option></select></label>
        <label>Account<select value={filters.accountId} onChange={setFilter("accountId")}><option value="">All</option>{accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}</select></label>
        <label>Category<select value={filters.categoryId} onChange={setFilter("categoryId")}><option value="">All</option>{filterCats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
        <button className="btn btn-outline" onClick={() => setFilters(noFilters)}>Clear</button>
      </div>

      {!txns ? <Spinner /> : txns.length === 0 ? <Empty>No transactions match these filters.</Empty> : (
        <div className="card table-wrap section">
          <table>
            <thead><tr><th>Date</th><th>Category</th><th>Account</th><th>Notes</th><th className="num">Amount</th><th></th></tr></thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t._id}>
                  <td>{formatDate(t.date)}</td><td>{t.categoryId?.name || "—"}</td><td>{t.accountId?.name || "—"}</td><td className="muted">{t.notes}</td>
                  <td className={`num amount-${t.type}`}>{t.type === "expense" ? "−" : "+"}{formatMoney(t.amount)}</td>
                  <td className="row-actions"><button className="btn btn-ghost" onClick={() => setEditing(t)}>Edit</button><button className="btn btn-ghost danger-text" onClick={() => remove(t)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={4}>{txns.length} transaction{txns.length === 1 ? "" : "s"}</td><td className="num" colSpan={2}><span className="amount-income">+{formatMoney(income)}</span> · <span className="amount-expense">−{formatMoney(expense)}</span></td></tr></tfoot>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing._id ? "Edit transaction" : "Add transaction"} onClose={() => setEditing(null)}>
          <TransactionForm txn={editing._id ? editing : null} accounts={accounts} categories={categories} onCategoryAdded={loadCategories} onCancel={() => setEditing(null)} onSaved={async (saved) => { setBudgetAlert(saved?.budgetAlert || null); setEditing(null); await loadTxns(); }} />
        </Modal>
      )}
    </>
  );
}
