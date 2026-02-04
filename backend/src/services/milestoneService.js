import Project from "../models/Project.js";
import Contribution from "../models/Contribution.js";
import AuditLog from "../models/AuditLog.js";
import Wallet from "../models/Wallet.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/**
 * Submit Milestone Proof (Creator)
 */
export const submitMilestoneProofService = async (user, projectId, milestoneId, proofData) => {
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");

    if (project.creatorId.toString() !== user._id.toString()) {
        throw new Error("Only the creator can submit milestones.");
    }

    const milestoneIndex = project.milestones.findIndex(m => m._id.toString() === milestoneId);
    if (milestoneIndex === -1) throw new Error("Milestone not found");

    const milestone = project.milestones[milestoneIndex];

    // Sequential Check: Previous milestones must be APPROVED
    for (let i = 0; i < milestoneIndex; i++) {
        if (project.milestones[i].status !== "APPROVED") {
            throw new Error(`You must complete and get approval for "${project.milestones[i].title}" first.`);
        }
    }

    if (milestone.status === "APPROVED") throw new Error("Milestone already approved.");

    // Proof Validation based on type
    const { textProof, mediaUrls, finalLink } = proofData;

    if (milestone.milestoneType === "KICKOFF" && !textProof) {
        throw new Error("KICKOFF milestone requires text proof (Script/Plan).");
    }
    if ((milestone.milestoneType === "PRODUCTION" || milestone.milestoneType === "FINAL_DELIVERY") && (!mediaUrls || mediaUrls.length === 0)) {
        throw new Error("This milestone requires multimedia proof (Images/Videos).");
    }
    if (milestone.milestoneType === "RELEASE" && !finalLink) {
        throw new Error("RELEASE milestone requires a public URL.");
    }

    milestone.textProof = textProof;
    milestone.mediaUrls = mediaUrls;
    milestone.finalLink = finalLink;
    milestone.status = "SUBMITTED";

    await project.save();

    await AuditLog.create({
        action: "MILESTONE_PROOF_SUBMITTED",
        actorId: user._id,
        resourceId: project._id,
        resourceModel: "Project",
        details: { milestoneId, milestoneTitle: milestone.title, milestoneType: milestone.milestoneType }
    });

    return project;
};

/**
 * Vote on Milestone (Contributor)
 */
export const voteOnMilestoneService = async (user, projectId, milestoneId, vote) => {
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) throw new Error("Milestone not found");

    if (milestone.status !== "SUBMITTED") throw new Error("This milestone is not open for voting.");

    // Avoid double voting
    if (milestone.votes.find(v => v.voterId.toString() === user._id.toString())) {
        throw new Error("You have already voted on this milestone.");
    }

    // Calculate weight: (User contribution / project target) * 100
    // Note: Using total funding raised so far as the denominator for percentage weights
    const userContributions = await Contribution.aggregate([
        { $match: { projectId: project._id, contributorId: user._id, status: "COMPLETED" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const userTotal = userContributions[0]?.total || 0;
    if (userTotal === 0) throw new Error("Only contributors can vote.");

    // Voting weight is relative to the total funds raised
    const weight = (userTotal / project.currentFunding) * 100;

    milestone.votes.push({
        voterId: user._id,
        vote,
        weight
    });

    // Update stats
    if (vote === "YES") milestone.voteStats.yesWeight += weight;
    else milestone.voteStats.noWeight += weight;

    // Check Approval Logic (> 50%)
    if (milestone.voteStats.yesWeight > 50) {
        milestone.status = "APPROVED";

        // Trigger automated fund release
        await releaseMilestoneTranche(project, milestone, user._id);
    } else if (milestone.voteStats.noWeight >= 50) {
        milestone.status = "REJECTED";
        // Option for creator: Re-submit proof
    }

    await project.save();

    await AuditLog.create({
        action: "MILESTONE_VOTE_CAST",
        actorId: user._id,
        resourceId: project._id,
        resourceModel: "Project",
        details: { milestoneId, vote, weight: weight.toFixed(2) }
    });

    return { status: milestone.status, voteStats: milestone.voteStats };
};

/**
 * Automated Fund Release Logic (Internal)
 */
async function releaseMilestoneTranche(project, milestone, finalVoterId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const projectWallet = await Wallet.findById(project.walletId).session(session);
        const creator = await User.findById(project.creatorId).session(session);
        const creatorWallet = await Wallet.findById(creator.walletId).session(session);

        if (!projectWallet || !creatorWallet) throw new Error("Wallets not found");

        const releaseAmount = (project.currentFunding * milestone.tranchePercent) / 100;

        if (projectWallet.balance < releaseAmount) {
            throw new Error("Insufficient funds in project escrow for this tranche.");
        }

        projectWallet.balance -= releaseAmount;
        creatorWallet.balance += releaseAmount;

        await projectWallet.save({ session });
        await creatorWallet.save({ session });

        await AuditLog.create([{
            action: "TRANCHE_RELEASE_AUTOMATED",
            actorId: finalVoterId, // Triggered by the voter who crossed the 50% mark
            resourceId: project._id,
            resourceModel: "Project",
            details: {
                milestoneId: milestone._id,
                amount: releaseAmount,
                percent: milestone.tranchePercent
            }
        }], { session });

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        console.error("Fund Release Failure:", error);
        throw error;
    } finally {
        session.endSession();
    }
}
