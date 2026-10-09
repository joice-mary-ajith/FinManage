import { useEffect, useState, useCallback } from "react";
import { adminApi } from "../../api/services";
import { errMsg } from "../../api/client";
import Modal from "../../components/Modal";
import { Alert, Spinner, Empty } from "../../components/ui";

export default function AdminCategories() {
  const [cats, setCats] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = new, category = edit
  const [form, setForm] = useState({ name: "", type: "expense" });
  const [formError, setFormError] = useState("");

  const load = useCallback(() => adminApi.categories().then(setCats).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);

  const openForm = (c) => { setEditing(c || {}); setFormError(""); setForm(c ? { name: c.name, type: c.type } : { name: "", type: "expense" }); };

  const save = async (e) => {
    e.preventDefault(); setFormError("");
    try { editing._id ? await adminApi.updateCategory(editing._id, form) : await adminApi.addCategory(form); setEditing(null); await load(); } catch (err) { setFormError(errMsg(err)); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete default category "${c.name}"?`)) return;
    setError("");
    try { await adminApi.removeCategory(c._id); await load(); } catch (err) { setError(errMsg(err)); }
  };

  const group = (type) => (cats || []).filter((c) => c.type === type);

  return (
    <>
      <div className="page-head"><div><h1>Default categories</h1><p className="muted">Shown to every user. A category already used by transactions can't be deleted.</p></div><button className="btn btn-primary" onClick={() => openForm()}>+ New category</button></div>
      <Alert>{error}</Alert>
      {!cats ? <Spinner /> : (
        <div className="grid grid-2">
          {["expense", "income"].map((type) => (
            <div className="card" key={type}>
              <h3 className="cap">{type} categories</h3>
              {group(type).length === 0 ? <Empty>None yet.</Empty> : (
                <table><tbody>{group(type).map((c) => <tr key={c._id}><td>{c.name}</td><td className="row-actions"><button className="btn btn-ghost" onClick={() => openForm(c)}>Rename</button><button className="btn btn-ghost danger-text" onClick={() => remove(c)}>Delete</button></td></tr>)}</tbody></table>
              )}
            </div>
          ))}
        </div>
      )}
      {editing && (
        <Modal title={editing._id ? "Edit category" : "New default category"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="form">
            <Alert>{formError}</Alert>
            <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus /></label>
            <label>Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select></label>
            <div className="actions"><button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary">Save</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
