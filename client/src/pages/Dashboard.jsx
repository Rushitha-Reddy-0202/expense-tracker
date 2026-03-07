import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const currentMonth = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  }, []);

  const currentMonthLabel = useMemo(() => {
    const [year, month] = currentMonth.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleString("default", {
      month: "long",
      year: "numeric"
    });
  }, [currentMonth]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }

    const load = async () => {
      try {
        const [txRes, summaryRes] = await Promise.all([
          api.get("/api/transactions"),
          api.get(`/api/analytics/summary?month=${currentMonth}`)
        ]);

        setTransactions(txRes.data.transactions || []);
        setSummary(summaryRes.data || null);
      } catch (err) {
        setMsg(err?.response?.data?.message || "Failed to load dashboard");
        if (err?.response?.status === 401) logout();
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {user ? `Hi, ${user.name}` : "Dashboard"}
            </h1>
            <p className="text-sm text-gray-600">
              Here’s your money overview for {currentMonthLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/transactions"
              className="px-3 py-2 rounded-lg border bg-white"
            >
              Transactions
            </Link>
            <Link
              to="/analytics"
              className="px-3 py-2 rounded-lg border bg-white"
            >
              Analytics
            </Link>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-lg bg-black text-white"
            >
              Logout
            </button>
          </div>
        </div>

        {msg ? (
          <div className="mt-4 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">
            {msg}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow p-5 border">
            <p className="text-sm text-gray-600">Income</p>
            {loading ? (
              <p className="text-sm text-gray-500 mt-2">Loading...</p>
            ) : (
              <p className="text-2xl font-bold text-green-600 mt-1">
                ₹{summary?.income ?? 0}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-5 border">
            <p className="text-sm text-gray-600">Expense</p>
            {loading ? (
              <p className="text-sm text-gray-500 mt-2">Loading...</p>
            ) : (
              <p className="text-2xl font-bold text-red-600 mt-1">
                ₹{summary?.expense ?? 0}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-5 border">
            <p className="text-sm text-gray-600">Savings</p>
            {loading ? (
              <p className="text-sm text-gray-500 mt-2">Loading...</p>
            ) : (
              <p className={`text-2xl font-bold mt-1 ${(summary?.savings ?? 0) >= 0 ? "text-blue-600" : "text-red-600"}`}>
                ₹{summary?.savings ?? 0}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-semibold text-lg">Quick actions</h2>
              <p className="text-sm text-gray-600">
                Move around your tracker faster
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/transactions"
                className="px-4 py-2 rounded-lg bg-black text-white"
              >
                Add Transaction
              </Link>
              <Link
                to="/analytics"
                className="px-4 py-2 rounded-lg border"
              >
                View Analytics
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Recent transactions</h2>
            <Link to="/transactions" className="text-sm underline">
              View all
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-gray-600">Loading...</p>
          ) : transactions.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <p className="font-medium">No transactions yet</p>
              <p className="text-sm text-gray-600 mt-1">
                Start by adding your first income or expense.
              </p>
              <Link
                to="/transactions"
                className="inline-block mt-4 px-4 py-2 rounded-lg bg-black text-white"
              >
                Add transaction
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between border rounded-xl px-4 py-3 hover:shadow-sm transition"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{t.category}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          t.type === "income"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {t.type}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(t.date).toLocaleDateString()}
                      {t.note ? ` • ${t.note}` : ""}
                    </p>
                  </div>

                  <p
                    className={`font-semibold ${
                      t.type === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}₹{t.amount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}