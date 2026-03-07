import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [deleteId, setDeleteId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editType, setEditType] = useState("expense");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editDate, setEditDate] = useState("");

  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  });

  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const load = async () => {
    setMsg("");
    setLoading(true);
    try {
      const res = await api.get("/api/transactions");
      setTransactions(res.data.transactions || []);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to load transactions");
      if (err?.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
    else load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTx = async (e) => {
    e.preventDefault();
    setMsg("");

    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setMsg("Enter a valid amount");
      return;
    }

    if (!category.trim()) {
      setMsg("Category is required");
      return;
    }

    try {
      await api.post("/api/transactions", {
        type,
        amount: amt,
        category: category.trim(),
        note: note.trim(),
        date
      });

      setAmount("");
      setCategory("Food");
      setNote("");
      setType("expense");

      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setDate(`${yyyy}-${mm}-${dd}`);

      await load();
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to add transaction");
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/transactions/${deleteId}`);
      setShowConfirm(false);
      setDeleteId(null);
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to delete transaction");
    }
  };

  const openEditModal = (t) => {
    setEditId(t._id);
    setEditType(t.type);
    setEditAmount(t.amount);
    setEditCategory(t.category);
    setEditNote(t.note || "");
    setEditDate(new Date(t.date).toISOString().split("T")[0]);
    setShowEdit(true);
  };

  const closeEditModal = () => {
    setShowEdit(false);
    setEditId(null);
    setEditType("expense");
    setEditAmount("");
    setEditCategory("");
    setEditNote("");
    setEditDate("");
  };

  const updateTx = async (e) => {
    e.preventDefault();
    setMsg("");

    const amt = Number(editAmount);
    if (!amt || amt <= 0) {
      setMsg("Enter a valid amount");
      return;
    }

    if (!editCategory.trim()) {
      setMsg("Category is required");
      return;
    }

    try {
      await api.put(`/api/transactions/${editId}`, {
        type: editType,
        amount: amt,
        category: editCategory.trim(),
        note: editNote.trim(),
        date: editDate
      });

      closeEditModal();
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to update transaction");
    }
  };

  const clearFilters = () => {
    setFilterType("all");
    setSearch("");
    setFilterMonth("");
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filterType === "all" || t.type === filterType;

    const matchesSearch =
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.note || "").toLowerCase().includes(search.toLowerCase());

    const txMonth = new Date(t.date).toISOString().slice(0, 7);
    const matchesMonth = !filterMonth || txMonth === filterMonth;

    return matchesType && matchesSearch && matchesMonth;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Transactions</h1>
            <p className="text-sm text-gray-600">Add and view your entries</p>
          </div>

          <div className="flex gap-2">
            <Link to="/dashboard" className="px-3 py-2 rounded-lg border bg-white">
              Dashboard
            </Link>
            <Link to="/analytics" className="px-3 py-2 rounded-lg border bg-white">
              Analytics
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
          <h2 className="font-semibold mb-3">Add transaction</h2>

          <form onSubmit={addTx} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Amount</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 200"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Food / Travel / Hostel ..."
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Date</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Note (optional)</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Maggie + chai"
              />
            </div>

            <div className="md:col-span-2">
              <button className="w-full rounded-lg bg-black text-white py-2 font-medium">
                Add
              </button>
            </div>
          </form>
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-semibold">All transactions</h2>
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-lg border text-sm"
            >
              Clear filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <input
              type="text"
              placeholder="Search category or note"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border px-3 py-2"
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border px-3 py-2"
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="rounded-lg border px-3 py-2"
            />
          </div>

          {loading ? (
            <p className="text-sm text-gray-600">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-gray-600">No transactions yet.</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-sm text-gray-600">No transactions match your filters.</p>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between border rounded-lg px-3 py-2"
                >
                  <div>
                    <p className="font-medium">
                      {t.category} • {t.type}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(t.date).toLocaleDateString()}
                      {t.note ? ` • ${t.note}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <p
                      className={`font-semibold ${
                        t.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}₹{t.amount}
                    </p>

                    <button
                      onClick={() => openEditModal(t)}
                      className="rounded-lg bg-black text-blue-200 px-3 py-1 text-sm"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setDeleteId(t._id);
                        setShowConfirm(true);
                      }}
                      className="rounded-lg bg-black text-white px-3 py-1 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80">
            <h3 className="font-semibold text-lg mb-3">Delete transaction?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setDeleteId(null);
                }}
                className="px-3 py-1 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="px-3 py-1 bg-black text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-4">Edit transaction</h3>

            <form onSubmit={updateTx} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Amount</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Date</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Note</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Optional note"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}