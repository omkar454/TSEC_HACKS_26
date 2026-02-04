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

    // 3. Update Creator's Wallet (Direct Payout)
    const creator = await User.findById(project.creatorId);
    if (!creator || !creator.walletId) throw new Error("Creator does not have a linked wallet to receive funds.");

    const creatorWallet = await Wallet.findById(creator.walletId);
    if (!creatorWallet) throw new Error("Creator wallet not found");
    if (creatorWallet.isFrozen) throw new Error("Creator wallet is frozen. Cannot accept contributions.");

    creatorWallet.balance += amount;
    await creatorWallet.save();

    // 4. Update Project Funding Status
    project.currentFunding += amount;

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
            creatorWalletId: creatorWallet._id,
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

