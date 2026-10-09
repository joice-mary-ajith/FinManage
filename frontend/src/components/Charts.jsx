import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { formatMoney, monthLabel } from "../utils/format";
import { Empty } from "./ui";

const COLORS = ["#0f3d3a", "#e0a526", "#c9472f", "#4a9d8f", "#7a6bb0", "#d98a5f", "#5b7c99", "#a3b84a", "#b85c8a", "#8c9a96"];
const compact = (n) => new Intl.NumberFormat("en-IN", { notation: "compact" }).format(n);

// data = [{ month: "2026-10", income, expense }, ...] from GET /analytics/trend
export function TrendChart({ data }) {
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.month) }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tickLine={false} /><YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={48} />
        <Tooltip formatter={(v) => formatMoney(v)} /><Legend />
        <Bar dataKey="income" name="Income" fill="#2f9e75" radius={[4, 4, 0, 0]} /><Bar dataKey="expense" name="Expense" fill="#c9472f" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// data = [{ categoryId, name, total }, ...] from GET /analytics/category-breakdown
export function CategoryPie({ data }) {
  if (!data.length) return <Empty>No expenses in this period.</Empty>;
  const total = data.reduce((s, d) => s + d.total, 0);
  return (
    <div className="pie-wrap">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>{data.map((d, i) => <Cell key={d.categoryId} fill={COLORS[i % COLORS.length]} />)}</Pie>
          <Tooltip formatter={(v) => formatMoney(v)} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="legend">
        {data.map((d, i) => <li key={d.categoryId}><span className="dot" style={{ background: COLORS[i % COLORS.length] }} />{d.name}<strong>{formatMoney(d.total)}</strong><small className="muted">{Math.round((d.total / total) * 100)}%</small></li>)}
      </ul>
    </div>
  );
}
