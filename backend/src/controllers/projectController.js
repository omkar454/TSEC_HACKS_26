import asyncHandler from "express-async-handler";
import * as projectService from "../services/projectService.js";

// @desc    Create a new project
// @route   POST /api/projects
// @access  Creator
export const createProject = asyncHandler(async (req, res) => {
    const project = await projectService.createProjectService(req.user, req.body);
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
