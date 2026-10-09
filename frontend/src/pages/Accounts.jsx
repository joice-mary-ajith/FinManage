import { useEffect, useState, useCallback } from "react";
import { accountApi } from "../api/services";
import { errMsg } from "../api/client";
import { formatMoney, ACCOUNT_TYPES } from "../utils/format";
import Modal from "../components/Modal";
import { Alert, Spinner, Empty, StatCard } from "../components/ui";

const blank = { name: "", type: "bank", openingBalance: "0" };

export default function Accounts() {
  const [accounts, setAccounts] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {_id,...} = existing
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => accountApi.list().then(setAccounts).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);

  const openForm = (acc) => { setEditing(acc || {}); setFormError(""); setForm(acc ? { name: acc.name, type: acc.type, openingBalance: String(acc.openingBalance) } : blank); };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setFormError(""); setBusy(true);
    try {
      if (editing._id) await accountApi.update(editing._id, { name: form.name.trim(), type: form.type });
      else await accountApi.create({ name: form.name.trim(), type: form.type, openingBalance: Number(form.openingBalance) || 0 });
      setEditing(null); await load();
    } catch (err) { setFormError(errMsg(err)); } finally { setBusy(false); }
  };

  const remove = async (acc) => {
    if (!window.confirm(`Delete account "${acc.name}"?`)) return;
    setError("");
    try { await accountApi.remove(acc._id); await load(); } catch (err) { setError(errMsg(err)); }
  };

  const total = (accounts || []).reduce((sum, a) => sum + a.balance, 0);

  return (
    <>
      <div className="page-head"><h1>Accounts</h1><button className="btn btn-primary" onClick={() => openForm()}>+ New account</button></div>
      <Alert>{error}</Alert>
      {!accounts ? <Spinner /> : (
        <>
          <div className="grid grid-3"><StatCard label="Total balance" value={total} tone={total < 0 ? "expense" : undefined} /><StatCard label="Accounts" value={accounts.length} raw /></div>
          {accounts.length === 0 ? <Empty>No accounts yet. Add your cash, bank or card accounts to get started.</Empty> : (
            <div className="grid grid-3 section">
              {accounts.map((a) => (
                <div className="card account" key={a._id}>
                  <div className="row-between"><strong>{a.name}</strong><span className="badge">{ACCOUNT_TYPES[a.type]}</span></div>
                  <div className={`balance ${a.balance < 0 ? "amount-expense" : ""}`}>{formatMoney(a.balance)}</div>
                  <small className="muted">Opening balance {formatMoney(a.openingBalance)}</small>
                  <div className="actions"><button className="btn btn-outline" onClick={() => openForm(a)}>Edit</button><button className="btn btn-danger" onClick={() => remove(a)}>Delete</button></div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {editing && (
        <Modal title={editing._id ? "Edit account" : "New account"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="form">
            <Alert>{formError}</Alert>
            <label>Name<input value={form.name} onChange={set("name")} placeholder="e.g. HDFC Savings" required autoFocus /></label>
            <label>Type<select value={form.type} onChange={set("type")}>{Object.entries(ACCOUNT_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label>Opening balance<input type="number" step="0.01" value={form.openingBalance} onChange={set("openingBalance")} disabled={Boolean(editing._id)} />{editing._id && <small className="muted">The opening balance can't be changed after creation.</small>}</label>
            <div className="actions"><button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Save"}</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
