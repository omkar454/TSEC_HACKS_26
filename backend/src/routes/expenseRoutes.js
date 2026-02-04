import express from "express";
import {
    submitExpense,
    reviewExpense,
    getProjectExpenses,
    getExpenseById
} from "../controllers/expenseController.js";
import { protect, admin, creator } from "../middleware/authMiddleware.js";

const router = express.Router();

// Submit expense (Creator only)
router.post("/", protect, creator, submitExpense);

// Review expense (Admin only)
router.patch("/:id/status", protect, admin, reviewExpense);

// Get single expense
router.get("/:id", protect, getExpenseById);

// Get expenses for a project (mounted differently or here? Let's use query param or path)
// Actually, RESTful is often GET /projects/:id/expenses. 
// But we can also expose GET /expenses?projectId=...
// For now, let's keep it simple:
router.get("/project/:projectId", protect, getProjectExpenses);

export default router;
