import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { accountApi, analyticsApi, transactionApi } from "../api/services";
import { errMsg } from "../api/client";
import { formatMoney, formatDate, monthStart, today } from "../utils/format";
import { TrendChart, CategoryPie } from "../components/Charts";
import { Alert, Spinner, StatCard, Empty } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const from = monthStart(), to = today(); // the summary and breakdown cover the current month
    Promise.all([analyticsApi.summary(from, to), analyticsApi.breakdown(from, to), analyticsApi.trend(6), accountApi.list(), transactionApi.list()])
      .then(([summary, breakdown, trend, accounts, txns]) => setData({ summary, breakdown, trend, accounts, recent: txns.slice(0, 6) }))
      .catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <Spinner />;
  const { summary, breakdown, trend, accounts, recent } = data;
  const balance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <>
      <div className="page-head"><div><h1>Hi, {user.name.split(" ")[0]}</h1><p className="muted">Here's your month so far.</p></div><Link to="/transactions" className="btn btn-primary">+ Add transaction</Link></div>
      <div className="grid grid-4">
        <StatCard label="Total balance" value={balance} tone={balance < 0 ? "expense" : undefined} />
        <StatCard label="Income (this month)" value={summary.income} tone="income" />
        <StatCard label="Expense (this month)" value={summary.expense} tone="expense" />
        <StatCard label="Net savings" value={summary.netSavings} tone={summary.netSavings < 0 ? "expense" : "income"} />
      </div>
      <div className="grid grid-2 section">
        <div className="card"><h3>Income vs expense (6 months)</h3><TrendChart data={trend} /></div>
        <div className="card"><h3>Where your money went</h3><CategoryPie data={breakdown} /></div>
      </div>
      <div className="card section">
        <div className="row-between"><h3>Recent transactions</h3><Link to="/transactions" className="small-link">View all</Link></div>
        {recent.length === 0 ? <Empty>No transactions yet.</Empty> : (
          <table><tbody>
            {recent.map((t) => <tr key={t._id}><td>{formatDate(t.date)}</td><td>{t.categoryId?.name || "—"}</td><td className="muted">{t.accountId?.name}</td><td className={`num amount-${t.type}`}>{t.type === "expense" ? "−" : "+"}{formatMoney(t.amount)}</td></tr>)}
          </tbody></table>
        )}
      </div>
    </>
  );
}
