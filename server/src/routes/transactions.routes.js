import { Router } from "express";
import auth from "../middlewares/auth.js";
import Transaction from "../models/Transaction.js";

const router = Router();

// ADD transaction
router.post("/", auth, async (req, res) => {
  try {
    const { type, amount, category, note, date } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ message: "type, amount, category are required" });
    }

    const tx = await Transaction.create({
      userId: req.userId,
      type,
      amount,
      category,
      note: note || "",
      date: date ? new Date(date) : new Date()
    });

    return res.status(201).json({ message: "Transaction added", transaction: tx });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// LIST transactions (latest first)
router.get("/", auth, async (req, res) => {
  try {
    const txs = await Transaction.find({ userId: req.userId }).sort({ date: -1 });
    return res.json({ transactions: txs });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// UPDATE transaction
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { ...req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    return res.json({ message: "Transaction updated", transaction: updated });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE transaction
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.userId
    });

    if (!deleted) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    return res.json({ message: "Transaction deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;