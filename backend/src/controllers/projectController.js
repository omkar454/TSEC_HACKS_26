import asyncHandler from "express-async-handler";
import * as projectService from "../services/projectService.js";

// @desc    Create a new project
// @route   POST /api/projects
// @access  Creator
export const createProject = asyncHandler(async (req, res) => {
    console.log("Create Project Body:", req.body);
    const projectData = { ...req.body };

    // Parse JSON strings from FormData
    if (typeof projectData.milestones === 'string') {
        try {
            projectData.milestones = JSON.parse(projectData.milestones);
        } catch (e) {
            console.error("Failed to parse milestones JSON:", e);
        }
    }
    if (typeof projectData.fundUsageRules === 'string') {
        try {
            projectData.fundUsageRules = JSON.parse(projectData.fundUsageRules);
        } catch (e) {
            console.error("Failed to parse fundUsageRules JSON:", e);
        }
    }

    if (req.file) {
        projectData.imageUrl = req.file.path;
    }
    const project = await projectService.createProjectService(req.user, projectData);
    res.status(201).json(project);
});

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
export const getProjects = asyncHandler(async (req, res) => {
    const projects = await projectService.listProjectsService({});
    res.json(projects);
});

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Public
export const getProjectById = asyncHandler(async (req, res) => {
    const project = await projectService.getProjectByIdService(req.params.id);
    if (project) {
        res.json(project);
    } else {
        res.status(404);
        throw new Error("Project not found");
    }
});

// @desc    Update project status
// @route   PATCH /api/projects/:id/status
// @access  Creator / Admin
export const updateProjectStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const project = await projectService.updateProjectStatusService(
        req.user,
        req.params.id,
        status
    );
    res.json(project);
});

// @desc    Delete project (Reject)
// @route   DELETE /api/projects/:id
// @access  Admin / Creator
export const deleteProject = asyncHandler(async (req, res) => {
    console.log("DELETE REQUEST RECEIVED FOR ID:", req.params.id);
    await projectService.deleteProjectService(req.user, req.params.id);
    res.json({ message: "Project removed" });
});
// @desc    Submit milestone evidence
// @route   PATCH /api/projects/:id/milestones/:milestoneId/submit
// @access  Creator
export const submitMilestone = asyncHandler(async (req, res) => {
    const { submissionUrl } = req.body;
    const project = await projectService.submitMilestoneService(
        req.user,
        req.params.id,
        req.params.milestoneId,
        submissionUrl
    );
    res.json(project);
});
