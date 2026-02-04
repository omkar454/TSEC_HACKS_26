import mongoose from "mongoose";
import Project from "../models/Project.js";
import Wallet from "../models/Wallet.js";
import User from "../models/User.js";
import Contribution from "../models/Contribution.js";
import AuditLog from "../models/AuditLog.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Handle a contribution to a project.
 * Simulates payment gateway success.
 */
/**
 * Handle a contribution to a project.
 * Deducts from user wallet and adds to project wallet.
 */
export const contributeToProjectService = async (user, projectId, amount, currency = "INR") => {
    // 1. Validation
    if (amount <= 0) throw new Error("Contribution amount must be greater than 0");

    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");

    if (project.status !== "ACTIVE" && project.status !== "FUNDED") {
        throw new Error(`Project is not accepting funds (Status: ${project.status})`);
    }

    // Check and Deduct from User Wallet
    if (!user.walletId) throw new Error("You must create a wallet to contribute.");

    const userWallet = await Wallet.findById(user.walletId);
    if (!userWallet) throw new Error("User wallet not found");
    if (userWallet.isFrozen) throw new Error("Your wallet is frozen.");
    if (userWallet.balance < amount) throw new Error(`Insufficient funds. Your balance: ₹${userWallet.balance}`);

    userWallet.balance -= amount;
    await userWallet.save();

    // 2. Create Contribution Record
    const paymentHash = `txn_${uuidv4()}`;

    const contribution = await Contribution.create({
        contributorId: user._id,
        projectId: project._id,
        amount,
        transactionHash: paymentHash,
        status: "COMPLETED",
    });

    // 3. Update Project's Wallet (Escrow)
    if (!project.walletId) {
        throw new Error("Project does not have an associated wallet. This is a critical system error.");
    }

    const projectWallet = await Wallet.findById(project.walletId);
    if (!projectWallet) throw new Error("Project wallet not found");
    if (projectWallet.isFrozen) throw new Error("Project wallet is frozen. Cannot accept contributions.");

    projectWallet.balance += amount;
    await projectWallet.save();

    // 4. Update Project Funding Status
    project.currentFunding += amount;

    // Check Tiers
    const fundingPercent = (project.currentFunding / project.fundingGoal) * 100;
    if (fundingPercent >= 30) project.tiers.seedMet = true;
    if (fundingPercent >= 70) project.tiers.productionMet = true;
    if (fundingPercent >= 100) project.tiers.successMet = true;

    // Auto-update status if goal met
    if (project.currentFunding >= project.fundingGoal && project.status === "ACTIVE") {
        project.status = "FUNDED";
    }
    await project.save();

    // 5. Audit Logging (Immutable)
    await AuditLog.create({
        action: "CONTRIBUTION",
        actorId: user._id,
        resourceId: project._id,
        resourceModel: "Project",
        details: {
            amount,
            currency,
            contributorWalletId: userWallet._id,
            projectWalletId: projectWallet._id,
            paymentHash,
        },
    });

    return contribution;
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
        currency: "INR",
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

/**
 * Create a wallet for a user if it doesn't exist.
 */

/**
 * Atomic Refund Engine
 * Iterates through all completed contributions and returns funds to contributor wallets.
 */
export const refundProjectService = async (projectId, adminReason = "Project cancelled or deadline expired without meeting seed tier.") => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const project = await Project.findById(projectId).session(session);
        if (!project) throw new Error("Project not found");

        const projectWallet = await Wallet.findById(project.walletId).session(session);
        if (!projectWallet) throw new Error("Project wallet not found");

        const contributions = await Contribution.find({
            projectId: project._id,
            status: "COMPLETED"
        }).session(session);

        let totalRefunded = 0;

        for (const cont of contributions) {
            const userWallet = await Wallet.findOne({ ownerId: cont.contributorId, ownerModel: "User" }).session(session);

            if (userWallet) {
                userWallet.balance += cont.amount;
                await userWallet.save({ session });

                cont.status = "REFUNDED";
                await cont.save({ session });

                totalRefunded += cont.amount;

                // Log per-user refund
                await AuditLog.create([{
                    action: "REFUND",
                    actorId: project.creatorId, // System automation on behalf of project
                    resourceId: cont._id,
                    resourceModel: "Contribution",
                    details: {
                        projectId: project._id,
                        amount: cont.amount,
                        userId: cont.contributorId,
                        reason: adminReason
                    }
                }], { session });
            }
        }

        // Deduct from Project Wallet
        projectWallet.balance -= totalRefunded;
        await projectWallet.save({ session });

        // Update Project Status
        project.status = "CANCELLED";
        await project.save({ session });

        // Global Governance Log
        await AuditLog.create([{
            action: "PROJECT_AUTO_REFUND_COMPLETE",
            actorId: project.creatorId,
            resourceId: project._id,
            resourceModel: "Project",
            details: {
                totalRefunded,
                contributorCount: contributions.length,
                reason: adminReason
            }
        }], { session });

        await session.commitTransaction();
        return { totalRefunded, count: contributions.length };

    } catch (error) {
        await session.abortTransaction();
        console.error("Refund Engine Failure:", error);
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Milestone-based Tranche Release
 * Releases a percentage of funds from Project Escrow to Creator Wallet upon milestone approval.
 */
export const releaseTrancheService = async (adminUser, projectId, milestoneId) => {
    if (adminUser.role !== "ADMIN") throw new Error("Unauthorized: Only Admins can release tranches.");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const project = await Project.findById(projectId).session(session);
        if (!project) throw new Error("Project not found");

        const milestone = project.milestones.id(milestoneId);
        if (!milestone) throw new Error("Milestone not found");
        if (milestone.status === "APPROVED") throw new Error("Milestone already approved and funds released.");

        const projectWallet = await Wallet.findById(project.walletId).session(session);
        if (!projectWallet) throw new Error("Project wallet not found");

        const creator = await User.findById(project.creatorId).session(session);
        if (!creator || !creator.walletId) throw new Error("Creator wallet not linked");

        const creatorWallet = await Wallet.findById(creator.walletId).session(session);
        if (!creatorWallet) throw new Error("Creator wallet not found");

        // Calculate release amount based on tranchePercent of currentFunding
        const releaseAmount = (project.currentFunding * milestone.tranchePercent) / 100;

        if (projectWallet.balance < releaseAmount) {
            throw new Error(`Insufficient funds in project escrow. Balance: ₹${projectWallet.balance}, Required: ₹${releaseAmount}`);
        }

        // Atomic Swap
        projectWallet.balance -= releaseAmount;
        creatorWallet.balance += releaseAmount;

        milestone.status = "APPROVED";

        await projectWallet.save({ session });
        await creatorWallet.save({ session });
        await project.save({ session });

        // Governance Audit
        await AuditLog.create([{
            action: "TRANCHE_RELEASE",
            actorId: adminUser._id,
            resourceId: project._id,
            resourceModel: "Project",
            details: {
                milestoneId,
                amount: releaseAmount,
                percent: milestone.tranchePercent,
                creatorWalletId: creatorWallet._id
            }
        }], { session });

        await session.commitTransaction();
        return { released: releaseAmount, remaining: projectWallet.balance };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

