import { useEffect, useState, useCallback } from "react";
import { adminApi } from "../../api/services";
import { errMsg } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Alert, Spinner, StatCard } from "../../components/ui";

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => Promise.all([adminApi.stats(), adminApi.users()]).then(([s, u]) => { setStats(s); setUsers(u); }).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (u) => {
    if (u.isActive && !window.confirm(`Deactivate ${u.name}? They won't be able to log in.`)) return;
    setError("");
    try { await adminApi.setUserActive(u._id, !u.isActive); await load(); } catch (err) { setError(errMsg(err)); }
  };

  return (
    <>
      <div className="page-head"><h1>Users & stats</h1></div>
      <Alert>{error}</Alert>
      {!stats || !users ? <Spinner /> : (
        <>
          <div className="grid grid-4">
            <StatCard label="Total users" value={stats.users.total} raw /><StatCard label="Active users" value={stats.users.active} raw tone="income" />
            <StatCard label="Deactivated" value={stats.users.deactivated} raw tone={stats.users.deactivated ? "expense" : undefined} /><StatCard label="Accounts / Transactions" value={`${stats.accounts} / ${stats.transactions}`} raw />
          </div>
          <div className="card table-wrap section">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td><td>{u.email}</td><td><span className="badge">{u.role}</span></td>
                    <td><span className={`badge ${u.isActive ? "badge-ok" : "badge-bad"}`}>{u.isActive ? "Active" : "Deactivated"}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="row-actions">{u._id !== me.id && <button className={`btn btn-ghost ${u.isActive ? "danger-text" : ""}`} onClick={() => toggle(u)}>{u.isActive ? "Deactivate" : "Activate"}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
