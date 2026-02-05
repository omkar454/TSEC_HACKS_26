import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import Project from "../models/Project.js";
import Wallet from "../models/Wallet.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

/**
 * Submit a new expense for a project.
 * Validates against Project Rules and Wallet Balance.
 */
export const submitExpenseService = async (user, projectId, expenseData) => {
    const { title, amount, category, description, receiptUrl } = expenseData;

    // Define valid categories that match Expense model enum
    const VALID_CATEGORIES = ["EQUIPMENT", "TRAVEL", "PRODUCTION", "MARKETING", "MISCELLANEOUS"];

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Basic Validation
        if (amount <= 0) throw new Error("Amount must be greater than 0");

        // 2. Category Validation - Check against Expense model enum
        if (!category || !VALID_CATEGORIES.includes(category)) {
            throw new Error(`Invalid category '${category}'. Allowed categories are: ${VALID_CATEGORIES.join(', ')}`);
        }

        const project = await Project.findById(projectId).session(session);
        if (!project) throw new Error("Project not found");

        // 3. Auth & Status Check
        if (project.creatorId.toString() !== user._id.toString()) {
            throw new Error("Only the project creator can submit expenses for this project.");
        }
        if (project.status !== "ACTIVE" && project.status !== "FUNDED" && project.status !== "IN_PRODUCTION") {
            throw new Error(`Project is not in a spending state (Status: ${project.status})`);
        }

        // 4. Project-specific Rule Validation (if rules exist)
        if (project.fundUsageRules && project.fundUsageRules.length > 0) {
            const rule = project.fundUsageRules.find((r) => r.category === category);
            
            if (!rule) {
                throw new Error(`Category '${category}' is not allowed for this project. Allowed categories are: ${project.fundUsageRules.map(r => r.category).join(', ')}`);
            }

            if (amount > rule.maxAmount) {
                throw new Error(`Amount exceeds the limit for category '${category}' (Limit: ${rule.maxAmount})`);
            }

            if (rule.requiresReceipt && !receiptUrl) {
                throw new Error(`Receipt is required for category '${category}'`);
            }
        }

        // 5. Wallet Balance Check (Creator's Personal Wallet)
        if (!user.walletId) throw new Error("Creator does not have a linked wallet.");
        const wallet = await Wallet.findById(user.walletId).session(session);
        if (!wallet) throw new Error("Creator wallet not found");

        if (wallet.balance < amount) {
            throw new Error(`Insufficient funds in your wallet. Available: ₹${wallet.balance}`);
        }

        // 6. Create Expense Record
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
                    submittedBy: user._id,
                },
            ],
            { session }
        );

        // 7. Audit Log
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
 * - Approval deducts from Project Wallet and ADDS to Submitter's Wallet (Reimbursement).
 */
export const reviewExpenseService = async (user, expenseId, status, reason) => {
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

        const project = await Project.findById(expense.projectId).session(session);
        const projectWallet = await Wallet.findById(project.walletId).session(session);

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
            // APPROVE logic - Creator Payout Deduction
            const project = await Project.findById(expense.projectId).session(session);
            const creator = await User.findById(project.creatorId).session(session);

            if (!creator.walletId) throw new Error("Creator wallet link missing");
            const creatorWallet = await Wallet.findById(creator.walletId).session(session);

            if (creatorWallet.isFrozen) throw new Error("Creator wallet is frozen. Cannot process approval.");

            if (creatorWallet.balance < expense.amount) {
                throw new Error("Insufficient creator wallet balance for approval. Creator might have withdrawn funds.");
            }

            // 1. Deduct from Creator Wallet
            const oldBalance = creatorWallet.balance;
            creatorWallet.balance -= expense.amount;
            await creatorWallet.save({ session });

            // 2. Update Expense Status
            expense.status = "APPROVED";
            expense.approvedBy = user._id;
            await expense.save({ session });

            // 3. Audit Log
            await AuditLog.create(
                [{
                    action: "APPROVE_EXPENSE_CREATOR_DEDUCTION",
                    actorId: user._id,
                    resourceId: expense._id,
                    resourceModel: "Expense",
                    details: {
                        creatorWalletId: creatorWallet._id,
                        amount: expense.amount,
                        oldBalance,
                        newBalance: creatorWallet.balance
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
/**
 * Get all pending expenses (Admin View).
 */
export const getAllPendingExpensesService = async (user) => {
    if (user.role !== "ADMIN") {
        throw new Error("Only Admins can access all pending expenses");
    }

    return await Expense.find({ status: "PENDING" })
        .populate("projectId", "title currentFunding")
        .populate("submittedBy", "name email")
        .sort({ createdAt: -1 });
};
