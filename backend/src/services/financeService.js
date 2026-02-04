import mongoose from "mongoose";
import Project from "../models/Project.js";
import Wallet from "../models/Wallet.js";
import Contribution from "../models/Contribution.js";
import AuditLog from "../models/AuditLog.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Handle a contribution to a project.
 * Simulates payment gateway success.
 */
export const contributeToProjectService = async (user, projectId, amount, currency = "USD") => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Validation
        if (amount <= 0) throw new Error("Contribution amount must be greater than 0");

        const project = await Project.findById(projectId).session(session);
        if (!project) throw new Error("Project not found");

        if (project.status !== "ACTIVE" && project.status !== "FUNDED") {
            throw new Error(`Project is not accepting funds (Status: ${project.status})`);
        }

        // Check if funding goal exceeded (Optional: Soft cap vs Hard cap policy)
        // For this hackathon, we allow overfunding but mark as FUNDED if goal met.

        // 2. Create Contribution Record
        // Simulate a payment transaction hash
        const paymentHash = `txn_${uuidv4()}`;

        const contribution = await Contribution.create(
            [
                {
                    contributorId: user._id,
                    projectId: project._id,
                    amount,
                    transactionHash: paymentHash,
                    status: "COMPLETED", // Assuming instant success for simulation
                },
            ],
            { session }
        );

        // 3. Update Project Wallet (Pool Funds)
        const wallet = await Wallet.findById(project.walletId).session(session);
        if (!wallet) throw new Error("Project wallet not found");
        if (wallet.isFrozen) throw new Error("Wallet is frozen. Cannot accept contributions.");

        const oldBalance = wallet.balance;
        wallet.balance += amount;
        await wallet.save({ session });

        // 4. Update Project Funding Status
        const oldFunding = project.currentFunding;
        project.currentFunding += amount;

        // Auto-update status if goal met
        if (project.currentFunding >= project.fundingGoal && project.status === "ACTIVE") {
            project.status = "FUNDED";
        }
        await project.save({ session });

        // 5. Audit Logging (Immutable)
        await AuditLog.create(
            [
                {
                    action: "CONTRIBUTION",
                    actorId: user._id,
                    resourceId: project._id,
                    resourceModel: "Project",
                    details: {
                        amount,
                        currency,
                        walletId: wallet._id,
                        oldBalance: oldBalance,
                        newBalance: wallet.balance,
                        paymentHash,
                    },
                },
            ],
            { session }
        );

        await session.commitTransaction();
        return contribution[0];

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Get project fund summary for transparency.
 */
export const getProjectFundSummaryService = async (projectId) => {
    const project = await Project.findById(projectId).select("title fundingGoal currentFunding status walletId");
    if (!project) throw new Error("Project not found");

    const contributorCount = await Contribution.distinct("contributorId", { projectId: project._id, status: "COMPLETED" });

    return {
        projectId: project._id,
        title: project.title,
        status: project.status,
        fundingGoal: project.fundingGoal,
        totalRaised: project.currentFunding,
        percentageFunded: ((project.currentFunding / project.fundingGoal) * 100).toFixed(2),
        totalContributors: contributorCount.length,
        currency: "USD",
    };
};

/**
 * Get list of contributions for a project (Public Safe View).
 */
export const getProjectContributionsService = async (projectId) => {
    const contributions = await Contribution.find({ projectId, status: "COMPLETED" })
        .populate("contributorId", "name") // Show name, public transparency
        .sort({ createdAt: -1 });

    return contributions.map((c) => ({
        contributorName: c.contributorId.name,
        amount: c.amount,
        date: c.createdAt,
    }));
};

/**
 * Get a user's own contribution history.
 */
export const getUserContributionsService = async (userId) => {
    return await Contribution.find({ contributorId: userId })
        .populate("projectId", "title status")
        .sort({ createdAt: -1 });
};
