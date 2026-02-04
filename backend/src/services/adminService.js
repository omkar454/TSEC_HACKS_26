import mongoose from "mongoose";
import Project from "../models/Project.js";
import Wallet from "../models/Wallet.js";
import Expense from "../models/Expense.js";
import AuditLog from "../models/AuditLog.js";

/**
 * Freeze or Unfreeze a Project Wallet (Governance Action)
 */
export const toggleProjectWalletFreezeService = async (adminUser, projectId, shouldFreeze, reason) => {
    if (adminUser.role !== "ADMIN") {
        throw new Error("Unauthorized: Only Admins can perform governance actions");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const project = await Project.findById(projectId).session(session);
        if (!project) throw new Error("Project not found");

        const wallet = await Wallet.findById(project.walletId).session(session);
        if (!wallet) throw new Error("Wallet not found");

        if (wallet.isFrozen === shouldFreeze) {
            throw new Error(`Wallet is already ${shouldFreeze ? "frozen" : "active"}`);
        }

        wallet.isFrozen = shouldFreeze;
        await wallet.save({ session });

        // Immutable Governance Log
        await AuditLog.create([{
            action: shouldFreeze ? "GOVERNANCE_FREEZE" : "GOVERNANCE_UNFREEZE",
            actorId: adminUser._id,
            resourceId: wallet._id,
            resourceModel: "Wallet",
            details: { projectId, reason }
        }], { session });

        await session.commitTransaction();
        return { projectId, walletId: wallet._id, isFrozen: wallet.isFrozen };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Get Governance Timeline (Audit Trail)
 * Used by Auditors/Judges to see the full financial story.
 */
export const getGovernanceTimelineService = async (projectId) => {
    // 1. Get Project ID (if not already)
    // 2. Query AuditLogs for this resource or related resources
    // We need logs where resourceId == projectId OR details.projectId == projectId

    // Simplification: We search by details.projectId which we've been diligent to add, 
    // or by resourceId matching the project.

    // We also need Wallet and Expense logs. 
    // This is a complex query in a real system (Aggregate). 
    // For MVP, we'll fetch logs where details.projectId exists.

    const logs = await AuditLog.find({
        $or: [
            { resourceId: projectId },
            { "details.projectId": projectId }
        ]
    }).populate("actorId", "name role").sort({ createdAt: -1 });

    return logs;
};

/**
 * Detect Risk Signals (Anomaly Detection)
 * Non-blocking, reporting only.
 */
export const getRiskReportService = async () => {
    // 1. Projects with high failed expense rate
    const riskyProjects = [];
    const projects = await Project.find({ status: { $in: ["ACTIVE", "FUNDED", "IN_PRODUCTION"] } });

    for (const p of projects) {
        const totalExpenses = await Expense.countDocuments({ projectId: p._id });
        const rejectedExpenses = await Expense.countDocuments({ projectId: p._id, status: "REJECTED" });

        let riskScore = 0;
        const signals = [];

        // Signal: High Rejection Rate (> 30%)
        if (totalExpenses > 5 && (rejectedExpenses / totalExpenses) > 0.3) {
            riskScore += 50;
            signals.push("High Expense Rejection Rate");
        }

        // Signal: Wallet Near Depletion but status not Completed
        const wallet = await Wallet.findById(p.walletId);
        if (wallet.balance < 100 && p.status === "AMBITIOUS_STATUS_HERE") {
            // Logic placeholder
        }

        if (riskScore > 0) {
            riskyProjects.push({
                projectId: p._id,
                title: p.title,
                riskScore,
                signals
            });
        }
    }

    return {
        timestamp: new Date(),
        riskyProjects
    };
};

/**
 * Get Global Audit Logs
 * Restricted to Admins for platform governance.
 */
export const getGlobalAuditLogsService = async () => {
    return await AuditLog.find()
        .populate("actorId", "name role email")
        .sort({ createdAt: -1 })
        .limit(100); // Limit to last 100 for performance
};

/**
 * Get Overall Platform Analytics
 * Computes status distribution, funding total, and project volume.
 */
export const getOverallAnalyticsService = async () => {
    const totalProjects = await Project.countDocuments();
    const statusDistribution = await Project.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const fundingStats = await Project.aggregate([
        { $group: { _id: null, totalRaised: { $sum: "$currentFunding" }, avgFunding: { $avg: "$currentFunding" } } }
    ]);

    const recentActivity = await AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(5);

    return {
        totalProjects,
        statusDistribution,
        totalFunding: fundingStats[0]?.totalRaised || 0,
        averageFunding: fundingStats[0]?.avgFunding || 0,
        recentActivity
    };
};
