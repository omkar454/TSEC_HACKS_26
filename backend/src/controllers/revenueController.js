import asyncHandler from "express-async-handler";
import * as revenueService from "../services/revenueService.js";

// @desc    Submit Revenue (Ingest)
// @route   POST /api/revenue
// @access  Creator
export const submitRevenue = asyncHandler(async (req, res) => {
    const { projectId, ...data } = req.body;
    const proofUrls = req.files ? req.files.map(file => file.path) : [];
    const revenue = await revenueService.extractRevenueService(req.user, projectId, { ...data, proofUrls });
    res.status(201).json(revenue);
});

// @desc    Approve Revenue (Settlement)
// @route   POST /api/revenue/:id/approve
// @access  Admin
export const approveRevenue = asyncHandler(async (req, res) => {
    console.log("Admin approving revenue for ID:", req.params.id);
    const result = await revenueService.approveRevenueService(req.user, req.params.id);
    res.json(result);
});

// @desc    Reject Revenue
// @route   POST /api/revenue/:id/reject
// @access  Admin
export const rejectRevenue = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const result = await revenueService.rejectRevenueService(req.user, req.params.id, reason);
    res.json(result);
});

// @desc    Distribute Revenue (Settlement) - Legacy trigger, now mostly internal
// @route   POST /api/revenue/:id/distribute
// @access  Admin
export const distributeRevenue = async (req, res, next) => {
    try {
        console.log("Distributing revenue for ID:", req.params.id);
        const result = await revenueService.distributeRevenueService(req.user, req.params.id);
        res.json(result);
    } catch (error) {
        console.error("Distribution Error:", error);
        if (typeof next === 'function') {
            next(error);
        } else {
            console.error("CRITICAL: next is not a function inside distributeRevenue controller");
            res.status(500).json({ message: "Internal Server Error: Middleware failure" });
        }
    }
};


// @desc    Get Project Revenue
// @route   GET /api/revenue/project/:projectId
// @access  Public/Private
export const getProjectRevenue = asyncHandler(async (req, res) => {
    const list = await revenueService.getProjectRevenueService(req.user, req.params.projectId);
    res.json(list);
});

// @desc    Get All Pending Revenue
// @route   GET /api/revenue/pending
// @access  Admin
export const getAllPendingRevenue = asyncHandler(async (req, res) => {
    const list = await revenueService.getAllPendingRevenueService(req.user);
    res.json(list);
});
