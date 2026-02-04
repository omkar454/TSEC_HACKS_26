import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import Project from "../models/Project.js";
import Wallet from "../models/Wallet.js";
import AuditLog from "../models/AuditLog.js";

/**
 * Submit a new expense for a project.
 * Validates against Project Rules and Wallet Balance.
 */
export const submitExpenseService = async (user, projectId, expenseData) => {
    const { title, amount, category, description, receiptUrl } = expenseData;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Basic Validation
        if (amount <= 0) throw new Error("Amount must be greater than 0");

        const project = await Project.findById(projectId).session(session);
        if (!project) throw new Error("Project not found");

        // 2. Auth & Status Check
        if (project.creatorId.toString() !== user._id.toString()) {
            throw new Error("Only the project creator can submit expenses");
        }
        if (project.status !== "ACTIVE" && project.status !== "FUNDED" && project.status !== "IN_PRODUCTION") {
            throw new Error(`Project is not in a spending state (Status: ${project.status})`);
        }

        // 3. Rule Validation
        const rule = project.fundUsageRules.find((r) => r.category === category);
        if (!rule) {
            throw new Error(`Category '${category}' is not allowed for this project`);
        }

        if (amount > rule.maxAmount) {
            throw new Error(`Amount exceeds the limit for category '${category}' (Limit: ${rule.maxAmount})`);
        }

        if (rule.requiresReceipt && !receiptUrl) {
            throw new Error(`Receipt is required for category '${category}'`);
        }

        // 4. Wallet Balance Check (Optimistic check, real deduction happens on approval)
        const wallet = await Wallet.findById(project.walletId).session(session);
        if (!wallet) throw new Error("Wallet not found");

        // Calculate pending expenses to see if we are "overbooking"
        // For MVP, we'll just check if current balance >= this amount.
        // In strict mode, we might sum up all PENDING + APPROVED expenses.
        if (wallet.balance < amount) {
            throw new Error("Insufficient funds in project wallet");
        }

        // 5. Create Expense Record
        const expense = await Expense.create(
            [
                {
                    projectId: project._id,
                    title,
                    amount,
                    category,
                    description,
                    receiptUrl,
                    status: "PENDING",
                },
            ],
            { session }
        );

        // 6. Audit Log
        await AuditLog.create(
            [
                {
                    action: "SUBMIT_EXPENSE",
                    actorId: user._id,
                    resourceId: expense[0]._id,
                    resourceModel: "Expense",
                    details: { projectId: project._id, amount, category },
                },
            ],
            { session }
        );

        await session.commitTransaction();
        return expense[0];

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Approve or Reject an expense.
 * - Approval deducts from Wallet.
 * - Rejection just updates status.
 */
export const reviewExpenseService = async (user, expenseId, status, reason) => {
    // Only ADMIN or Auditor can approve (Simulated for this hackathon, maybe Creator if self-governed?)
    // Requirement says "Approval can be done by Admin / System".
    if (user.role !== "ADMIN") {
        throw new Error("Only Admins can review expenses");
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
        throw new Error("Invalid status. Must be APPROVED or REJECTED");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const expense = await Expense.findById(expenseId).session(session);
        if (!expense) throw new Error("Expense not found");

        if (expense.status !== "PENDING") {
            throw new Error(`Expense is already ${expense.status}`);
        }

        if (status === "REJECTED") {
            expense.status = "REJECTED";
            await expense.save({ session });

            await AuditLog.create(
                [{
                    action: "REJECT_EXPENSE",
                    actorId: user._id,
                    resourceId: expense._id,
                    resourceModel: "Expense",
                    details: { reason },
                }],
                { session }
            );
        } else {
            // APPROVE
            // 1. Deduct from Wallet
            const project = await Project.findById(expense.projectId).session(session);
            const wallet = await Wallet.findById(project.walletId).session(session);
            if (wallet.isFrozen) throw new Error("Wallet is frozen. Cannot approve expenses.");

            if (wallet.balance < expense.amount) {
                throw new Error("Insufficient wallet balance for approval");
            }

            const oldBalance = wallet.balance;
            wallet.balance -= expense.amount;
            await wallet.save({ session });

            // 2. Update Expense
            expense.status = "APPROVED";
            expense.approvedBy = user._id;
            await expense.save({ session });

            // 3. Audit Log
            await AuditLog.create(
                [{
                    action: "APPROVE_EXPENSE",
                    actorId: user._id,
                    resourceId: expense._id,
                    resourceModel: "Expense",
                    details: {
                        walletId: wallet._id,
                        amount: expense.amount,
                        oldBalance,
                        newBalance: wallet.balance,
                    },
                }],
                { session }
            );
        }

        await session.commitTransaction();
        return expense;

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Get expenses for a project.
 * - Public: Aggregated/Masked? Or list? Requirement: "Contributor: View aggregated project expenses".
 * - Creator/Admin: Full detail.
 */
export const getProjectExpensesService = async (user, projectId) => {
    // For simplicity, we assume if user is logged in, they can see the list.
    // In a real app, we'd filter fields based on role.

    const expenses = await Expense.find({ projectId }).sort({ createdAt: -1 });

    // Minimal masking logic
    const isPrivileged = user && (user.role === "ADMIN" || user.role === "CREATOR");

    if (isPrivileged) {
        return expenses;
    }

    // Public/Contributor view: Remove receiptUrl for privacy?
    // Requirement: "No receipt file exposure publicly"
    return expenses.map(e => ({
        _id: e._id,
        title: e.title,
        amount: e.amount,
        category: e.category,
        status: e.status,
        createdAt: e.createdAt,
        // No receiptUrl
    }));
};

/**
 * Get single expense details
 */
export const getExpenseByIdService = async (user, expenseId) => {
    const expense = await Expense.findById(expenseId);
    if (!expense) throw new Error("Expense not found");

    // Check permissions...
    return expense;
}
