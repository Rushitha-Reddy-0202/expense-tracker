import { Router } from "express";
import mongoose from "mongoose";
import auth from "../middlewares/auth.js";
import Transaction from "../models/Transaction.js";

const router = Router();

const getMonthRange = (month) => {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { start, end };
};

// 1) Monthly summary
router.get("/summary", auth, async (req, res) => {
  try {
    const month = req.query.month; // YYYY-MM
    if (!month) return res.status(400).json({ message: "month is required (YYYY-MM)" });

    const { start, end } = getMonthRange(month);

    const txs = await Transaction.find({
      userId: req.userId,
      date: { $gte: start, $lt: end }
    });

    let income = 0;
    let expense = 0;

    for (const t of txs) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }

    return res.json({ month, income, expense, savings: income - expense });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 2) Expenses by category (Pie chart)
router.get("/by-category", auth, async (req, res) => {
  try {
    const month = req.query.month; // YYYY-MM
    if (!month) return res.status(400).json({ message: "month is required (YYYY-MM)" });

    const { start, end } = getMonthRange(month);

    const userObjectId = new mongoose.Types.ObjectId(req.userId);

    const result = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: "expense",
          date: { $gte: start, $lt: end }
        }
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" }
        }
      },
      { $sort: { total: -1 } }
    ]);

    return res.json({
      month,
      categories: result.map((r) => ({ category: r._id, total: r.total }))
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});
// 3) Monthly trend (Line chart)
router.get("/trend", auth, async (req, res) => {
  try {
    const from = req.query.from; // YYYY-MM
    const to = req.query.to;     // YYYY-MM
    if (!from || !to) {
      return res.status(400).json({ message: "from and to are required (YYYY-MM)" });
    }

    const [fy, fm] = from.split("-").map(Number);
    const [ty, tm] = to.split("-").map(Number);

    const start = new Date(fy, fm - 1, 1);
    const end = new Date(ty, tm, 1); // first day of next month

    const userObjectId = new mongoose.Types.ObjectId(req.userId);

    const result = await Transaction.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: start, $lt: end }
        }
      },
      {
        $group: {
          _id: {
            y: { $year: "$date" },
            m: { $month: "$date" },
            type: "$type"
          },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } }
    ]);

    // Build a month map: "YYYY-MM" -> { income, expense }
    const map = {};
    for (const r of result) {
      const y = r._id.y;
      const m = String(r._id.m).padStart(2, "0");
      const key = `${y}-${m}`;
      if (!map[key]) map[key] = { month: key, income: 0, expense: 0 };
      map[key][r._id.type] = r.total;
    }

    // Fill missing months in range with zeros
    const data = [];
    let cy = fy, cm = fm;
    while (cy < ty || (cy === ty && cm <= tm)) {
      const mm = String(cm).padStart(2, "0");
      const key = `${cy}-${mm}`;
      data.push(map[key] || { month: key, income: 0, expense: 0 });

      cm++;
      if (cm === 13) {
        cm = 1;
        cy++;
      }
    }

    return res.json({ from, to, data });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});
export default router;