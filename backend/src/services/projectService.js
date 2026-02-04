import Project from "../models/Project.js";
import Wallet from "../models/Wallet.js";
import AuditLog from "../models/AuditLog.js";

export const createProjectService = async (user, projectData) => {
    // 1. Create the project
    const project = new Project({
        ...projectData,
        creatorId: user._id,
        currentFunding: 0,
        status: "DRAFT",
    });

    // 2. Create a Wallet for the project (Fund Pool)
    const wallet = await Wallet.create({
        ownerId: project._id,
        ownerModel: "Project",
        balance: 0,
    });

    project.walletId = wallet._id;
    await project.save();

    // 3. Create Audit Log
    await AuditLog.create({
        action: "CREATE_PROJECT",
        actorId: user._id,
        resourceId: project._id,
        resourceModel: "Project",
        details: { title: project.title, goal: project.fundingGoal },
    });

    return project;
};

export const listProjectsService = async (filters) => {
    // Basic filtering
    return await Project.find(filters).populate("creatorId", "name email");
};

export const getProjectByIdService = async (id) => {
    return await Project.findById(id).populate("creatorId", "name email");
};

export const updateProjectStatusService = async (user, projectId, status) => {
    const project = await Project.findById(projectId);
    if (!project) {
        throw new Error("Project not found");
    }

    // Only Creator or Admin can update status
    if (project.creatorId.toString() !== user._id.toString() && user.role !== "ADMIN") {
        throw new Error("Not authorized to update this project");
    }

    const oldStatus = project.status;
    project.status = status;
    await project.save();

    // Audit Log
    await AuditLog.create({
        action: "UPDATE_PROJECT_STATUS",
        actorId: user._id,
        resourceId: project._id,
        resourceModel: "Project",
        details: { oldStatus, newStatus: status },
    });

    return project;
};

export const deleteProjectService = async (user, projectId) => {
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");

    // Only Admin can delete (reject) projects in this workflow
    if (user.role !== "ADMIN" && project.creatorId.toString() !== user._id.toString()) {
        throw new Error("Not authorized to delete this project");
    }

    // Optional: Check if funds exist before deleting (safety)
    // For MVP/Draft rejection, we assume safe to delete.

    await Project.findByIdAndDelete(projectId);

    // Audit Log
    await AuditLog.create({
        action: "DELETE_PROJECT",
        actorId: user._id,
        resourceId: projectId, // ID is preserved in log even if deleted
        resourceModel: "Project",
        details: { title: project.title, reason: "Admin Rejection / Creator Delete" },
    });

    return { success: true };
};
