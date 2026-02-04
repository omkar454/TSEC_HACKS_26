import asyncHandler from "express-async-handler";
import * as expenseService from "../services/expenseService.js";

// @desc    Submit an expense
// @route   POST /api/expenses
// @access  Creator
export const submitExpense = asyncHandler(async (req, res) => {
    const { projectId, ...expenseData } = req.body;
    const expense = await expenseService.submitExpenseService(req.user, projectId, expenseData);
    res.status(201).json(expense);
});

// @desc    Approve/Reject expense
// @route   PATCH /api/expenses/:id/status
// @access  Admin
export const reviewExpense = asyncHandler(async (req, res) => {
    const { status, reason } = req.body;
    const expense = await expenseService.reviewExpenseService(req.user, req.params.id, status, reason);
    res.json(expense);
});

// @desc    Get project expenses
// @route   GET /api/projects/:projectId/expenses
// @access  Private (Contributor/Creator/Admin)
export const getProjectExpenses = asyncHandler(async (req, res) => {
    const expenses = await expenseService.getProjectExpensesService(req.user, req.params.projectId);
    res.json(expenses);
});

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
export const getExpenseById = asyncHandler(async (req, res) => {
    const expense = await expenseService.getExpenseByIdService(req.user, req.params.id);
    res.json(expense);
})
// @desc    Get all pending expenses
// @route   GET /api/expenses/pending
// @access  Admin
export const getPendingExpenses = asyncHandler(async (req, res) => {
    const expenses = await expenseService.getAllPendingExpensesService(req.user);
    res.json(expenses);
});
