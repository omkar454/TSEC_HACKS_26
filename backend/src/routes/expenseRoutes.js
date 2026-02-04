import express from "express";
import {
    submitExpense,
    reviewExpense,
    getProjectExpenses,
    getExpenseById,
    getPendingExpenses
} from "../controllers/expenseController.js";
import { protect, admin, creator } from "../middleware/authMiddleware.js";

const router = express.Router();

// Submit expense (Creator only)
router.post("/", protect, creator, submitExpense);

// Review expense (Admin only)
router.patch("/:id/status", protect, admin, reviewExpense);

// Get all pending expenses (Admin only)
router.get("/pending", protect, admin, getPendingExpenses);

// Get single expense
router.get("/:id", protect, getExpenseById);

// Get expenses for a project
router.get("/project/:projectId", protect, getProjectExpenses);

export default router;
