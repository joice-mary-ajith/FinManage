import { useState } from "react";
import { categoryApi, transactionApi } from "../api/services";
import { errMsg } from "../api/client";
import { toDateInput, today } from "../utils/format";
import { Alert } from "./ui";

// Used for both "add" (txn = null) and "edit" (txn = an existing transaction from GET /transactions).
export default function TransactionForm({ txn, accounts, categories, onCategoryAdded, onSaved, onCancel }) {
  const [form, setForm] = useState({
    type: txn?.type || "expense", amount: txn ? String(txn.amount) : "", date: txn ? toDateInput(txn.date) : today(),
    accountId: txn?.accountId?._id || accounts[0]?._id || "", categoryId: txn?.categoryId?._id || "", notes: txn?.notes || "",
  });
  const [newCat, setNewCat] = useState(null); // null = hidden, string = name being typed
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const options = categories.filter((c) => c.type === form.type); // the backend rejects a category whose type differs from the transaction type
  const changeType = (type) => setForm({ ...form, type, categoryId: "" });

  const addCategory = async () => {
    if (!newCat?.trim()) return;
    try { const cat = await categoryApi.create({ name: newCat.trim(), type: form.type }); await onCategoryAdded(); setForm({ ...form, categoryId: cat._id }); setNewCat(null); setError(""); }
    catch (err) { setError(err.response?.status === 500 ? "Could not add category (it may already exist)" : errMsg(err)); }
  };

  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (!(Number(form.amount) > 0)) return setError("Amount must be greater than 0");
    if (!form.categoryId) return setError("Choose a category");
    setBusy(true);
    const body = { ...form, amount: Number(form.amount), notes: form.notes.trim() };
     try { const saved = txn ? await transactionApi.update(txn._id, body) : await transactionApi.create(body); await onSaved(saved); } catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="form">
      <Alert>{error}</Alert>
      <div className="segmented">
        {["expense", "income"].map((t) => <button type="button" key={t} className={form.type === t ? `active ${t}` : ""} onClick={() => changeType(t)}>{t === "expense" ? "Expense" : "Income"}</button>)}
      </div>
      <div className="grid grid-2">
        <label>Amount<input type="number" min="0.01" step="0.01" value={form.amount} onChange={set("amount")} required autoFocus /></label>
        <label>Date<input type="date" value={form.date} onChange={set("date")} required /></label>
      </div>
      <label>Account<select value={form.accountId} onChange={set("accountId")} required>{accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}</select></label>
      <label>Category
        <select value={form.categoryId} onChange={set("categoryId")} required><option value="">Select...</option>{options.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
      </label>
      {newCat === null ? <button type="button" className="small-link link-btn" onClick={() => setNewCat("")}>+ Add a custom {form.type} category</button> : (
        <div className="inline-add"><input placeholder="Category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} /><button type="button" className="btn btn-outline" onClick={addCategory}>Add</button><button type="button" className="btn btn-ghost" onClick={() => setNewCat(null)}>✕</button></div>
      )}
      <label>Notes (optional)<input value={form.notes} onChange={set("notes")} maxLength={200} /></label>
      <div className="actions"><button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : txn ? "Save changes" : "Add transaction"}</button></div>
    </form>
  );
}
