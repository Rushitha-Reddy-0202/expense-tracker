import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

export default function Analytics() {
  const navigate = useNavigate();

  const [month, setMonth] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  });

  const COLORS = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#22c55e", // green
    "#f59e0b", // yellow
    "#8b5cf6", // purple
    "#06b6d4", // cyan
    "#f97316", // orange
    ];

  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState([]);

  const pieData = categories.map((c) => ({
  name: c.category,
  value: c.total,
  }));

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  
    const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleString("default", {
        month: "short",
        year: "2-digit"
    });
    };

  const load = async (m) => {
    setMsg("");
    setLoading(true);
    try {
      // calculate last 6 months range
        const [y, mm] = m.split("-").map(Number);
        const endDate = new Date(y, mm - 1, 1);
        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 5);

        const from = `${startDate.getFullYear()}-${String(
        startDate.getMonth() + 1
        ).padStart(2, "0")}`;

        const to = m;

        const [s, c, t] = await Promise.all([
        api.get(`/api/analytics/summary?month=${m}`),
        api.get(`/api/analytics/by-category?month=${m}`),
        api.get(`/api/analytics/trend?from=${from}&to=${to}`)
        ]);

        setSummary(s.data);
        setCategories(c.data.categories || []);
        setTrend((t.data.data || []).map((row) => ({
        ...row,
        label: formatMonth(row.month)
        })));
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to load analytics");
      if (err?.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
    else load(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMonthChange = (e) => {
    const m = e.target.value;
    setMonth(m);
    load(m);
  };

  const totalsText = useMemo(() => {
    if (!summary) return "";
    return `Income ₹${summary.income} • Expense ₹${summary.expense} • Savings ₹${summary.savings}`;
  }, [summary]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Analytics</h1>
            <p className="text-sm text-gray-600">Monthly overview</p>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard" className="px-3 py-2 rounded-lg border bg-white">
              Dashboard
            </Link>
            <Link to="/transactions" className="px-3 py-2 rounded-lg border bg-white">
              Transactions
            </Link>
            <button onClick={logout} className="px-3 py-2 rounded-lg bg-black text-white">
              Logout
            </button>
          </div>
        </div>

        {msg ? (
          <div className="mt-4 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">
            {msg}
          </div>
        ) : null}

        <div className="mt-4 bg-white rounded-2xl shadow p-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h2 className="font-semibold">Select month</h2>
              <p className="text-sm text-gray-600">Choose a month to view totals</p>
            </div>

            <input
              className="rounded-lg border px-3 py-2"
              type="month"
              value={month}
              onChange={onMonthChange}
            />
          </div>

          <div className="mt-4">
            {loading ? (
              <p className="text-sm text-gray-600">Loading...</p>
            ) : summary ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border p-4">
                    <p className="text-sm text-gray-600">Income</p>
                    <p className="text-xl font-bold">₹{summary.income}</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="text-sm text-gray-600">Expense</p>
                    <p className="text-xl font-bold">₹{summary.expense}</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="text-sm text-gray-600">Savings</p>
                    <p className="text-xl font-bold">₹{summary.savings}</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-gray-600">{totalsText}</p>

                <div className="mt-5">
                <h3 className="font-semibold mb-2">Expenses by category</h3>

                {categories.length === 0 ? (
                    <p className="text-sm text-gray-600">No expense categories for this month.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-72 rounded-xl border p-3">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={90}
                            label
                            >
                            {pieData.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                            ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-2">
                        {categories.map((c) => (
                        <div
                            key={c.category}
                            className="flex items-center justify-between border rounded-lg px-3 py-2"
                        >
                            <p className="font-medium">{c.category}</p>
                            <p className="font-semibold">₹{c.total}</p>
                        </div>
                        ))}
                    </div>
                    </div>
                )}
                </div>
              </>
            ) : null}
          </div>
          <div className="mt-5">
            <h3 className="font-semibold mb-2">Monthly trend</h3>
            {trend.length === 0 ? (
                <p className="text-sm text-gray-600">No trend data.</p>
            ) : (
                <div className="h-72 rounded-xl border p-3">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend} margin={{ top: 10, right: 50, left: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" interval={0} angle={-30} textAnchor="end" height={50} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="income" />
                    <Line type="monotone" dataKey="expense" />
                    </LineChart>
                </ResponsiveContainer>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}