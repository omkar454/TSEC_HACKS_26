import GovernanceRequest from "../models/GovernanceRequest.js";
import Project from "../models/Project.js";
import Contribution from "../models/Contribution.js";
import AuditLog from "../models/AuditLog.js";
import mongoose from "mongoose";

/**
 * Submit Deadline Extension Request
 */
export const requestDeadlineExtensionService = async (user, projectId, extensionDays, reason) => {
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");

    if (project.creatorId.toString() !== user._id.toString()) {
        throw new Error("Only the project creator can request an extension.");
    }

    if (extensionDays <= 0 || extensionDays > 30) {
        throw new Error("Extension requests must be between 1 and 30 days.");
    }

    // Check for existing pending request
    const existing = await GovernanceRequest.findOne({ projectId, status: "PENDING" });
    if (existing) throw new Error("A governance request is already pending for this project.");

    const request = await GovernanceRequest.create({
        projectId,
        creatorId: user._id,
        details: { extensionDays, reason },
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 48 hour voting window
    });

    await AuditLog.create({
        action: "GOVERNANCE_REQUEST_CREATED",
        actorId: user._id,
        resourceId: request._id,
        resourceModel: "GovernanceRequest",
        details: { projectId, extensionDays, reason }
    });

    return request;
};

/**
 * Vote on Governance Request
 */
export const voteOnGovernanceService = async (user, requestId, vote) => {
    const request = await GovernanceRequest.findById(requestId);
    if (!request) throw new Error("Governance request not found");
    if (request.status !== "PENDING") throw new Error("Voting is closed for this request.");
    if (request.expiresAt < new Date()) {
        request.status = "REJECTED"; // Autoclose
        await request.save();
        throw new Error("Voting window has expired.");
    }

    // Avoid double voting
    if (request.votes.find(v => v.voterId.toString() === user._id.toString())) {
        throw new Error("You have already voted on this request.");
    }

    // Calculate weight: (User total contributions to project / project current funding)
    const project = await Project.findById(request.projectId);
    const userContributions = await Contribution.aggregate([
        { $match: { projectId: project._id, contributorId: user._id, status: "COMPLETED" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const userTotal = userContributions[0]?.total || 0;
    if (userTotal === 0) throw new Error("Only contributors can vote.");

    const weight = (userTotal / project.currentFunding) * 100;

    request.votes.push({
        voterId: user._id,
        vote,
        weight
    });

    await request.save();

    // Check if > 51% reached
    const yesVotes = request.votes.filter(v => v.vote === "YES").reduce((sum, v) => sum + v.weight, 0);
    const noVotes = request.votes.filter(v => v.vote === "NO").reduce((sum, v) => sum + v.weight, 0);

    if (yesVotes > 51) {
        request.status = "APPROVED";
        // Apply Extension
        project.deadline = new Date(project.deadline.getTime() + request.details.extensionDays * 24 * 60 * 60 * 1000);
        await project.save();

        await AuditLog.create({
            action: "GOVERNANCE_APPROVED",
            actorId: user._id, // Final voter
            resourceId: project._id,
            resourceModel: "Project",
            details: { requestId, extensionDays: request.details.extensionDays }
        });
    } else if (noVotes >= 50) {
        request.status = "REJECTED";
    }

    await request.save();
    return { status: request.status, yesVotes, noVotes };
};
