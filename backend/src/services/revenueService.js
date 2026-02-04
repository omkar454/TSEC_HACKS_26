import mongoose from "mongoose";
import Revenue from "../models/Revenue.js";
import Project from "../models/Project.js";
import Contribution from "../models/Contribution.js";
import Wallet from "../models/Wallet.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

/**
 * Submit a revenue record (Simulated Income).
 */
export const extractRevenueService = async (user, projectId, revenueData) => {
    const { amount, source, externalRef } = revenueData;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (amount <= 0) throw new Error("Revenue amount must be positive");

        const project = await Project.findById(projectId).session(session);
        if (!project) throw new Error("Project not found");

        if (project.creatorId.toString() !== user._id.toString()) {
            throw new Error("Only the creator can submit revenue records");
        }

        // Create Revenue Record
        const revenue = await Revenue.create(
            [
                {
                    projectId: project._id,
                    amount,
                    source,
                    status: "RECEIVED", // "RECEIVED" maps to "PENDING_DISTRIBUTION" logic
                    distributionDate: null,
                    externalRef // Hypothetical reference to Stripe/YouTube payout ID
                },
            ],
            { session }
        );

        // Audit Log
        await AuditLog.create(
            [
                {
                    action: "REVENUE_RECEIVED",
                    actorId: user._id,
                    resourceId: revenue[0]._id,
                    resourceModel: "Revenue",
                    details: { projectId: project._id, amount, source },
                },
            ],
            { session }
        );

        await session.commitTransaction();
        return revenue[0];
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Distribute Revenue to Contributors (Atomic Settlement).
 */
export const distributeRevenueService = async (user, revenueId) => {
    if (user.role !== "ADMIN" && user.role !== "CREATOR") {
        // Allowing Creator to trigger distribution for this hackathon context,
        // but usually this is automated or Admin only.
        // Requirement says "On revenue approval".
        throw new Error("Not authorized to distribute revenue");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const revenue = await Revenue.findById(revenueId).session(session);
        if (!revenue) throw new Error("Revenue record not found");

        if (revenue.status === "DISTRIBUTED") {
            throw new Error("Revenue already distributed");
        }

        const project = await Project.findById(revenue.projectId).session(session);
        const projectWallet = await Wallet.findById(project.walletId).session(session);
        if (projectWallet.isFrozen) throw new Error("Project Wallet is frozen. Cannot distribute revenue.");

        // 1. Calculate Total Pool
        // Get all valid contributions
        const contributions = await Contribution.find({
            projectId: project._id,
            status: "COMPLETED"
        }).session(session);

        if (contributions.length === 0) {
            throw new Error("No contributors found to distribute revenue to");
        }

        const totalFunding = contributions.reduce((sum, c) => sum + c.amount, 0);
        let distributableAmount = revenue.amount;
        const payouts = [];
        let distributedTotal = 0;

        // --- 2a. Creator Stake Distribution ---
        const creatorStakePercent = project.creatorStake || 0;
        if (creatorStakePercent > 0) {
            const creatorShare = Math.floor((distributableAmount * creatorStakePercent) / 100 * 100) / 100;

            if (creatorShare > 0) {
                // Find or Create Creator Wallet
                let creatorUser = await User.findById(project.creatorId).session(session);
                if (!creatorUser.walletId) {
                    const newWallet = await Wallet.create([{
                        ownerId: creatorUser._id,
                        ownerModel: "User",
                        balance: 0
                    }], { session });

                    creatorUser.walletId = newWallet[0]._id;
                    await creatorUser.save({ session });
                }

                const creatorWallet = await Wallet.findById(creatorUser.walletId).session(session);
                const oldBalance = creatorWallet.balance;
                creatorWallet.balance += creatorShare;
                await creatorWallet.save({ session });

                // Track distributed amount so far
                distributedTotal += creatorShare;

                // Adjust remaining amount for investors
                distributableAmount -= creatorShare;

                payouts.push({
                    userId: creatorUser._id,
                    amount: creatorShare,
                    walletId: creatorWallet._id,
                    type: "CREATOR_STAKE"
                });

                await AuditLog.create([{
                    action: "PAYOUT",
                    actorId: user._id,
                    resourceId: creatorWallet._id,
                    resourceModel: "Wallet",
                    details: {
                        revenueId: revenue._id,
                        amount: creatorShare,
                        reason: "CREATOR_STAKE_REVENUE",
                        stakePercent: creatorStakePercent,
                        oldBalance,
                        newBalance: creatorWallet.balance
                    }
                }], { session });
            }
        }

        // --- 2b. Investor Distribution Loop ---

        for (const contribution of contributions) {
            // Share Formula
            const shareRatio = contribution.amount / totalFunding;
            const shareAmount = Math.floor(shareRatio * distributableAmount * 100) / 100; // Floor to 2 decimals safely

            if (shareAmount > 0) {
                // Find or Create User Wallet
                let user = await User.findById(contribution.contributorId).session(session);

                // Helper to ensure wallet exists (Lazy creation)
                if (!user.walletId) {
                    const newWallet = await Wallet.create([{
                        ownerId: user._id,
                        ownerModel: "User",
                        balance: 0
                    }], { session });

                    user.walletId = newWallet[0]._id;
                    await user.save({ session });
                }

                // Update Wallet
                const userWallet = await Wallet.findById(user.walletId).session(session);
                const oldBalance = userWallet.balance;
                userWallet.balance += shareAmount;
                await userWallet.save({ session });

                distributedTotal += shareAmount;

                payouts.push({
                    userId: user._id,
                    amount: shareAmount,
                    walletId: userWallet._id
                });

                // Log individual payout (audit)
                await AuditLog.create([{
                    action: "PAYOUT",
                    actorId: user._id, // Whoever triggered distribution
                    resourceId: userWallet._id,
                    resourceModel: "Wallet",
                    details: {
                        revenueId: revenue._id,
                        amount: shareAmount,
                        reason: "REVENUE_SHARE",
                        oldBalance,
                        newBalance: userWallet.balance
                    }
                }], { session });
            }
        }

        // 3. Handle Remainder (Dust)
        // Any rounding remainder goes to the Project Wallet (or Creator)
        const remainder = distributableAmount - distributedTotal;
        if (remainder > 0) {
            const projectWallet = await Wallet.findById(project.walletId).session(session);
            projectWallet.balance += remainder;
            await projectWallet.save({ session });

            await AuditLog.create([{
                action: "PAYOUT_REMAINDER",
                actorId: user._id,
                resourceId: projectWallet._id,
                resourceModel: "Wallet",
                details: { amount: remainder, revenueId: revenue._id }
            }], { session });
        }

        // 4. Update Revenue Status
        revenue.status = "DISTRIBUTED";
        revenue.distributionDate = new Date();
        await revenue.save({ session });

        await session.commitTransaction();

        return {
            revenueId: revenue._id,
            totalDistributed: distributableAmount,
            recipientCount: payouts.length,
            status: "DISTRIBUTED"
        };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Get Revenue History
 */
export const getProjectRevenueService = async (user, projectId) => {
    // Admin/Creator sees specific amounts
    // Public/Contributor implies aggregate
    const revenues = await Revenue.find({ projectId }).sort({ createdAt: -1 });
    return revenues;
}
