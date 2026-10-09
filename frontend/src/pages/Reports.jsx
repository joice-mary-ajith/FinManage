import { useEffect, useState } from "react";
import { analyticsApi } from "../api/services";
import { errMsg } from "../api/client";
import { monthStart, today } from "../utils/format";
import { TrendChart, CategoryPie } from "../components/Charts";
import { Alert, Spinner, StatCard } from "../components/ui";

export default function Reports() {
  const [range, setRange] = useState({ from: monthStart(), to: today() });
  const [months, setMonths] = useState(6);
  const [period, setPeriod] = useState(null); // { summary, breakdown } for the date range
  const [trend, setTrend] = useState(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (range.from && range.to && range.from > range.to) return setError("'From' date must be before 'To' date");
    setError("");
    Promise.all([analyticsApi.summary(range.from, range.to), analyticsApi.breakdown(range.from, range.to)]).then(([summary, breakdown]) => setPeriod({ summary, breakdown })).catch((e) => setError(errMsg(e)));
  }, [range]);

  useEffect(() => { analyticsApi.trend(months).then(setTrend).catch((e) => setError(errMsg(e))); }, [months]);

  const exportCsv = async () => { setExporting(true); try { await analyticsApi.exportCsv(); } catch (e) { setError(errMsg(e)); } finally { setExporting(false); } };
  const setDate = (k) => (e) => setRange({ ...range, [k]: e.target.value });

  return (
    <>
      <div className="page-head"><h1>Reports</h1><button className="btn btn-outline" onClick={exportCsv} disabled={exporting}>{exporting ? "Exporting..." : "⬇ Export CSV"}</button></div>
      <Alert>{error}</Alert>
      <div className="card filters">
        <label>From<input type="date" value={range.from} onChange={setDate("from")} /></label>
        <label>To<input type="date" value={range.to} onChange={setDate("to")} /></label>
        <button className="btn btn-outline" onClick={() => setRange({ from: monthStart(), to: today() })}>This month</button>
      </div>
      {!period ? <Spinner /> : (
        <>
          <div className="grid grid-3 section"><StatCard label="Income" value={period.summary.income} tone="income" /><StatCard label="Expense" value={period.summary.expense} tone="expense" /><StatCard label="Net savings" value={period.summary.netSavings} tone={period.summary.netSavings < 0 ? "expense" : "income"} /></div>
          <div className="card section"><h3>Expenses by category</h3><CategoryPie data={period.breakdown} /></div>
        </>
      )}
      <div className="card section">
        <div className="row-between"><h3>Income vs expense trend</h3><select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="compact-select">{[3, 6, 12, 24].map((m) => <option key={m} value={m}>Last {m} months</option>)}</select></div>
        {trend ? <TrendChart data={trend} /> : <Spinner />}
      </div>
    </>
  );
}
